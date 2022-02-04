const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { getAmountFromVests } = require('utilities/helpers/dsteemHelper');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');

module.exports = async (params) => {
  const notifications = [];
  const check = params.amount.split(' ');
  const amount = (check[1] === 'VESTS') ? await getAmountFromVests(params.amount) : params.amount;
  notifications.push([params.from, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.DELEGATE_FROM,
    amount,
    memo: params.memo,
    to: params.to,
  }]);

  await shareMessageBySubscribers(params.from,
    `${params.from} delegated ${params.amount} to ${params.to}`,
    `${PRODUCTION_HOST}@${params.from}/transfers `);

  notifications.push([params.to, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.DELEGATE,
    amount,
    from: params.from,
    memo: params.memo,
  }]);

  await shareMessageBySubscribers(params.to,
    `${params.from} delegated ${params.amount} to ${params.to}`,
    `${PRODUCTION_HOST}@${params.to}/transfers`);

  return notifications;
};
