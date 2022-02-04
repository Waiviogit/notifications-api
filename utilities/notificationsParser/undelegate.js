const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');

module.exports = async (params, type) => {
  const notifications = [];
  notifications.push([params.from, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.UNDELEGATE_FROM,
    amount: params.amount,
    memo: params.memo,
    to: params.to,
  }]);

  await shareMessageBySubscribers(params.from,
    `${params.from} ${type} ${params.amount} to ${params.to}`,
    `${PRODUCTION_HOST}@${params.from}/transfers `);

  notifications.push([params.to, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type,
    amount: params.amount,
    from: params.from,
    memo: params.memo,
  }]);

  await shareMessageBySubscribers(params.to,
    `${params.from} ${type} ${params.amount} to ${params.to}`,
    `${PRODUCTION_HOST}@${params.to}/transfers`);

  return notifications;
};
