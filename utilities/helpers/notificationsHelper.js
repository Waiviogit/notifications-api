const _ = require('lodash');
const { getCurrencyFromCoingecko } = require('./requestHelper');
const { userModel, App, bellNotificationsModel } = require('../../models');

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
  _.forEach(users, (el) => {
    notifications.push([el, notificationCopy]);
  });
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
