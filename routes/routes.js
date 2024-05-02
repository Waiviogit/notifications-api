const { Router } = require('express');
const { notifications, serviceNotifications } = require('../controllers/notificationsController');

const mainRoutes = new Router();
const notificationsRoutes = new Router();
mainRoutes.use('/notifications-api', notificationsRoutes);

notificationsRoutes.route('/set').post(notifications);
notificationsRoutes.route('/set-service').post(serviceNotifications);

module.exports = mainRoutes;
