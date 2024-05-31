const { SERVICE_NOTIFICATION_TYPES } = require('../../constants/notificationTypes');
const { updateImport, updateReport, finishReport } = require('.');

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
    case SERVICE_NOTIFICATION_TYPES.FINISH_REPORT:
      notifications.push(finishReport(params));
      break;
    default: break;
  }
  return notifications;
};
