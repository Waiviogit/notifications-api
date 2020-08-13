const _ = require('lodash');
const { PRODUCTION_HOST } = require('../../constants');
const { shareMessageBySubscribers } = require('../../telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('../../constants/notificationTypes');
const { getUsers, checkUserNotifications } = require('../helpers/notificationsHelper');

module.exports = async (params) => {
  const notifications = [];
  const { users, error } = await getUsers({ arr: params.users });
  if (error) return [];

  for (const user of params.users) {
    if (!await checkUserNotifications(
      { user: _.find(users, { name: user }), type: NOTIFICATIONS_TYPES.ACTIVATE_CAMPAIGN },
    )) continue;

    const notification = {
      timestamp: Math.round(new Date().valueOf() / 1000),
      type: NOTIFICATIONS_TYPES.ACTIVATE_CAMPAIGN,
      author_permlink: params.author_permlink,
      object_name: params.object_name,
      author: params.guide,
      account: user,
    };
    notifications.push([user, notification]);

    await shareMessageBySubscribers(user,
      `${params.guide} launched a new campaign for ${params.object_name}`,
      `${PRODUCTION_HOST}object/${params.author_permlink}`);
  }
  return notifications;
};
