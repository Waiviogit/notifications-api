const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');

module.exports = async (params, type, from) => {
  const notifications = [];

  notifications.push([params.from, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: from,
    amount: params.amount,
    memo: params.memo,
    to: params.to,
  }]);

  await shareMessageBySubscribers(params.from,
    `${params.from} ${type} ${params.amount} to ${params.to}`,
    `${PRODUCTION_HOST}@${params.from}/${type} `);

  notifications.push([params.to, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type,
    amount: params.amount,
    from: params.from,
    memo: params.memo,
  }]);

  await shareMessageBySubscribers(params.to,
    `${params.from} ${type}  ${params.amount} to ${params.to}`,
    `${PRODUCTION_HOST}@${params.to}/${type} `);

  return notifications;
};
3
