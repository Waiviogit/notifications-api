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
      { user: _.find(users, { name: user }), type: NOTIFICATIONS_TYPES.ACTIVATE_CAMPAIGN },
    )) continue;

    notifications.push([user, campaginStatusNotification(params, user, NOTIFICATIONS_TYPES.ACTIVATE_CAMPAIGN)]);

    const url = `${PRODUCTION_HOST}rewards/${params.reach}/all/${params.author_permlink}?sponsors=${params.guide}`;

    await shareMessageBySubscribers(
      user,
      `${params.guide} launched a new campaign for ${params.object_name}`,
      url,
    );
  }
  return notifications;
};
