const notificationsHelper = require('../helpers/notificationsHelper');
const validators = require('./validators');
const redisGetter = require('../redis/redisGetter');


const notifications = async (req, res, next) => {
  const { params, validationError } = validators.validate(
    req.body, validators.notifications.operationsSchema,
  );
  if (validationError) return next({ status: 422, message: validationError.message });
  await notificationsHelper.setNotifications({ params });
  res.status(200).json({ result: 'OK' });
};

const show = async (req, res, next) => {
  if (!req.user) return next({ status: 422, message: 'No name from token' });
  const { result, error } = await redisGetter.getUserNotifications(req.user);
  if (error) return next({ status: 503, message: error.message });
  res.status(200).json({ result });
};

module.exports = { notifications, show };
