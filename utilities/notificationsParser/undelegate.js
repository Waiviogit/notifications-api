const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');

module.exports = async (params) => {
  const notifications = [];
  notifications.push([params.from, {
    type: NOTIFICATIONS_TYPES.UNDELEGATE,
    timestamp: Math.round(new Date().valueOf() / 1000),
    amount: params.amount,
    to: params.to,
  }]);

  await shareMessageBySubscribers(params.from,
    `${params.from} undelegated ${params.amount} to ${params.to}`,
    `${PRODUCTION_HOST}@${params.from}/transfers `);

  notifications.push([params.to, {
    type: NOTIFICATIONS_TYPES.UNDELEGATE,
    timestamp: Math.round(new Date().valueOf() / 1000),
    amount: params.amount,
    from: params.from,
  }]);

  await shareMessageBySubscribers(params.to,
    `${params.from} undelegated ${params.amount} to ${params.to}`,
    `${PRODUCTION_HOST}@${params.to}/transfers`);

  return notifications;
};
