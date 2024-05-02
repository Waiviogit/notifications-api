const { SERVICE_NOTIFICATION_TYPES } = require('../../constants/notificationTypes');
const { updateImport, updateReport } = require('.');

exports.getServiceNotifications = async (operation) => {
  const notifications = [];
  const params = operation.data;
  switch (operation.id) {
    case SERVICE_NOTIFICATION_TYPES.UPDATE_IMPORT:
      notifications.push(updateImport(params));
      break;
    case SERVICE_NOTIFICATION_TYPES.UPDATE_REPORT:
      notifications.push(updateReport(params));
      break;
    default: break;
  }
  return notifications;
};
