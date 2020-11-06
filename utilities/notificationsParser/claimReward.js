const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');
const { checkUserNotifications, getUsers } = require('utilities/helpers/notificationsHelper');
const { getAmountFromVests } = require('utilities/helpers/dsteemHelper');

module.exports = async (params) => {
  const { user, error } = await getUsers({ single: params.account });

  if (error || !await checkUserNotifications(
    { user, type: NOTIFICATIONS_TYPES.CLAIM_REWARD },
  )) {
    return [];
  }
  const hivePower = (await getAmountFromVests(params.reward_vests)).replace(/HIVE/, 'HP');

  await shareMessageBySubscribers(params.account,
    `${params.account} claim reward: ${params.reward_hive}, ${params.reward_hbd}, ${hivePower}`,
    `${PRODUCTION_HOST}@${params.account}/transfers`);

  return [params.account, {
    type: NOTIFICATIONS_TYPES.CLAIM_REWARD,
    account: params.account,
    rewardHive: params.reward_hive,
    rewardHBD: params.reward_hbd,
    rewardHP: hivePower,
    timestamp: Math.round(new Date().valueOf() / 1000),
  },
  ];
};
