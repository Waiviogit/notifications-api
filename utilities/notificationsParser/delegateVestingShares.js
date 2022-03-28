const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');
const { getAmountFromVests } = require('utilities/helpers/dsteemHelper');

module.exports = async (params) => {
  const amount = await getAmountFromVests(params.amount);
  const notifications = [];
  notifications.push([params.from, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.DELEGATE_VESTING_SHARES,
    amount,
    to: params.to,
  }]);
  await shareMessageBySubscribers(params.from, constructMessage(params), `${PRODUCTION_HOST}@${params.from}/transfers `);

  notifications.push([params.to, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.DELEGATE_VESTING_SHARES,
    amount,
    from: params.from,
  }]);

  await shareMessageBySubscribers(params.to, constructMessage(params), `${PRODUCTION_HOST}@${params.to}/transfers`);

  return notifications;
};

const constructMessage = (params) => {
  const [amount, token] = params.amount.split(' ');

  return +amount ? `${params.from} delegated ${params.amount} to ${params.to}`
    : `${params.from} undelegated ${token} from ${params.to}`;
};
