const _ = require('lodash');
const { LIMIT, NOTIFICATION_EXPIRY } = require('./constants');
const { clientSend } = require('./wssHelper');
const { redisNotifyClient } = require('../redis/redis');
const { getAmountFromVests } = require('./dsteemHelper');
const { shareMessageBySubscribers } = require('../telegram/broadcasts');
const { getCurrencyFromCoingecko } = require('./requestHelper');
const {
  userModel, App, postModel, subscriptionModel,
} = require('../models');

const fromCustomJSON = async (operation, params) => {
  const notifications = [];
  switch (params.id) {
    case 'follow ':
      const { user, error } = await getUsers({ single: params.json.following });
      if (error) return console.error(error);
      if (!await checkUserNotifications({ user, type: 'follow' })) break;
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
      break;
    case 'reblog':
      const { user: uReblog, error: uReblogErr } = await getUsers({ single: params.json.author });
      if (uReblogErr) return console.error(uReblogErr);
      if (!await checkUserNotifications({ user: uReblog, type: 'reblog' })) break;
      const notificationData = {
        type: 'reblog',
        account: params.json.account,
        permlink: params.json.permlink,
        timestamp: Math.round(new Date().valueOf() / 1000),
        block: operation.block,
      };
      await shareMessageBySubscribers(params.json.author,
        `${params.json.account} reblogged ${params.json.author} post`,
        `https://www.waivio.com/@${params.json.author}/${params.json.permlink}`);
      notifications.push([params.json.author, notificationData]);
      break;
  }
  return notifications;
};

