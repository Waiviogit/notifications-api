const mainOperations = require('../utilities/notificationsParser/mainOperations');
const validators = require('./validators');
const serviceOperations = require('../utilities/notificationsParser/serviceOperations');
const { clientSend } = require('../utilities/helpers/wssHelper');

const notifications = async (req, res, next) => {
  const { params, validationError } = validators.validate(req.body, validators.notifications.operationsSchema);
  if (validationError) {
    return next({ status: 422, message: validationError.message });
  }
  await mainOperations.setNotifications({ params });
  res.status(200).json({ result: 'OK' });
};

const serviceNotifications = async (req, res, next) => {
  const { params, validationError } = validators.validate(req.body, validators.notifications.serviceNotifications);

  if (validationError) {
    return next({ status: 422, message: validationError.message });
  }

  const notification = await serviceOperations.getServiceNotifications(params);

  clientSend(notification);
  console.log('params', params);
  console.log('notification', notification);

  res.status(200).json({ result: 'OK' });
};

module.exports = { notifications, serviceNotifications };
