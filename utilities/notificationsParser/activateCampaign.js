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

    const url = params.newCampaigns
      ? `${PRODUCTION_HOST}rewards-new/all/${params.author_permlink}`
      : `${PRODUCTION_HOST}rewards/all/${params.author_permlink}`;

    await shareMessageBySubscribers(
      user,
      `${params.guide} launched a new campaign for ${params.object_name}`,
      url,
    );
  }
  return notifications;
};
