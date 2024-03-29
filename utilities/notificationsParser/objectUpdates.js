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

  const reject = id !== NOTIFICATIONS_TYPES.OBJECT_UPDATES;

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

    const message = reject
      ? `${initiator} rejected the ${fieldName} for ${objectName}`
      : `${initiator} added a new ${fieldName} for ${objectName}`;

    await shareMessageBySubscribers(
      receiver,
      message,
      `${PRODUCTION_HOST}object/${authorPermlink}/updates/${fieldName}`,
    );
  }
  return notifications;
};

module.exports = objectUpdates;
