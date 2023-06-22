const { getUsers, checkUserNotifications } = require('../helpers/notificationsHelper');
const { NOTIFICATIONS_TYPES } = require('../../constants/notificationTypes');
const { shareMessageBySubscribers } = require('../../telegram/broadcasts');
const { PRODUCTION_HOST } = require('../../constants');

const groupIdUpdates = async ({
  receivers, id, objectName, authorPermlink, initiator,
}) => {
  const notifications = [];
  const { users } = await getUsers({ arr: receivers });

  const messagePurpose = id === NOTIFICATIONS_TYPES.GROUP_ID_UPDATES
    ? 'added new'
    : 'rejected the';

  for (const receiver of receivers) {
    const user = users.find((el) => el.name === receiver);
    if (!user) continue;
    if (!await checkUserNotifications({ user, type: 'objectGroupId' })) continue;
    notifications.push([receiver, {
      timestamp: Math.round(new Date().valueOf() / 1000),
      type: id,
      objectName,
      authorPermlink,
      initiator,
    }]);
    await shareMessageBySubscribers(
      receiver,
      `${initiator} ${messagePurpose} Group ID for ${objectName}`,
      `${PRODUCTION_HOST}object/${authorPermlink}/updates/groupId`,
    );
  }
  return notifications;
};

module.exports = groupIdUpdates;
