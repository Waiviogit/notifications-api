const { checkUserNotifications, getUsers } = require('../helpers/notificationsHelper');
const { NOTIFICATIONS_TYPES } = require('../../constants/notificationTypes');
const { shareMessageBySubscribers } = require('../../telegram/broadcasts');
const { PRODUCTION_HOST } = require('../../constants');

module.exports = async (params) => {
  const { user, error } = await getUsers({ single: params.from_account });

  if (error) {
    console.error(error.message);
    return [];
  }

  if (!await checkUserNotifications({ user, type: NOTIFICATIONS_TYPES.WITHDRAW_ROUTE })) {
    return [];
  }

  await shareMessageBySubscribers(params.from_account,
    `Account ${params.to_account} registered withdraw route for ${params.from_account} account`,
    `${PRODUCTION_HOST}@${params.from_account}`);

  return [params.from_account, Object.assign(params, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.WITHDRAW_ROUTE,
  })];
};
