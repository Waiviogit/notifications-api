const _ = require('lodash');
const { LIMIT, NOTIFICATION_EXPIRY } = require('./constants');
const { clientSend } = require('./wssHelper');
const { redisNotifyClient } = require('../redis/redis');
const { getAmountFromVests } = require('./dsteemHelper');

const fromCustomJSON = (operation, params) => {
  const notifications = [];
  if (params.id === 'follow') {
    const notification = {
      type: 'follow',
      follower: params.json.follower,
      timestamp: Math.round(new Date().valueOf() / 1000),
      block: operation.block,
    };
    notifications.push([params.json.following, notification]);
  }
  if (params.id === 'reblog') {
    const notification = {
      type: 'reblog',
      account: params.json.account,
      permlink: params.json.permlink,
      timestamp: Math.round(new Date().valueOf() / 1000),
      block: operation.block,
    };
    notifications.push([params.json.author, notification]);
  }
  return notifications;
};


const fromComment = (operation, params) => {
  const notifications = [];
  const isRootPost = !params.parent_author;
  /** Find replies */
  if (!isRootPost) {
    const notification = {
      type: 'reply',
      parent_permlink: params.parent_permlink,
      author: params.author,
      permlink: params.permlink,
      timestamp: Math.round(new Date().valueOf() / 1000),
      block: operation.block,
      reply: params.reply,
    };
    notifications.push([params.parent_author, notification]);
  }

  /** Find mentions */
  const pattern = /(@[a-z][\_\-.a-z\d]+[a-z\d])/gi;
  const content = `${params.title} ${params.body}`;
  const mentions = _
    .without(
      _
        .uniq(
          (content.match(pattern) || [])
            .join('@')
            .toLowerCase()
            .split('@'),
        )
        .filter((n) => n),
      params.author,
    )
    .slice(0, 9); // Handle maximum 10 mentions per post
  if (mentions.length) {
    mentions.forEach((mention) => {
      const notification = {
        type: 'mention',
        is_root_post: isRootPost,
        author: params.author,
        permlink: params.permlink,
        timestamp: Math.round(new Date().valueOf() / 1000),
        block: operation.block,
      };
      notifications.push([mention, notification]);
    });
  }
  return notifications;
};

const fromRestaurantStatus = (operation, params) => {
  const notifications = [];
  _.forEach(params.experts, (expert) => {
    const notification = {
      type: 'status-change',
      author: _.get(params, 'voter', params.creator),
      account: expert,
      object_name: params.object_name,
      author_permlink: params.author_permlink,
      oldStatus: params.oldStatus,
      newStatus: params.newStatus,
      timestamp: Math.round(new Date().valueOf() / 1000),
      block: operation.block,
    };
    notifications.push([expert, notification]);
  });
  return notifications;
};

const withdraw = async (operation, params) => {
  const amount = await getAmountFromVests(params.vesting_shares);
  const notification = {
    type: 'power_down',
    account: params.account,
    amount,
    timestamp: Math.round(new Date().valueOf() / 1000),
    block: operation.block,
  };
  return [params.account, notification];
};

const getNotifications = async (operation) => {
  let notifications = [];
  const type = operation.id;
  const params = operation.data;
  switch (type) {
    case 'restaurantStatus':
      notifications = _.concat(notifications, fromRestaurantStatus(operation, params));
      break;
    case 'comment':
      notifications = _.concat(notifications, fromComment(operation, params));
      break;
    case 'fillOrder':
      notifications.push([params.account, {
        type,
        account: params.account,
        current_pays: params.current_pays,
        timestamp: Math.round(params.timestamp / 1000),
        open_pays: params.open_pays,
        block: operation.block,
        exchanger: params.exchanger,
        orderId: params.orderId,
      }]);
      break;
    case 'custom_json':
      notifications = _.concat(notifications, fromCustomJSON(operation, params));
      break;
    case 'account_witness_vote':
      /** Find witness vote */
      notifications.push([params.witness, {
        type: 'witness_vote',
        account: params.account,
        approve: params.approve,
        timestamp: Math.round(new Date().valueOf() / 1000),
        block: operation.block,
      }]);
      break;
    case 'transfer':
      /** Find transfer */
      notifications.push([params.to, {
        type: 'transfer',
        from: params.from,
        amount: params.amount,
        memo: params.memo,
        timestamp: Math.round(new Date().valueOf() / 1000),
        block: operation.block,
      }]);
      break;
    case 'withdraw_vesting':
      notifications.push(await withdraw(operation, params));
  }
  return notifications;
};


const prepareDataForRedis = (notifications) => {
  const redisOps = [];
  notifications.forEach((notification) => {
    const key = `notifications:${notification[0]}`;
    redisOps.push([
      'lpush',
      key,
      JSON.stringify(notification[1]),
    ]);
    redisOps.push(['expire', key, NOTIFICATION_EXPIRY]);
    redisOps.push(['ltrim', key, 0, LIMIT - 1]);
  });
  return redisOps;
};


const setNotifications = async ({ params }) => {
  const notifications = await getNotifications(params);
  const redisOps = prepareDataForRedis(notifications);
  await redisNotifyClient.multi(redisOps).execAsync();
  clientSend(notifications);
};

module.exports = { getNotifications, prepareDataForRedis, setNotifications };
