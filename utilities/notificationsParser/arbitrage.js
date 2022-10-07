const { shareMessageBySubscribers } = require('../../telegram/broadcasts');
const { PRODUCTION_HOST, REBALANCING } = require('../../constants');
const { NOTIFICATIONS_TYPES } = require('../../constants/notificationTypes');

module.exports = async (params) => {
  const notifications = [];
  for (const el of params) {
    const link = `${PRODUCTION_HOST}@${el.account}${REBALANCING}`;
    const message = `Rebalancing alert for ${el.tokenPair}: ${el.differencePercent}% difference`;
    await shareMessageBySubscribers(el.account, message, link);
    notifications.push([el.account, {
      timestamp: Math.round(new Date().valueOf() / 1000),
      type: NOTIFICATIONS_TYPES.ARBITRAGE,
      differencePercent: el.differencePercent,
      tokenPair: el.tokenPair,
    }]);
  }

  return notifications;
};
