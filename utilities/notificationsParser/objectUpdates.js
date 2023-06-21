const { getUsers } = require('utilities/helpers/notificationsHelper');
const { checkUserNotifications } = require('../helpers/notificationsHelper');
const { NOTIFICATIONS_TYPES } = require('../../constants/notificationTypes');
const { shareMessageBySubscribers } = require('../../telegram/broadcasts');
const { PRODUCTION_HOST } = require('../../constants');

const objectUpdates = async ({
  fieldName, receivers, id, objectName, authorPermlink, initiator,
}) => {
  const notifications = [];
  const { users } = await getUsers({ arr: receivers });

  const messagePurpose = id === NOTIFICATIONS_TYPES.OBJECT_UPDATES
    ? 'added new'
    : 'rejected the';

  for (const receiver of receivers) {
    const user = users.find((el) => el.name === receiver);
    if (!user) continue;
    if (!await checkUserNotifications({ user, type: 'objectUpdates' })) continue;
    notifications.push([receiver, {
      timestamp: Math.round(new Date().valueOf() / 1000),
      type: id,
      objectName,
      authorPermlink,
      fieldName,
      initiator,
    }]);
    await shareMessageBySubscribers(
      receiver,
      `${initiator} ${messagePurpose} ${fieldName} for ${objectName}`,
      `${PRODUCTION_HOST}object/${authorPermlink}/updates/${fieldName}`,
    );
  }
  return notifications;
};

module.exports = objectUpdates;
