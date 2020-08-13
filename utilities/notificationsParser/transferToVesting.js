const { checkUserNotifications, getUsers } = require('../helpers/notificationsHelper');
const { NOTIFICATIONS_TYPES } = require('../../constants/notificationTypes');
const { shareMessageBySubscribers } = require('../../telegram/broadcasts');
const { PRODUCTION_HOST } = require('../../constants');

module.exports = async (params) => {
  const { user, error } = await getUsers({ single: params.from });

  if (error) {
    console.error(error.message);
    return [];
  }
  if (!await checkUserNotifications({ user, type: 'powerUp' })) return [];

  await shareMessageBySubscribers(params.from,
    `Account ${params.from} powered up ${params.amount} to ${params.to}`,
    `${PRODUCTION_HOST}@${params.from}/transfers`);

  return [params.from, Object.assign(params, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.TRANSFER_TO_VESTING,
  })];
};
