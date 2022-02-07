const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');

module.exports = async (params) => {
  const notifications = [];
  notifications.push([params.from, {
    type: NOTIFICATIONS_TYPES.UNDELEGATE,
    timestamp: Math.round(new Date().valueOf() / 1000),
    amount: params.amount,
    memo: params.memo,
    to: params.to,
  }]);

  await shareMessageBySubscribers(params.from,
    `You started undelegation ${params.amount} to ${params.to}`,
    `${PRODUCTION_HOST}@${params.from}/transfers `);

  notifications.push([params.to, {
    type: NOTIFICATIONS_TYPES.UNDELEGATE,
    timestamp: Math.round(new Date().valueOf() / 1000),
    amount: params.amount,
    from: params.from,
    memo: params.memo,
  }]);

  await shareMessageBySubscribers(params.to,
    `${params.from} started undelegation ${params.amount} to you`,
    `${PRODUCTION_HOST}@${params.to}/transfers`);

  return notifications;
};
