const sdk = require('sc2-sdk');
const SocketServer = require('ws').Server;
const { server } = require('./app');
const { redisNotifyClient } = require('./redis/redis');
const { validateAuthToken } = require('./helpers/waivioAuthHelper');

const sc2 = sdk.Initialize({ app: 'waivio.app' });
const wss = new SocketServer({ server, path: '/notifications-api' });

const sendLoginSuccess = (call, result, ws) => {
  console.log('Login success', result.name);
  ws.name = result.name;
  ws.verified = true;
  ws.account = result.account;
  ws.user_metadata = result.user_metadata;
  ws.send(JSON.stringify(
    { id: call.id, result: { login: true, username: result.name } },
  ));
};

const sendSomethingWrong = (call, ws) => {
  ws.send(
    JSON.stringify({
      id: call.id,
      result: {},
      error: 'Something is wrong',
    }),
  );
};

const unSubscribe = (call, result, ws) => {
  wss.clients.forEach((client) => {
    if (client.name === result.name) {
      wss.clients.delete(client);
      ws.send(
        JSON.stringify({ id: call.id, result: { subscribe: false, username: result.name } }),
      );
    }
  });
};

const getNotifications = async (call, ws) => {
  try {
    const res = await redisNotifyClient.lrangeAsync(`notifications:${call.params[0]}`, 0, -1);
    console.log('Send notifications', call.params[0], res.length);
    const notifications = res.map((notification) => JSON.parse(notification));
    ws.send(JSON.stringify({ id: call.id, result: notifications }));
  } catch (error) {
    console.log('Redis get_notifications failed', error);
  }
};

class WebSocket {
  constructor() {
    this.wss = wss;
    this.wss.on('connection', async (ws) => {
      console.log('Got connection from new peer');
      ws.on('message', async (message) => {
        console.log('Message', message);
        let call = {};
        try {
          call = JSON.parse(message);
        } catch (e) {
          console.error('Error WS parse JSON message', message, e);
        }
        if (call.method === 'get_notifications' && call.params && call.params[0]) {
          await getNotifications(call, ws);
        } else if (call.method === 'login' && call.params && call.params[0]) {
          sc2.setAccessToken(call.params[0]);
          try {
            const result = await sc2.me();
            sendLoginSuccess(call, result, ws);
          } catch (error) {
            sendSomethingWrong(call, ws);
          }
        } else if (call.method === 'guest_login' && call.params && call.params[0]) {
          const { result } = await validateAuthToken(call.params[0]);
          if (result) sendLoginSuccess(call, result, ws);
          else sendSomethingWrong(call, ws);
        } else if (call.method === 'subscribe' && call.params && call.params[0]) {
          console.log('Subscribe success', call.params[0]);
          ws.name = call.params[0];
          ws.send(JSON.stringify(
            { id: call.id, result: { subscribe: true, username: call.params[0] } },
          ));
        } else if (call.method === 'unsubscribe' && call.params && call.params[0]) {
          try {
            sc2.setAccessToken(call.params[0]);
            const result = await sc2.me();
            unSubscribe(call, result, ws);
          } catch (error) {
            const { result } = await validateAuthToken(call.params[0]);
            if (result) unSubscribe(call, result, ws);
            else sendSomethingWrong(call, ws);
          }
        } else {
          sendSomethingWrong(call, ws);
        }
      });
      ws.on('error', () => console.log('Error on connection with peer'));
      ws.on('close', () => console.log('Connection with peer closed'));
    });
  }
}

const wssConnection = new WebSocket();

module.exports = { wssConnection };
