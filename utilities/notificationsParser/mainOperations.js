const _ = require('lodash');
const { redisNotifyClient } = require('utilities/redis/redis');
const { clientSend } = require('utilities/helpers/wssHelper');
const { LIMIT, NOTIFICATION_EXPIRY } = require('constants/index');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');
const {
  changeRecoveryAccount, transferFromSavings, transferToVesting,
  activateCampaign, deactivateCampaign, campaignMessage, changePassword, withdrawRoute,
  claimReward, comment, customJson, fillOrder, like, rejectUpdate,
  restaurantStatus, suspendedStatus, transfer, delegate, withdrawVesting, witnessVote,
  wobjectReward, webSiteBalance, powerDown, undelegate, delegateVestingShares, powerUp,
} = require('.');

const getNotifications = async (operation) => {
  let notification = [];
  let notifications = [];
  const params = operation.data;
  switch (operation.id) {
    case NOTIFICATIONS_TYPES.TRANSFER_FROM_SAVINGS:
      notifications.push(await transferFromSavings(params));
      break;

    case NOTIFICATIONS_TYPES.CHANGE_RECOVERY_ACCOUNT:
      notifications.push(await changeRecoveryAccount(params));
      break;

    case NOTIFICATIONS_TYPES.TRANSFER_TO_VESTING:
      notification = await transferToVesting(params);
      if (notification.length) notifications.push(notification);
      break;

    case NOTIFICATIONS_TYPES.CHANGE_PASSWORD:
      notifications.push(await changePassword(params));
      break;

    case NOTIFICATIONS_TYPES.WITHDRAW_ROUTE:
      notification = await withdrawRoute(params);
      if (notification.length) notifications.push(...notification);
      break;

    case NOTIFICATIONS_TYPES.SUSPENDED_STATUS:
      notifications.push(await suspendedStatus(params));
      break;

    case NOTIFICATIONS_TYPES.REJECT_UPDATE:
      notifications.push(await rejectUpdate(params));
      break;

    case NOTIFICATIONS_TYPES.ACTIVATE_CAMPAIGN:
      notifications = _.concat(notifications, await activateCampaign(params));
      break;

    case NOTIFICATIONS_TYPES.DEACTIVATE_CAMPAIGN:
      notifications = _.concat(notifications, await deactivateCampaign(params));
      break;

    case NOTIFICATIONS_TYPES.RESTAURANT_STATUS:
      notifications = _.concat(notifications, await restaurantStatus(params));
      break;

    case NOTIFICATIONS_TYPES.COMMENT:
      notifications = _.concat(notifications, await comment(params));
      break;

    case NOTIFICATIONS_TYPES.FILL_ORDER:
      notification = await fillOrder(params);
      if (notification.length) notifications.push(notification);
      break;

    case NOTIFICATIONS_TYPES.CUSTOM_JSON:
      notifications = _.concat(notifications, await customJson(params));
      break;

    case NOTIFICATIONS_TYPES.ACCOUNT_WITNESS_VOTE:
      notification = await witnessVote(params);
      if (notification.length) notifications.push(notification);
      break;

    case NOTIFICATIONS_TYPES.TRANSFER:
      notifications = _.concat(notifications, await transfer(params));
      break;

    case NOTIFICATIONS_TYPES.DELEGATE:
      notifications = _.concat(notifications, await delegate(params));
      break;

    case NOTIFICATIONS_TYPES.UNDELEGATE:
      notifications = _.concat(notifications, await undelegate(params));
      break;

    case NOTIFICATIONS_TYPES.DELEGATE_VESTING_SHARES:
      notifications = _.concat(notifications, await delegateVestingShares(params));
      break;

    case NOTIFICATIONS_TYPES.STAKE:
      notification = await powerUp(params);
      if (notification.length) notifications.push(notification);
      break;

    case NOTIFICATIONS_TYPES.UNSTAKE:
      notification = await powerDown(params);
      if (notification.length) notifications.push(notification);
      break;

    case NOTIFICATIONS_TYPES.WITHDRAW_VESTING:
      notifications.push(await withdrawVesting(operation, params));
      break;

    case NOTIFICATIONS_TYPES.CLAIM_REWARD:
      notification = await claimReward(params);
      if (notification.length) notifications.push(notification);
      break;

    case NOTIFICATIONS_TYPES.LIKE:
      notifications = _.concat(notifications, await like(params));
      break;

    case NOTIFICATIONS_TYPES.CAMPAIGN_MESSAGE:
      notifications.push(await campaignMessage(params));
      break;
    case NOTIFICATIONS_TYPES.BELL_WOBJ_REWARDS:
      notifications = _.concat(notifications, await wobjectReward(params));
      break;
    case NOTIFICATIONS_TYPES.WEB_SITE_BALANCE:
      notifications = _.concat(notifications, await webSiteBalance(params));
      break;
  }
  return notifications;
};

const prepareDataForRedis = (notifications) => {
  const redisOps = [];
  notifications.forEach((notification) => {
    if (!notification) return;
    const key = `notifications:${notification[0]}`;
    redisOps.push(['lpush', key, JSON.stringify(notification[1])]);
    redisOps.push(['expire', key, NOTIFICATION_EXPIRY]);
    redisOps.push(['ltrim', key, 0, LIMIT - 1]);
  });
  return redisOps;
};

exports.setNotifications = async ({ params }) => {
  const notifications = await getNotifications(params);
  const redisOps = prepareDataForRedis(notifications);
  await redisNotifyClient.multi(redisOps).execAsync();
  clientSend(notifications);
};
