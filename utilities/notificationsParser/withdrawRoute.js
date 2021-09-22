const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');
const { checkUserNotifications, getUsers } = require('utilities/helpers/notificationsHelper');

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
    `${params.from_account} canceled withdraw route to ${params.to_account}`,
    `${PRODUCTION_HOST}@${params.from_account}`);

  return [params.from_account, Object.assign(params, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.WITHDRAW_ROUTE,
  })];
};
