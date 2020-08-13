const { NOTIFICATIONS_TYPES } = require('../../constants/notificationTypes');
const { shareMessageBySubscribers } = require('../../telegram/broadcasts');
const { PRODUCTION_HOST } = require('../../constants');

module.exports = async (params) => {
  await shareMessageBySubscribers(params.account,
    `Account ${params.account} initiated a password change procedure`,
    `${PRODUCTION_HOST}@${params.account}`);

  return [params.account, Object.assign(params, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.CHANGE_PASSWORD,
  })];
};
