const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');

module.exports = async (params) => {
  const notifications = [];
  const {
    guideName, toJudge, author_permlink: authorPermlink, object_name: objectName, campaignWithUser,
  } = params;

  notifications.push([toJudge, {
    type: NOTIFICATIONS_TYPES.JUDGES_NOTIFICATION,
    guideName,
    toJudge,
    authorPermlink,
    objectName,
    campaignWithUser,
    timestamp: Math.round(new Date().valueOf() / 1000),
  }]);

  await shareMessageBySubscribers(
    toJudge,
    ` ${toJudge} was added as a judge to ${objectName || campaignWithUser}.`,
    `${PRODUCTION_HOST}rewards/judges `,
  );

  return notifications;
};
