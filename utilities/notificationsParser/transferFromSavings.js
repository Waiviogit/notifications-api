const { PRODUCTION_HOST } = require('constants/index');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');
const { shareMessageBySubscribers } = require('telegram/broadcasts.js');

module.exports = async (params) => {
  await shareMessageBySubscribers(params.from,
    `Account ${params.from} initiated a power down on the Saving account to ${params.to}`,
    `${PRODUCTION_HOST}@${params.from}`);

  return [params.from, Object.assign(params, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.TRANSFER_FROM_SAVINGS,
  })];
};
