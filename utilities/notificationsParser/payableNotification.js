const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');

module.exports = async (params) => {
  const notifications = [];
  const {
    guideName, userName, campaignName,
  } = params;

  notifications.push([guideName, {
    type: NOTIFICATIONS_TYPES.PAYABLE_NOTIFICATION,
    userName,
    campaignName,
    timestamp: Math.round(new Date().valueOf() / 1000),
  }]);

  await shareMessageBySubscribers(
    guideName,
    `Action required: Rewards are due for your campaign ${campaignName}.`,
    `${PRODUCTION_HOST}rewards/payable/@${userName}`,
  );

  return notifications;
};
