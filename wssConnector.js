const _ = require('lodash');
const sdk = require('sc2-sdk');
const SocketServer = require('ws').Server;
const { NOTIFICATIONS_TYPES, CALL_METHOD } = require('constants/notificationTypes');
const { server } = require('./app');
const { redis, redisSetter, redisGetter } = require('./utilities/redis');
const { validateAuthToken } = require('./utilities/helpers/waivioAuthHelper');

const validators = require('./controllers/validators');
const mainOperations = require('./utilities/notificationsParser/mainOperations');

const sc2 = sdk.Initialize({
  app: 'waivio.app',
  baseURL: 'https://hivesigner.com',
});
const wss = new SocketServer({ server, path: '/notifications-api' });

const sendLoginSuccess = (call, result, ws) => {
  console.log('Login success', result.name);
  ws.name = result.name;
  ws.verified = true;
  ws.account = result.account;
  ws.user_metadata = result.user_metadata;
  WebSocket.sendMessage({
    ws,
    message: JSON.stringify({
      id: call.id, result: { login: true, username: result.name }, type: NOTIFICATIONS_TYPES.LOGIN,
    }),
  });
};

const sendSomethingWrong = (call, ws) => {
  WebSocket.sendMessage({
    ws,
    message: JSON.stringify({
      id: call.id,
      result: {},
      error: 'Something is wrong',
    }),
  });
};

const unSubscribe = (call, result, ws) => {
  wss.clients.forEach((client) => {
    if (client.name === result.name) {
      wss.clients.delete(client);
      WebSocket.sendMessage({
        ws,
        message: JSON.stringify({
          id: call.id,
          result: { subscribe: false, username: result.name },
        }),
      });
    }
  });
};

const getNotifications = async (call, ws) => {
  try {
    const res = await redis.redisNotifyClient.lrangeAsync(`notifications:${call.params[0]}`, 0, -1);
    console.log('Send notifications', call.params[0], res.length);
    const notifications = res.map((notification) => JSON.parse(notification));
    WebSocket.sendMessage({
      ws,
      message: JSON.stringify({
        id: call.id, result: notifications, type: NOTIFICATIONS_TYPES.GET_NOTIFICATIONS,
      }),
    });
  } catch (error) {
    console.log('Redis get_notifications failed', error);
  }
};

class WebSocket {
  constructor() {
    this.wss = wss;
    this.wss.on('connection', async (ws, req) => {
      console.log('Got connection from new peer');
      ws.key = _.get(req, 'headers.api_key');
      ws.on('message', async (message) => {
        let call = {};
        try {
          call = JSON.parse(message);
        } catch (e) {
          console.error('Error WS parse JSON message', message, e);
        }
        const smthWrong = !_.get(call, 'params[0]') && !call.payload && call.method !== CALL_METHOD.UPDATE_INFO;
        if (smthWrong) return sendSomethingWrong(call, ws);

        switch (call.method) {
          case CALL_METHOD.GET_NOTIFICATIONS:
            await getNotifications(call, ws);
            break;

          case CALL_METHOD.SET_NOTIFICATION:
            await this.setNotification(call.payload, ws.key);
            break;

          case CALL_METHOD.LOGIN:
            sc2.setAccessToken(call.params[0]);
            try {
              const result = await sc2.me();
              sendLoginSuccess(call, result, ws);
            } catch (error) {
              sendSomethingWrong(call, ws);
            }
            break;

          case CALL_METHOD.GUEST_LOGIN:
            const { result: guestResult } = await validateAuthToken(call.params[0]);
            if (guestResult) sendLoginSuccess(call, guestResult, ws);
            else sendSomethingWrong(call, ws);
            break;

          case CALL_METHOD.SUBSCRIBE:
            console.log('Subscribe success', call.params[0]);
            ws.name = call.params[0];
            WebSocket.sendMessage({
              ws,
              message: JSON.stringify(
                { id: call.id, result: { subscribe: true, username: call.params[0] } },
              ),
            });
            break;

          case CALL_METHOD.UNSUBSCRIBE:
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

          case CALL_METHOD.SUBSCRIBE_BLOCK:
            if (!_.isNumber(+call.params[1]) || !call.params[2]) {
              return sendSomethingWrong(call, ws);
            }

            const lastBlock = await redisGetter.getBlockNum(call.params[2]);
            if (+lastBlock - 1 >= +call.params[1]) {
              return WebSocket.sendMessage({
                ws,
                message: JSON.stringify({
                  type: call.params[2],
                  notification: { blockParsed: call.params[1] },
                }),
              });
            }

            const setResult = await redisSetter.setSubscribe(
              `${call.params[2]}:${+call.params[1]}`, call.params[0],
            );
            if (setResult) {
              ws.name = call.params[0];
              WebSocket.sendMessage({
                ws,
                message: JSON.stringify(
                  { id: call.id, result: { subscribeBlock: true, username: call.params[0] } },
                ),
              });
            } else sendSomethingWrong(call, ws);
            break;

          case CALL_METHOD.SUBSCRIBE_CAMPAIGN_ASSIGN:
          case CALL_METHOD.SUBSCRIBE_CAMPAIGN_RELEASE:
          case CALL_METHOD.SUBSCRIBE_CAMPAIGN_DEACTIVATION:
          case CALL_METHOD.SUBSCRIBE_TRX_ID:
            if (!call.params[0] || !call.params[1]) {
              return sendSomethingWrong(call, ws);
            }
            await redisSetter.setSubscribeSingle(
              `${call.params[1]}`, call.params[0],
            );
            break;

          case CALL_METHOD.SUBSCRIBE_TICKET:
            ws.name = call.params[0];
            break;

          case CALL_METHOD.UPDATE_INFO:
            if (ws.key !== process.env.API_KEY) break;

            this.sendMessageToAllClient(this.wss.clients);
            break;
        }
      });
      ws.on('error', () => console.log('Error on connection with peer'));
      ws.on('close', () => console.log('Connection with peer closed'));
    });
  }

  static sendMessage({ ws, message }) {
    if (ws.readyState !== 1) return;
    try {
      ws.send(message);
    } catch (error) {
      console.error(error);
    }
  }

  async setNotification(payload, key) {
    if (key !== process.env.API_KEY) {
      return;
    }
    const { params, validationError } = validators.validate(
      payload, validators.notifications.operationsSchema,
    );
    if (validationError) return;
    await mainOperations.setNotifications({ params });
  }

  sendMessageToAllClient(clients) {
    clients.forEach((ws) => {
      WebSocket.sendMessage({
        ws,
        message: JSON.stringify({
          type:
          NOTIFICATIONS_TYPES.UPDATE_INFO,
        }),
      });
    });
  }
}

const wssConnection = new WebSocket();

module.exports = { wssConnection };
