const { checkUserNotifications, getUsers } = require('utilities/helpers/notificationsHelper');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { PRODUCTION_HOST } = require('constants/index');
const _ = require('lodash');

module.exports = async (params) => {
  const notifications = [];
  const { users, error } = await getUsers({ arr: [params.from_account, params.to_account] });
  if (error) return [];

  for (const user of users) {
    if (!await checkUserNotifications(
      { user: _.find(users, { name: user }), type: NOTIFICATIONS_TYPES.ACTIVATE_CAMPAIGN },
    )) continue;

    notifications.push([user.name, Object.assign(params, {
      timestamp: Math.round(new Date().valueOf() / 1000),
      type: NOTIFICATIONS_TYPES.WITHDRAW_ROUTE,
    })]);

    const message = params.percent > 0
      ? `${params.from_account} set withdraw route to ${params.to_account}`
      : `${params.from_account} canceled withdraw route to ${params.to_account}`;
    await shareMessageBySubscribers(params.from_account, message, `${PRODUCTION_HOST}@${params.from_account}`);
  }
  return notifications;
};
