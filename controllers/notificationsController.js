const mainOperations = require('../utilities/notificationsParser/mainOperations');
const validators = require('./validators');

const notifications = async (req, res, next) => {
  const { params, validationError } = validators.validate(
    req.body, validators.notifications.operationsSchema,
  );
  if (validationError) return next({ status: 422, message: validationError.message });
  await mainOperations.setNotifications({ params });
  res.status(200).json({ result: 'OK' });
};

module.exports = { notifications };
