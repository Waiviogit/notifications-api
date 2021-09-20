const _ = require('lodash');
const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');
const { getUsers, checkUserNotifications, campaginStatusNotification } = require('utilities/helpers/notificationsHelper');

module.exports = async (params) => {
  const notifications = [];
  const { users, error } = await getUsers({ arr: params.users });
  if (error) return [];

  for (const user of params.users) {
    if (!await checkUserNotifications(
      { user: _.find(users, { name: user }), type: NOTIFICATIONS_TYPES.DEACTIVATE_CAMPAIGN },
    )) continue;

    notifications.push([user, campaginStatusNotification(params, user, NOTIFICATIONS_TYPES.DEACTIVATE_CAMPAIGN)]);

    await shareMessageBySubscribers(user,
      `${params.guide} has deactivated the campaign for ${params.object_name}`,
      `${PRODUCTION_HOST}rewards/all/${params.author_permlink}`);
  }
  return notifications;
};
