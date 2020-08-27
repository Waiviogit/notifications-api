const _ = require('lodash');
const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');
const { getUsers, checkUserNotifications } = require('utilities/helpers/notificationsHelper');

module.exports = async (params) => {
  const notifications = [];
  const { users, error } = await getUsers({ arr: params.experts });
  if (error) {
    console.error(error);
    return [];
  }

  for (const expert of params.experts) {
    if (!await checkUserNotifications(
      { user: _.find(users, { name: expert }), type: NOTIFICATIONS_TYPES.STATUS_CHANGE },
    )) continue;

    const notification = {
      type: 'status-change',
      timestamp: Math.round(new Date().valueOf() / 1000),
      author: _.get(params, 'voter', params.creator),
      author_permlink: params.author_permlink,
      object_name: params.object_name,
      oldStatus: params.oldStatus,
      newStatus: params.newStatus,
      account: expert,
    };
    notifications.push([expert, notification]);

    await shareMessageBySubscribers(expert,
      `${_.get(params, 'voter', params.creator)} marked ${params.object_name} as ${params.newStatus}`,
      `${PRODUCTION_HOST}object/${params.author_permlink}`);
  }
  return notifications;
};
