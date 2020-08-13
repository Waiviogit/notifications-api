const { Router } = require('express');
const { notifications } = require('../controllers/notificationsController');

const mainRoutes = new Router();
const notificationsRoutes = new Router();
mainRoutes.use('/notifications-api', notificationsRoutes);

notificationsRoutes.route('/set').post(notifications);

module.exports = mainRoutes;
