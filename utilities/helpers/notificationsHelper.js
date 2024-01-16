const _ = require('lodash');
const config = require('config');
const { PRODUCTION_HOST } = require('constants/index');
const {
  userModel, App, subscriptionModel, wobjectSubscriptionModel,
} = require('models');
const { BELL_NOTIFICATIONS } = require('constants/notificationTypes');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { getLastPriceRequest } = require('./getLastPriceRequest');
const { getCurrencyFromCoingecko } = require('./requestHelper');
const { NOTIFICATIONS_TYPES } = require('../../constants/notificationTypes');

const parseJson = (json) => {
  try {
    return JSON.parse(json);
  } catch (error) {
    return {};
  }
};

/*
  in this method, we check if the user has subscribers who follow him on waivio (bell notifications)
  and add them to notifications array that will be send on waivio
 */
const addNotificationForSubscribers = async ({
  user, notifications, notificationData, changeType,
}) => {
  const { users, error } = await subscriptionModel.getBellFollowers({ following: user });
  if (error) return console.error(error.message);
  if (!users.length) return;
  const notificationCopy = { ...notificationData };
  notificationCopy.type = changeType;
  const telegramData = formTelegramData(notificationCopy);
  for (const el of users) {
    notifications.push([el, notificationCopy]);
    await shareMessageBySubscribers(el, telegramData.message, telegramData.url);
  }
};

const formTelegramData = (notification) => {
  switch (notification.type) {
    case BELL_NOTIFICATIONS.BELL_FOLLOW:
      return {
        message: `${notification.follower} followed ${notification.following}`,
        url: `${PRODUCTION_HOST}@${notification.following}/followers`,
      };
    case BELL_NOTIFICATIONS.BELL_POST:
      return {
        message: `New post by ${notification.author}: ${notification.title}`,
        url: `${PRODUCTION_HOST}@${notification.author}/${notification.permlink}`,
      };
    case BELL_NOTIFICATIONS.BELL_REBLOG:
      return {
        message: `${notification.account} re-blogged ${notification.author}'s post: ${notification.title}`,
        url: `${PRODUCTION_HOST}@${notification.author}/${notification.permlink}`,
      };
  }
};

const getServiceBots = async () => {
  const { app, error: appError } = await App
    .getOne({ condition: { host: config.appHost }, select: { service_bots: 1 } });
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
    const [value, cryptoType] = amount.split(' ');
    const { usdCurrency, error: getRateError } = await getCurrencyFromCoingecko(cryptoType);
    if (getRateError) return true;
    const minimalTransfer = _.get(user, 'user_metadata.settings.userNotifications.minimalTransfer');
    if (!minimalTransfer) return true;
    if (cryptoType !== 'HIVE' && cryptoType !== 'HBD') {
      const { lastPrice, error } = await getLastPriceRequest({ symbol: cryptoType });
      if (error) return;
      return value * usdCurrency * lastPrice >= minimalTransfer.toFixed(3);
    }

    return value * usdCurrency >= minimalTransfer.toFixed(3);
  }
  return _.get(user, `user_metadata.settings.userNotifications[${type}]`, false);
};

const addNotificationsWobjectSubscribers = async ({
  wobjects, permlink, author, title,
}) => {
  const wobjNotifications = [];

  for (const wobject of wobjects) {
    const { users } = await wobjectSubscriptionModel
      .getBellFollowers({ following: wobject.author_permlink });
    if (_.isEmpty(users)) continue;
    const notification = {
      timestamp: Math.round(new Date().valueOf() / 1000),
      wobjectPermlink: wobject.author_permlink,
      type: BELL_NOTIFICATIONS.BELL_WOBJ_POST,
      wobjectName: wobject.name,
      permlink,
      author,
      title,
    };

    for (const user of users) {
      wobjNotifications.push([user, notification]);
      await shareMessageBySubscribers(
        user,
        `${author} referenced ${wobject.name}`,
        `${PRODUCTION_HOST}object/${wobject.author_permlink}`,
      );
    }
  }
  return { wobjNotifications };
};

const getThreadBellNotifications = async (thread) => {
  const notifications = [];
  for (const wobject of thread.hashtags) {
    const { users } = await wobjectSubscriptionModel
      .getBellFollowers({ following: wobject });
    if (_.isEmpty(users)) continue;
    const notification = {
      timestamp: Math.round(new Date().valueOf() / 1000),
      authorPermlink: wobject,
      type: BELL_NOTIFICATIONS.BELL_THREAD,
      permlink: thread.permlink,
      author: thread.author,
    };
    for (const user of users) {
      notifications.push([user, notification]);
    }
  }
  return notifications;
};

const getThreadAuthorSubscriptions = async (thread) => {
  const notifications = [];

  const { users } = await subscriptionModel.getFollowers({ following: thread.author });
  const notification = {
    timestamp: Math.round(new Date().valueOf() / 1000),
    hashtags: thread.hashtags,
    type: NOTIFICATIONS_TYPES.THREAD_AUTHOR_FOLLOWER,
    permlink: thread.permlink,
    author: thread.author,
  };

  const { users: fullUsers } = await userModel.findByNames(users);
  for (const fullUser of fullUsers) {
    if (!await checkUserNotifications({ user: fullUser, type: NOTIFICATIONS_TYPES.THREAD_AUTHOR_FOLLOWER })) {
      continue;
    }
    notifications.push([fullUser.name, notification]);
  }

  return notifications;
};

const campaginStatusNotification = (notificationParams, user, type) => ({
  timestamp: Math.round(new Date().valueOf() / 1000),
  type,
  author_permlink: notificationParams.author_permlink,
  object_name: notificationParams.object_name,
  author: notificationParams.guide,
  account: user,
  ...(notificationParams.newCampaigns && { newCampaigns: notificationParams.newCampaigns }),
  ...(notificationParams.reach && { reach: notificationParams.reach }),
});

module.exports = {
  addNotificationsWobjectSubscribers,
  addNotificationForSubscribers,
  campaginStatusNotification,
  checkUserNotifications,
  getServiceBots,
  parseJson,
  getUsers,
  getThreadBellNotifications,
  getThreadAuthorSubscriptions,
};
