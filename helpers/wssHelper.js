const { wssConnection } = require('../wssConnector');

const clientSend = (notifications) => {
  notifications.forEach((notification) => {
    wssConnection.wss.clients.forEach((client) => {
      if (client.name && client.name === notification[0]) {
        console.log('Send push notification', notification[0]);
        client.send(
          JSON.stringify({
            type: 'notification',
            notification: notification[1],
          }),
        );
      }
    });
  });
};

const heartbeat = () => {
  setInterval(() => {
    wssConnection.wss.clients.forEach((client) => {
      client.send(JSON.stringify({ type: 'heartbeat' }));
    });
  }, 20 * 1000);
};

module.exports = { clientSend, heartbeat };
