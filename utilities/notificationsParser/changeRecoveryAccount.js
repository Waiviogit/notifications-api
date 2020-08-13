const { shareMessageBySubscribers } = require('../../telegram/broadcasts');
const { PRODUCTION_HOST } = require('../../constants');
const { NOTIFICATIONS_TYPES } = require('../../constants/notificationTypes');

module.exports = async (params) => {
  await shareMessageBySubscribers(params.account_to_recover,
    `Account ${params.account_to_recover} changed recovery address to ${params.new_recovery_account}`,
    `${PRODUCTION_HOST}@${params.account_to_recover}`);

  return [params.account_to_recover, Object.assign(params, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.CHANGE_RECOVERY_ACCOUNT,
  })];
};
