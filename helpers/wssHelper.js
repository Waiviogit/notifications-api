const { userModel } = require('models');
const _ = require('lodash');
const { wssConnection } = require('../wssConnector');

const clientSend = (notifications) => {
  notifications.forEach((notification) => {
    wssConnection.wss.clients.forEach(async (client) => {
      if (client.name && client.name === notification[0]) {
        const { user, error } = await userModel.findOne(client.name);
        error && console.error(error);
        if (checkUserNotification({ user, notification })) {
          console.log('Send push notification', notification[0]);
          client.send(
            JSON.stringify({
              type: 'notification',
              notification: notification[1],
            }),
          );
        }
      }
    });
  });
};

const checkUserNotification = ({ user, notification }) => (
  _.isEmpty(user.user_metadata.settings.userNotifications)
    ? true
    : user.user_metadata.settings.userNotifications[`${notification[1].type}`]);

const heartbeat = () => {
  setInterval(() => {
    wssConnection.wss.clients.forEach((client) => {
      client.send(JSON.stringify({ type: 'heartbeat' }));
    });
  }, 20 * 1000);
};

module.exports = { clientSend, heartbeat };
