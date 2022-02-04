const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');

const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');

module.exports = async (operation, params) => {
  await shareMessageBySubscribers(params.account,
    `${params.account} initiated PowerDown on ${params.amount}`,
    `${PRODUCTION_HOST}@${params.account}`);

  return [params.account, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.POWER_DOWN,
    account: params.account,
    block: operation.block,
    amount: params.amount,
  }];
};
