const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');
const { checkUserNotifications, getUsers } = require('utilities/helpers/notificationsHelper');

module.exports = async (params) => {
  const { user, error } = await getUsers({ single: params.from });

  if (error) {
    console.error(error.message);
    return [];
  }
  if (!await checkUserNotifications({ user, type: 'powerUp' })) return [];

  await shareMessageBySubscribers(params.from,
    `${params.from} initiated 'Power Up' on ${params.amount} to ${params.to}`,
    `${PRODUCTION_HOST}@${params.from}/transfers`);

  return [params.from, Object.assign(params, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.TRANSFER_TO_VESTING,
  })];
};
