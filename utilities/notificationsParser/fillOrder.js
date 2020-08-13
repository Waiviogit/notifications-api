const { PRODUCTION_HOST } = require('../../constants');
const { shareMessageBySubscribers } = require('../../telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('../../constants/notificationTypes');
const { checkUserNotifications, getUsers } = require('../helpers/notificationsHelper');

module.exports = async (params) => {
  const { user, error } = await getUsers({ single: params.account });

  if (error) {
    console.error(error.message);
    return [];
  }
  if (!await checkUserNotifications({ user, type: NOTIFICATIONS_TYPES.FILL_ORDER })) return [];

  await shareMessageBySubscribers(params.account,
    `${params.account} bought ${params.current_pays} and get ${params.open_pays} from ${params.exchanger}`,
    `${PRODUCTION_HOST}@${params.account}/transfers`);

  return [params.account, {
    timestamp: Math.round(params.timestamp / 1000),
    type: NOTIFICATIONS_TYPES.FILL_ORDER,
    current_pays: params.current_pays,
    open_pays: params.open_pays,
    exchanger: params.exchanger,
    account: params.account,
    orderId: params.orderId,
  }];
};
