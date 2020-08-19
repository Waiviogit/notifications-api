const _ = require('lodash');
const sdk = require('sc2-sdk');
const SocketServer = require('ws').Server;
const { server } = require('./app');
const { redis, redisSetter, redisGetter } = require('./utilities/redis');
const { validateAuthToken } = require('./utilities/helpers/waivioAuthHelper');

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
    const res = await redis.redisNotifyClient.lrangeAsync(`notifications:${call.params[0]}`, 0, -1);
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
        if (!_.get(call, 'params[0]')) sendSomethingWrong(call, ws);
        switch (call.method) {
          case 'get_notifications':
            await getNotifications(call, ws);
            break;

          case 'login':
            sc2.setAccessToken(call.params[0]);
            try {
              const result = await sc2.me();
              sendLoginSuccess(call, result, ws);
            } catch (error) {
              sendSomethingWrong(call, ws);
            }
            break;

          case 'guest_login':
            const { result: guestResult } = await validateAuthToken(call.params[0]);
            if (guestResult) sendLoginSuccess(call, guestResult, ws);
            else sendSomethingWrong(call, ws);
            break;

          case 'subscribe':
            console.log('Subscribe success', call.params[0]);
            ws.name = call.params[0];
            ws.send(JSON.stringify(
              { id: call.id, result: { subscribe: true, username: call.params[0] } },
            ));
            break;

          case 'unsubscribe':
            try {
              sc2.setAccessToken(call.params[0]);
              const hiveAuth = await sc2.me();
              unSubscribe(call, hiveAuth, ws);
            } catch (error) {
              const { result: validateResult } = await validateAuthToken(call.params[0]);
              if (validateResult) unSubscribe(call, validateResult, ws);
              else sendSomethingWrong(call, ws);
            }
            break;

          case 'subscribeBlock':
            if (!_.isNumber(+call.params[1]) || !call.params[2]) {
              return sendSomethingWrong(call, ws);
            }

            const lastBlock = await redisGetter.getBlockNum(call.params[2]);
            if (+lastBlock - 1 >= +call.params[1]) {
              return ws.send(
                JSON.stringify({
                  type: call.params[2],
                  notification: { blockParsed: call.params[1] },
                }),
              );
            }

            const setResult = await redisSetter.setSubscribe(
              `${call.params[2]}:${+call.params[1]}`, call.params[0],
            );
            if (setResult) {
              ws.name = call.params[0];
              ws.send(JSON.stringify(
                { id: call.id, result: { subscribeBlock: true, username: call.params[0] } },
              ));
            } else sendSomethingWrong(call, ws);
            break;
        }
      });
      ws.on('error', () => console.log('Error on connection with peer'));
      ws.on('close', () => console.log('Connection with peer closed'));
    });
  }
}

const wssConnection = new WebSocket();

module.exports = { wssConnection };
