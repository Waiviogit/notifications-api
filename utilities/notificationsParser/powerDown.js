const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');

const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');

module.exports = async (operation, params) => {
  await shareMessageBySubscribers(params.from,
    `You initiated 'Power Down' on ${params.amount}`,
    `${PRODUCTION_HOST}@${params.account}`);

  return [params.from, Object.assign(params, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.WITHDRAW_VESTING,
  })];
};
