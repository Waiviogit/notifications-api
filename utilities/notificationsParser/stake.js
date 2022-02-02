const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');

module.exports = async (params, type) => {
  const notifications = [];

  notifications.push([params.account, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type,
    amount: params.amount,
    account: params.account,
  }]);

  await shareMessageBySubscribers(params.account,
    `${params.account} power up ${params.amount} `,
    `${PRODUCTION_HOST}@${params.account}/${type}`);

  return notifications;
};
