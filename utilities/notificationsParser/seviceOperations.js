const { sendServiceNotification } = require('utilities/helpers/wssHelper');
const { SERVICE_NOTIFICATION_TYPES } = require('../../constants/notificationTypes');
const { updateImport } = require('./index');

const getServiceNotifications = async (operation) => {
  const notifications = [];
  const params = operation.data;
  switch (operation.id) {
    case SERVICE_NOTIFICATION_TYPES.UPDATE_IMPORT:
      notifications.push(updateImport(params));
      break;
    default: break;
  }
  return notifications;
};

const sendNotifications = async ({ params }) => {
  const notifications = await getServiceNotifications(params);

  sendServiceNotification(notifications);
};

module.exports = {
  sendNotifications,
};
