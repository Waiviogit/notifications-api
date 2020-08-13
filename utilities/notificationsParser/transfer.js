const _ = require('lodash');
const { PRODUCTION_HOST } = require('../../constants');
const { shareMessageBySubscribers } = require('../../telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('../../constants/notificationTypes');
const {
  checkUserNotifications, getUsers, parseJson,
} = require('../helpers/notificationsHelper');

module.exports = async (params) => {
  const notifications = [];
  const json = parseJson(params.memo);
  const transferTo = _.get(json, 'id') === 'user_to_guest_transfer' ? json.to : params.to;

  const { user, error } = await getUsers({ single: transferTo });
  if (error) {
    console.error(error.message);
    return [];
  }
  if (!await checkUserNotifications({ user, type: NOTIFICATIONS_TYPES.TRANSFER })) return [];

  /** Find transfer */
  notifications.push([transferTo, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.TRANSFER,
    amount: params.amount,
    from: params.from,
    memo: params.memo,
  }]);

  await shareMessageBySubscribers(transferTo,
    `${params.from} transfered ${params.amount} to ${transferTo}`,
    `${PRODUCTION_HOST}@${transferTo}/transfers`);

  /** Add self transfer */
  notifications.push([params.from, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.TRANSFER_FROM,
    amount: params.amount,
    memo: params.memo,
    to: transferTo,
  }]);

  await shareMessageBySubscribers(params.from,
    `${params.from} transfered ${params.amount} to ${transferTo}`,
    `${PRODUCTION_HOST}@${params.from}/transfers`);

  return notifications;
};
