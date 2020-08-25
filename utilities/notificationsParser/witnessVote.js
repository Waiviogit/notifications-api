const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');
const { checkUserNotifications, getUsers } = require('utilities/helpers/notificationsHelper');

module.exports = async (params) => {
  const { user, error } = await getUsers({ single: params.witness });

  if (error) {
    console.error(error.message);
    return [];
  }

  if (!await checkUserNotifications({ user, type: NOTIFICATIONS_TYPES.WITNESS_VOTE })) {
    return [];
  }

  return [params.witness, {
    type: NOTIFICATIONS_TYPES.WITNESS_VOTE,
    account: params.account,
    approve: params.approve,
    timestamp: Math.round(new Date().valueOf() / 1000),
  }];
};
