const _ = require('lodash');
const { PRODUCTION_HOST } = require('constants/index');
const { userModel, App, bellNotificationsModel } = require('models');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { BELL_NOTIFICATIONS } = require('constants/notificationTypes');
const { getCurrencyFromCoingecko } = require('./requestHelper');

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
  const { users, error } = await bellNotificationsModel.getFollowers({ following: user });
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
        message: `${notification.author} published a new post: ${notification.title}`,
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
    const [value, cryptoType] = amount.split(' ');
    const { usdCurrency, error: getRateError } = await getCurrencyFromCoingecko(cryptoType);
    if (getRateError) return true;
    const minimalTransfer = _.get(user, 'user_metadata.settings.userNotifications.minimalTransfer');
    if (!minimalTransfer) return true;
    return value * usdCurrency >= minimalTransfer.toFixed(3);
  }
  return _.get(user, `user_metadata.settings.userNotifications[${type}]`, true);
};

module.exports = {
  addNotificationForSubscribers,
  checkUserNotifications,
  getServiceBots,
  parseJson,
  getUsers,
};
