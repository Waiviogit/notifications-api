const _ = require('lodash');
const { wssConnection } = require('../../wssConnector');

const clientSend = (notifications) => {
  notifications.forEach((notification) => {
    wssConnection.wss.clients.forEach((client) => {
      if (_.get(client, 'name') === notification[0]) {
        console.log('Send push notification', notification[0]);
        wssConnection.constructor.sendMessage({
          ws: client,
          message: JSON.stringify({ type: 'notification', notification: notification[1] }),
        });
      }
    });
  });
};

const sendParsedBlockResponse = async (type, subscribers, msg) => {
  wssConnection.wss.clients.forEach((client) => {
    if (client.name && _.includes(subscribers, client.name)) {
      wssConnection.constructor.sendMessage({
        ws: client,
        message: JSON.stringify({ type, notification: { blockParsed: +msg } }),
      });
    }
  });
};

const heartbeat = () => {
  setInterval(() => {
    wssConnection.wss.clients.forEach((client) => {
      wssConnection.constructor.sendMessage({
        ws: client,
        message: JSON.stringify({ type: 'heartbeat' }),
      });
    });
  }, 20 * 1000);
};

module.exports = { clientSend, heartbeat, sendParsedBlockResponse };
