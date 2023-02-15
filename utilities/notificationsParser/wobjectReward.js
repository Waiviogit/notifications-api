const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { BELL_NOTIFICATIONS } = require('constants/notificationTypes');

module.exports = async (params) => {
  const notifications = [];

  for (const user of params.users) {
    const notification = {
      timestamp: Math.round(new Date().valueOf() / 1000),
      type: BELL_NOTIFICATIONS.BELL_WOBJ_REWARDS,
      objectName: params.objectName,
      objectPermlink: params.objectPermlink,
      primaryObject: params.primaryObject,
      guideName: params.guideName,
      reach: params.reach,
    };
    notifications.push([user, notification]);

    await shareMessageBySubscribers(user,
      `${params.guideName} launched a reward campaign for ${params.objectName}`,
      `${PRODUCTION_HOST}rewards/${params.reach}/all/${params.primaryObject}`);
  }
  return notifications;
};
