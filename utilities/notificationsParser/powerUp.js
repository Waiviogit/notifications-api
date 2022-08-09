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

  if (params.from === params.to) {
    await shareMessageBySubscribers(params.from,
      `${params.from} initiated 'Power Up' on ${params.amount} `,
      `${PRODUCTION_HOST}@${params.from}/transfers`);

    return [params.from, Object.assign(params, {
      timestamp: Math.round(new Date().valueOf() / 1000),
      type: NOTIFICATIONS_TYPES.TRANSFER_TO_VESTING,
    })];
  }

  const message = `${params.from} delegated ${params.amount} to ${params.to}`;
  let url = `${PRODUCTION_HOST}@${params.from}/transfers`;
  await shareMessageBySubscribers(params.from, message, url);
  url = `${PRODUCTION_HOST}@${params.to}/transfers`;
  await shareMessageBySubscribers(params.to, message, url);
  const payload = Object.assign(params, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.TRANSFER_TO_VESTING,
  });
  const notifications = [[params.from, payload], [params.to, payload]];

  return notifications;
};
