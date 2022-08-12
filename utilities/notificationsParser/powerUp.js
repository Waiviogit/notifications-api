const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');
const { checkUserNotifications, getUsers } = require('utilities/helpers/notificationsHelper');

module.exports = async (params) => {
  const notifications = [];
  const payload = Object.assign(params, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.TRANSFER_TO_VESTING,
  });
  if (params.from === params.to) notifications.push(await getUserNotifications(params, payload));
  else notifications.push(...await getUsersNotifications(params, payload));

  return notifications;
};

const getUserNotifications = async (params, payload) => {
  const { user, error } = await getUsers({ single: params.from });

  if (error) {
    console.error(error.message);
    return [];
  }
  if (!await checkUserNotifications({ user, type: 'powerUp' })) return [];

  await shareMessageBySubscribers(params.from,
    `${params.from} initiated 'Power Up' on ${params.amount} `,
    `${PRODUCTION_HOST}@${params.from}/transfers`);

  return [params.from, payload];
};

const getUsersNotifications = async (params, payload) => {
  const notifications = [];
  const { users, error } = await getUsers({ arr: [params.from, params.to] });

  if (error) {
    console.error(error.message);

    return [];
  }
  for (const user of users) {
    if (!await checkUserNotifications({ user, type: 'powerUp' })) break;

    await shareMessageBySubscribers(user.name,
      `${params.from} initiated 'Power Up' on ${params.amount} to ${params.to}`,
      `${PRODUCTION_HOST}@${user.name}/transfers`);
    notifications.push([user.name, payload]);
  }

  return notifications;
};
