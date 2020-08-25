const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { CUSTOM_JSON_IDS, BELL_NOTIFICATIONS } = require('constants/notificationTypes');
const {
  checkUserNotifications, getUsers, addNotificationForSubscribers,
} = require('utilities/helpers/notificationsHelper');

module.exports = async (params) => {
  const notifications = [];
  switch (params.id) {
    case CUSTOM_JSON_IDS.FOLLOW:
      const { user, error } = await getUsers({ single: params.json.following });
      if (error) {
        console.error(error);
        break;
      }

      const notification = {
        timestamp: Math.round(new Date().valueOf() / 1000),
        following: params.json.following,
        follower: params.json.follower,
        type: CUSTOM_JSON_IDS.FOLLOW,
      };

      await addNotificationForSubscribers({
        changeType: BELL_NOTIFICATIONS.BELL_FOLLOW,
        notificationData: notification,
        user: params.json.follower,
        notifications,
      });
      if (!await checkUserNotifications({ user, type: CUSTOM_JSON_IDS.FOLLOW })) break;

      await shareMessageBySubscribers(params.json.following,
        `${params.json.follower} started following ${params.json.following}`,
        `${PRODUCTION_HOST}@${params.json.following}/followers`);
      notifications.push([params.json.following, notification]);
      break;

    case CUSTOM_JSON_IDS.REBLOG:
      const { user: uReblog, error: uReblogErr } = await getUsers({ single: params.json.author });
      if (uReblogErr) {
        console.error(uReblogErr);
        break;
      }

      const notificationData = {
        timestamp: Math.round(new Date().valueOf() / 1000),
        permlink: params.json.permlink,
        type: CUSTOM_JSON_IDS.REBLOG,
        account: params.json.account,
        author: params.json.author,
        title: params.json.title,
      };
      await addNotificationForSubscribers({
        changeType: BELL_NOTIFICATIONS.BELL_REBLOG,
        user: params.json.account,
        notificationData,
        notifications,
      });
      if (!await checkUserNotifications({ user: uReblog, type: CUSTOM_JSON_IDS.REBLOG })) break;

      notifications.push([params.json.author, notificationData]);
      await shareMessageBySubscribers(params.json.author,
        `${params.json.account} reblogged ${params.json.author} post`,
        `${PRODUCTION_HOST}@${params.json.author}/${params.json.permlink}`);
      break;
  }
  return notifications;
};
