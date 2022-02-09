const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');

const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');

module.exports = async (params) => {
  await shareMessageBySubscribers(params.from,
    `${params.from} initiated 'Power Down' on ${params.amount}`,
    `${PRODUCTION_HOST}@${params.from}`);

  return [params.from, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.POWER_DOWN,
    account: params.from,
    block: params.block,
    amonut: params.amount,
  }];
};
