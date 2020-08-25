const _ = require('lodash');
const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');
const {
  checkUserNotifications, getUsers, parseJson,
} = require('../helpers/notificationsHelper');

module.exports = async (params) => {
  const notifications = [];
  const json = parseJson(params.memo);
  const transferTo = _.get(json, 'id') === 'user_to_guest_transfer' ? json.to : params.to;
  const transferFrom = _.get(json, 'id') === 'demo_user_transfer' ? json.from : params.from;

  const { user, error } = await getUsers({ single: transferTo });
  if (error) {
    console.error(error.message);
    return [];
  }
  /** Add self transfer */
  notifications.push([transferFrom, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.TRANSFER_FROM,
    amount: params.amount,
    memo: params.memo,
    to: transferTo,
  }]);

  await shareMessageBySubscribers(transferFrom,
    `${transferFrom} transfered ${params.amount} to ${transferTo}`,
    `${PRODUCTION_HOST}@${transferFrom}/transfers`);

  if (!await checkUserNotifications({ user, type: NOTIFICATIONS_TYPES.TRANSFER })) {
    return notifications;
  }

  /** Find transfer */
  notifications.push([transferTo, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.TRANSFER,
    amount: params.amount,
    from: transferFrom,
    memo: params.memo,
  }]);

  await shareMessageBySubscribers(transferTo,
    `${transferFrom} transfered ${params.amount} to ${transferTo}`,
    `${PRODUCTION_HOST}@${transferTo}/transfers`);

  return notifications;
};
