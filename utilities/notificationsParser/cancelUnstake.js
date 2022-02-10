const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');

const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');

module.exports = async (params) => {
  await shareMessageBySubscribers(params.account,
    `${params.account} canceled power down on ${params.amount}`,
    `${PRODUCTION_HOST}@${params.account}`);

  return [params.account, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.CANCEL_UNSTAKE,
    account: params.account,
    amount: params.amount,
  }];
};
