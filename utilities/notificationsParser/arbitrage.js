const { shareMessageBySubscribers } = require('../../telegram/broadcasts');
const { PRODUCTION_HOST, REBALANCING } = require('../../constants');
const { NOTIFICATIONS_TYPES } = require('../../constants/notificationTypes');

module.exports = async (params) => {
  const notifications = [];
  for (const el of params) {
    const link = `${PRODUCTION_HOST}${REBALANCING}${el.account}`;
    const message = `The profitable difference percent on pair ${el.tokenPair} is ${el.differencePercent}% now.
      Follow the link ${link} to proceed to the swap transactions.`;
    await shareMessageBySubscribers(el.account, message, link);
    notifications.push({
      timestamp: Math.round(new Date().valueOf() / 1000),
      type: NOTIFICATIONS_TYPES.ARBITRAGE,
      message,
    });
  }

  return notifications;
};
