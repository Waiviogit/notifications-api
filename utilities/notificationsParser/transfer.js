const _ = require('lodash');
const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');
const {
  checkUserNotifications, getUsers, parseJson,
} = require('utilities/helpers/notificationsHelper');

const transferToGuestTypes = ['guest_reward', 'user_to_guest_transfer', 'transferToGuest', 'guestCampaignReward'];
const transferFromGuestTypes = ['demo_user_transfer', 'transferFromGuest', 'waivio_guest_transfer'];

module.exports = async (params) => {
  const notifications = [];
  const json = parseJson(params.memo);
  const transferTo = _.includes(transferToGuestTypes, _.get(json, 'id')) ? json.to : params.to;
  const transferFrom = _.includes(transferFromGuestTypes, _.get(json, 'id')) ? json.from : params.from;

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
    `${transferFrom} transferred ${params.amount} to ${transferTo}`,
    `${PRODUCTION_HOST}@${transferFrom}/transfers`);

  if (!await checkUserNotifications({ user, type: NOTIFICATIONS_TYPES.TRANSFER, amount: params.amount })) {
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
    `${transferFrom} transferred ${params.amount} to ${transferTo}`,
    `${PRODUCTION_HOST}@${transferTo}/transfers`);

  return notifications;
};
