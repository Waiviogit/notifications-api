const { PRODUCTION_HOST } = require('../../constants');
const { shareMessageBySubscribers } = require('../../telegram/broadcasts');
const { getAmountFromVests } = require('../helpers/dsteemHelper');
const { NOTIFICATIONS_TYPES } = require('../../constants/notificationTypes');

module.exports = async (operation, params) => {
  const amount = await getAmountFromVests(params.vesting_shares);

  await shareMessageBySubscribers(params.account,
    `${params.account} initiated PowerDown on ${amount}`,
    `${PRODUCTION_HOST}@${params.account}`);

  return [params.account, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.POWER_DOWN,
    account: params.account,
    block: operation.block,
    amount,
  }];
};
