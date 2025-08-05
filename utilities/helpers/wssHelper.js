const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');
const { wssConnection } = require('wssConnector');
const _ = require('lodash');

const clientSend = (notifications) => {
  notifications.forEach((notification) => {
    wssConnection.wss.clients.forEach((client) => {
      if (_.get(client, 'name') === notification[0]) {
        console.log('Send push notification', notification[0]);
        wssConnection.constructor.sendMessage({
          ws: client,
          message: JSON.stringify({
            type: NOTIFICATIONS_TYPES.NOTIFICATION,
            notification: notification[1],
          }),
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

const sendToSubscriber = async (subscriber, message) => {
  const Ws = _.find(
    Array.from(wssConnection.wss.clients),
    (client) => client.name === subscriber,
  );
  if (Ws) {
    console.log(`send message to ${subscriber} (fallback)`);
    wssConnection.constructor.sendMessage({ ws: Ws, message });
  }
  // wssConnection.wss.clients.forEach((ws) => {
  //   if (ws.name === subscriber) {
  //     console.log(`send message to ${subscriber}`);
  //     wssConnection.constructor.sendMessage({ ws, message });
  //   }
  // });
};

const sendToAllClients = (message) => {
  wssConnection.wss.clients.forEach((ws) => {
    wssConnection.constructor.sendMessage({ ws, message });
  });
};

const heartbeat = () => {
  setInterval(() => {
    sendToAllClients(JSON.stringify({ type: NOTIFICATIONS_TYPES.HEARTBEAT }));
  }, 20 * 1000);
};

const sendVipTicketResponse = async (userName) => {
  const ws = _.find(Array.from(wssConnection.wss.clients), (item) => item.name === userName);
  if (!ws) return false;

  wssConnection.constructor.sendMessage({
    ws,
    message: JSON.stringify({
      type: NOTIFICATIONS_TYPES.VIP_TICKETS,
      notification: 'parsed',
    }),
  });
  return true;
};

module.exports = {
  clientSend,
  heartbeat,
  sendParsedBlockResponse,
  sendVipTicketResponse,
  sendToAllClients,
  sendToSubscriber,
};
