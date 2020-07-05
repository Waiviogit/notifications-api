const _ = require('lodash');
const { LIMIT, NOTIFICATION_EXPIRY } = require('./constants');
const { clientSend } = require('./wssHelper');
const { redisNotifyClient } = require('../redis/redis');
const { getAmountFromVests } = require('./dsteemHelper');
const { shareMessageBySubscribers } = require('../telegram/broadcasts');

const fromCustomJSON = async (operation, params) => {
  const notifications = [];
  if (params.id === 'follow') {
    const notification = {
      type: 'follow',
      follower: params.json.follower,
      timestamp: Math.round(new Date().valueOf() / 1000),
      block: operation.block,
    };
    await shareMessageBySubscribers(params.json.following,
      `${params.json.follower} started following ${params.json.following}`,
      `https://www.waivio.com/@${params.json.following}/followers`);
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
    await shareMessageBySubscribers(params.json.author,
      `${params.json.account} reblogged ${params.json.author} post`,
      `https://www.waivio.com/@${params.json.author}/${params.json.permlink}`);
    notifications.push([params.json.author, notification]);
  }
  return notifications;
};


const fromComment = async (operation, params) => {
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
    await shareMessageBySubscribers(params.parent_author,
      `${params.author} replied to ${params.parent_author} comment`,
      `https://www.waivio.com/@${params.parent_author}/${params.parent_permlink}`);
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
    for (const mention of mentions) {
      const notification = {
        type: 'mention',
        is_root_post: isRootPost,
        author: params.author,
        permlink: params.permlink,
        timestamp: Math.round(new Date().valueOf() / 1000),
        block: operation.block,
      };
      await shareMessageBySubscribers(mention,
        `${params.author} mentioned ${mention} in a comment`,
        `https://www.waivio.com/@${params.author}/${params.permlink}`);
      notifications.push([mention, notification]);
    }
  }
  return notifications;
};

const fromActivationCampaign = async (operation, params) => {
  const notifications = [];
  for (const user of params.users) {
    const notification = {
      type: 'activationCampaign',
      author: params.guide,
      account: user,
      object_name: params.object_name,
      author_permlink: params.author_permlink,
      timestamp: Math.round(new Date().valueOf() / 1000),
      block: operation.block,
    };
    notifications.push([user, notification]);
    await shareMessageBySubscribers(user,
      `${params.guide} launched a new campaign for ${params.object_name}`,
      `https://www.waivio.com/object/${params.author_permlink}`);
  }
  return notifications;
};

const fromRestaurantStatus = async (operation, params) => {
  const notifications = [];
  for (const expert of params.experts) {
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
    await shareMessageBySubscribers(expert,
      `${_.get(params, 'voter', params.creator)} marked ${params.object_name} as ${params.newStatus}`,
      `https://www.waivio.com/object/${params.author_permlink}`);
  }
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
  await shareMessageBySubscribers(params.account,
    `${params.account} initiated PowerDown on ${amount}`,
    `https://www.waivio.com/@${params.account}`);
  return [params.account, notification];
};

const getNotifications = async (operation) => {
  let notifications = [];
  const type = operation.id;
  const params = operation.data;
  switch (type) {
    case 'transfer_from_savings':
      notifications.push([params.from, Object.assign(params, { type: 'transfer_from_savings', timestamp: Math.round(new Date().valueOf() / 1000) })]);
      await shareMessageBySubscribers(params.from,
        `Account ${params.from} initiated a power down on the Saving account to ${params.to}`,
        `https://www.waivio.com/@${params.from}`);
      break;
    case 'change_recovery_account':
      notifications.push([params.account_to_recover, Object.assign(params, { type: 'change_recovery_account', timestamp: Math.round(new Date().valueOf() / 1000) })]);
      await shareMessageBySubscribers(params.account_to_recover,
        `Account ${params.account_to_recover} changed recovery address to ${params.new_recovery_account}`,
        `https://www.waivio.com/@${params.account_to_recover}`);
      break;
    case 'transfer_to_vesting':
      notifications.push([params.from, Object.assign(params, { type: 'transfer_to_vesting', timestamp: Math.round(new Date().valueOf() / 1000) })]);
      await shareMessageBySubscribers(params.from,
        `Account ${params.from} powered up ${params.amount} to ${params.to}`,
        `https://www.waivio.com/@${params.from}/transfers`);
      break;
    case 'changePassword':
      notifications.push([params.account, Object.assign(params, { type: 'changePassword', timestamp: Math.round(new Date().valueOf() / 1000) })]);
      await shareMessageBySubscribers(params.account,
        `Account ${params.account} initiated a password change procedure`,
        `https://www.waivio.com/@${params.account}`);
      break;
    case 'withdraw_route':
      notifications.push([params.from_account, Object.assign(params, { type: 'withdraw_route', timestamp: Math.round(new Date().valueOf() / 1000) })]);
      await shareMessageBySubscribers(params.from_account,
        `Account ${params.to_account} registered withdraw route for ${params.from_account} account`,
        `https://www.waivio.com/@${params.from_account}`);
      break;
    case 'suspendedStatus':
      notifications.push([params.sponsor, Object.assign(params, { type: 'suspendedStatus', timestamp: Math.round(new Date().valueOf() / 1000) })]);
      await shareMessageBySubscribers(params.sponsor,
        `After ${params.days} days ${params.sponsor} campaigns will be blocked, please pay the debt for the review https://www.waivio.com/@${params.reviewAuthor}/${params.reviewPermlink}`,
        'https://www.waivio.com/rewards/payables');
      break;
    case 'rejectUpdate':
      notifications.push([params.creator, {
        type,
        account: params.creator,
        voter: params.voter,
        author_permlink: params.author_permlink,
        object_name: params.object_name,
        parent_permlink: params.parent_permlink,
        parent_name: params.parent_name,
        fieldName: params.fieldName,
        timestamp: Math.round(new Date().valueOf() / 1000),
        block: operation.block,
      }]);
      await shareMessageBySubscribers(params.creator,
        `${params.voter} rejected ${params.creator} update for ${params.object_name}`,
        `https://www.waivio.com/object/${params.author_permlink}/updates/${params.fieldName}`);
      break;
    case 'activateCampaign':
      notifications = _.concat(notifications, await fromActivationCampaign(operation, params));
      break;
    case 'restaurantStatus':
      notifications = _.concat(notifications, await fromRestaurantStatus(operation, params));
      break;
    case 'comment':
      notifications = _.concat(notifications, await fromComment(operation, params));
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
      await shareMessageBySubscribers(params.account,
        `${params.account} bought ${params.current_pays} and get ${params.open_pays} from ${params.exchanger}`,
        `https://www.waivio.com/@${params.account}/transfers`);
      break;
    case 'custom_json':
      notifications = _.concat(notifications, await fromCustomJSON(operation, params));
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
      await shareMessageBySubscribers(params.to,
        `${params.from} transfered ${params.amount} to ${params.to}`,
        `https://www.waivio.com/@${params.to}/transfers`);
      notifications.push([params.from, {
        type: 'transferFrom',
        to: params.to,
        amount: params.amount,
        memo: params.memo,
        timestamp: Math.round(new Date().valueOf() / 1000),
        block: operation.block,
      }]);
      await shareMessageBySubscribers(params.from,
        `${params.from} transfered ${params.amount} to ${params.to}`,
        `https://www.waivio.com/@${params.from}/transfers`);
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