const fromComment = async (operation, params) => {
  const notifications = [];
  let notification;
  const isRootPost = !params.parent_author;
  /** Find replies */
  const { users: authors } = await getUsers({ arr: [params.parent_author, params.author] });
  if (!isRootPost) {
    if (await checkUserNotifications({ user: _.find(authors, { name: params.parent_author }), type: 'reply' })) {
      notification = {
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
    } else if (await checkUserNotifications({ user: _.find(authors, { name: params.author }), type: 'myComment' })) {
      notification = {
        type: 'myComment',
        permlink: params.permlink,
        author: params.author,
        timestamp: Math.round(new Date().valueOf() / 1000),
        block: operation.block,
      };
      await shareMessageBySubscribers(params.author, `${params.author} write a comment`,
        `https://www.waivio.com/@${params.author}/${params.permlink}`);
      notifications.push([params.author, notification]);
    }
  } else if (isRootPost && await checkUserNotifications({ user: _.find(authors, { name: params.author }), type: 'myPost' })) {
    notification = {
      type: 'myPost',
      permlink: params.permlink,
      author: params.author,
      timestamp: Math.round(new Date().valueOf() / 1000),
      block: operation.block,
    };
    await shareMessageBySubscribers(params.author, `${params.author} published a post`,
      `https://www.waivio.com/@${params.author}/${params.permlink}`);
    notifications.push([params.author, notification]);
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
    const { users, error } = await getUsers({ arr: mentions });
    if (error) return console.error(error);
    const serviceBots = await getServiceBots();
    for (const mention of mentions) {
      if (!await checkUserNotifications({ user: _.find(users, { name: mention }), type: 'mention' })) continue;
      if (_.includes(serviceBots || [], params.author)) continue;
      notification = {
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
  const { users, error } = await getUsers({ arr: params.users });
  if (error) return console.error(error);
  for (const user of params.users) {
    if (!await checkUserNotifications({ user: _.find(users, { name: user }), type: 'activationCampaign' })) continue;
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
  const { users, error } = await getUsers({ arr: params.experts });
  if (error) return console.error(error);
  for (const expert of params.experts) {
    if (!await checkUserNotifications({ user: _.find(users, { name: expert }), type: 'status-change' })) continue;
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
      const { user: uWith, error: uWithErr } = await getUsers({ single: params.from_account });
      if (uWithErr) {
        console.error(uWithErr);
        break;
      }
      if (!await checkUserNotifications({ user: uWith, type })) break;
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
      const { user: uFill, error: uFillErr } = await getUsers({ single: params.account });
      if (uFillErr) {
        console.error(uFillErr);
        break;
      }
      if (!await checkUserNotifications({ user: uFill, type })) break;
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
      const { user: uWitness, error: uWitnessErr } = await getUsers({ single: params.witness });
      if (uWitnessErr) {
        console.error(uWitnessErr);
        break;
      }
      if (!await checkUserNotifications({ user: uWitness, type: 'witness_vote' })) break;
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
      const { user: uTransfer, error: getUTransferErr } = await getUsers({ single: params.to });
      if (getUTransferErr) {
        console.error(getUTransferErr);
        break;
      }
      if (!await checkUserNotifications({ user: uTransfer, type, amount: params.amount })) break;
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
      break;
    case 'claimReward':
      const { user: uClaim, error: uClaimErr } = await getUsers({ single: params.account });
      if (uClaimErr) {
        console.error(uClaimErr);
        break;
      }
      if (!await checkUserNotifications({ user: uClaim, type })) break;
      notifications.push([params.account, {
        type: 'claimReward',
        account: params.account,
        rewardHive: params.reward_steem,
        rewardHBD: params.reward_sbd,
        timestamp: Math.round(new Date().valueOf() / 1000),
        block: operation.block,
      }]);
      await shareMessageBySubscribers(params.account,
        `${params.account} claimed reward: ${params.reward_steem}, ${params.reward_sbd}`,
        `https://www.waivio.com/@${params.account}/transfers`);
      break;
    case 'like':
      const usersArr = [...new Set(_.concat(_.map(params.votes, 'author'), _.map(params.votes, 'voter')))];
      const { users } = await getUsers({ arr: usersArr });
      const { posts } = await postModel.find({
        author: { $in: _.map(params.votes, 'author') }, permlink: { $in: _.map(params.votes, 'permlink') },
      }, {
        author: 1, permlink: 1, title: 1, active_votes: 1,
      });

      await prepareLikeNotifications({
        params, users, posts, type, operation, notifications,
      });
      await prepareMyLikeNotifications({
        params, users, posts, notifications, operation,
      });
      break;
  }
  return notifications;
};

const prepareLikeNotifications = async ({
  params, users, posts, type, operation, notifications,
}) => {
  for (const vote of params.votes) {
    if (!await checkUserNotifications({
      user: _.find(users, { name: vote.author }), type,
    })) continue;
    const post = _.find(posts, (el) => el.author === vote.author && el.permlink === vote.permlink);
    if (!post) continue;

    const likesCount = _
      .chain(post.active_votes)
      .filter((v) => v.weight > 0)
      .get('length')
      .value();
    const newTop = [];
    if (likesCount > 10) {
      newTop.push(..._
        .chain(post.active_votes).orderBy(['weight'], 'desc')
        .map(((el) => el.weight))
        .slice(0, 5)
        .value());
      vote.weight > newTop[4] && newTop.push(vote.weight);
    }
    const { result: followVoter } = await subscriptionModel
      .find({ follower: vote.author, following: vote.voter });
    if (likesCount > 10 && vote.weight < _.get(newTop, '4', 0) && !followVoter) continue;

    const notification = [vote.author, {
      type,
      voter: vote.voter,
      likesCount,
      title: post.title,
      newTop,
      author: vote.author,
      permlink: vote.permlink,
      timestamp: Math.round(new Date().valueOf() / 1000),
      block: operation.block,
    }];
    if (notifications.length) {
      const samePostLike = _.findLast(
        notifications, (el) => el[1].author === vote.author && el[1].permlink === vote.permlink,
      );

      if (samePostLike) {
        const topArr = samePostLike[1].newTop.sort(((a, b) => b - a));
        if (followVoter || vote.weight > _.get(topArr, '4', 0)) {
          topArr.push(vote.weight);
          notification[1].newTop = topArr;
          notification[1].likesCount = samePostLike[1].likesCount + 1;
          notifications.push(notification);
          continue;
        }
        continue;
      } else {
        notifications.push(notification);
        continue;
      }
    }
    notifications.push(notification);
  }
};

const prepareMyLikeNotifications = async ({
  params, users, posts, notifications, operation,
}) => {
  for (const vote of params.votes) {
    if (!await checkUserNotifications({
      user: _.find(users, { name: vote.voter }), type: 'myLike',
    })) continue;
    const post = _.find(posts, (el) => el.author === vote.author && el.permlink === vote.permlink);
    if (!post) continue;
    notifications.push([vote.voter, {
      type: 'myLike',
      title: post.title,
      voter: vote.voter,
      author: vote.author,
      permlink: vote.permlink,
      timestamp: Math.round(new Date().valueOf() / 1000),
      block: operation.block,
    }]);
  }
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

const getServiceBots = async () => {
  const name = process.env.NODE_ENV === 'production' ? 'waivio' : 'waiviodev';
  const { app, error: appError } = await App
    .getOne({ condition: { name }, select: { service_bots: 1 } });
  if (appError) return console.error(appError);
  return _
    .chain(app.service_bots)
    .filter((el) => _.includes(el.roles, 'serviceBot'))
    .map((el) => el.name)
    .value();
};

const getUsers = async ({ arr, single }) => {
  const { users, error } = await userModel.findByNames(arr || [single]);
  if (error) return { error };
  if (single) return { user: users[0] };
  return { users };
};

const checkUserNotifications = async ({ user, type, amount }) => {
  if (amount) {
    const value = amount.split(' ')[0];
    const cryptoType = amount.split(' ')[1];
    const { usdCurrency, error: getRateError } = await getCurrencyFromCoingecko(cryptoType);
    if (getRateError) return true;
    const minimalTransfer = _.get(user, 'user_metadata.settings.userNotifications.minimalTransfer');
    if (!minimalTransfer) return true;
    return value * usdCurrency >= minimalTransfer.toFixed(3);
  }
  return _.get(user, `user_metadata.settings.userNotifications[${type}]`, true);
};

const setNotifications = async ({ params }) => {
  const notifications = await getNotifications(params);
  const redisOps = prepareDataForRedis(notifications);
  await redisNotifyClient.multi(redisOps).execAsync();
  clientSend(notifications);
};

module.exports = { getNotifications, prepareDataForRedis, setNotifications };
