const { PRODUCTION_HOST } = require('../../constants');
const { shareMessageBySubscribers } = require('../../telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('../../constants/notificationTypes');
const { checkUserNotifications } = require('../helpers/notificationsHelper');
const { getUsers } = require('../helpers/notificationsHelper');

module.exports = async (params) => {
  const { user, error } = await getUsers({ single: params.account });

  if (error || !await checkUserNotifications(
    { user, type: NOTIFICATIONS_TYPES.CLAIM_REWARD },
  )) {
    return [];
  }

  await shareMessageBySubscribers(params.account,
    `${params.account} claimed reward: ${params.reward_steem}, ${params.reward_sbd}`,
    `${PRODUCTION_HOST}@${params.account}/transfers`);

  return [params.account, {
    type: NOTIFICATIONS_TYPES.CLAIM_REWARD,
    account: params.account,
    rewardHive: params.reward_steem,
    rewardHBD: params.reward_sbd,
    timestamp: Math.round(new Date().valueOf() / 1000),
  },
  ];
};
