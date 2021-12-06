const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { NOTIFICATIONS_TYPES, TYPES } = require('constants/notificationTypes');

module.exports = async (data) => {
  const notifications = [];

  for (const notification of data) {
    await shareMessageBySubscribers(notification.owner,
      TYPES[notification.message],
      `${PRODUCTION_HOST}manage`);

    notifications.push([notification.owner, {
      timestamp: Math.round(new Date().valueOf() / 1000),
      type: NOTIFICATIONS_TYPES.WEB_SITE_BALANCE,
      message: notification.message,
    }]);
  }
  return notifications;
};
