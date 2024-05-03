const { SERVICE_NOTIFICATION_TYPES } = require('../../constants/notificationTypes');

module.exports = (params) => [
  params.account,
  {
    ...params,
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: SERVICE_NOTIFICATION_TYPES.UPDATE_REPORT,
  },
];
