const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { PRODUCTION_HOST } = require('constants/index');

module.exports = async (params) => {
  const notifications = [];

  for (const user of [params.from_account, params.to_account]) {
    notifications.push([user, Object.assign(params, {
      timestamp: Math.round(new Date().valueOf() / 1000),
      type: NOTIFICATIONS_TYPES.WITHDRAW_ROUTE,
    })]);

    const message = params.percent > 0
      ? `${params.from_account} set withdraw route to ${params.to_account}`
      : `${params.from_account} canceled withdraw route to ${params.to_account}`;
    await shareMessageBySubscribers(user, message, `${PRODUCTION_HOST}@${user}`);
  }
  return notifications;
};
