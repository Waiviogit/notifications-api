const sdk = require('sc2-sdk');
const SocketServer = require('ws').Server;
const { server } = require('./app');
const { redisNotifyClient } = require('./redis/redis');
const { validateAuthToken } = require('./helpers/waivioAuthHelper');

const sc2 = sdk.Initialize({ app: 'waivio.app' });
const wss = new SocketServer({ server, path: '/notifications-api' });

const clearGC = () => {
  try {
    global.gc();
  } catch (e) {
    console.log("You must run program with 'node --expose-gc index.js' or 'npm start'");
  }
};

setInterval(clearGC, 60 * 1000);

class WebSocket {
  constructor() {
    this.wss = wss;
    this.wss.on('connection', (ws) => {
      console.log('Got connection from new peer');
      ws.on('message', (message) => {
        console.log('Message', message);
        let call = {};
        try {
          call = JSON.parse(message);
        } catch (e) {
          console.error('Error WS parse JSON message', message, e);
        }
        // const key = new Buffer(JSON.stringify([call.method, call.params])).toString('base64');
        if (call.method === 'get_notifications' && call.params && call.params[0]) {
          redisNotifyClient
            .lrangeAsync(`notifications:${call.params[0]}`, 0, -1)
            .then((res) => {
              console.log('Send notifications', call.params[0], res.length);
              const notifications = res.map((notification) => JSON.parse(notification));
              ws.send(JSON.stringify({ id: call.id, result: notifications }));
            })
            .catch((err) => {
              console.log('Redis get_notifications failed', err);
            });
          // } else if (useCache && cache[key]) {
          //  ws.send(JSON.stringify({ id: call.id, cache: true, result: cache[key] }));
        } else if (call.method === 'login' && call.params && call.params[0]) {
          sc2.setAccessToken(call.params[0]);
          sc2
            .me()
            .then((result) => {
              console.log('Login success', result.name);
              ws.name = result.name;
              ws.verified = true;
              ws.account = result.account;
              ws.user_metadata = result.user_metadata;
              ws.send(JSON.stringify(
                { id: call.id, result: { login: true, username: result.name } },
              ));
            })
            .catch((err) => {
              console.error('Login failed', err);
              ws.send(
                JSON.stringify({
                  id: call.id,
                  result: {},
                  error: 'Something is wrong',
                }),
              );
            });
        } else if (call.method === 'guest_login' && call.params && call.params[0]) {
          validateAuthToken(call.params[0])
            .then(({ error, result }) => {
              console.log('Login success', result.name);
              ws.name = result.name;
              ws.verified = true;
              ws.account = result.account;
              ws.user_metadata = result.user_metadata;
              ws.send(JSON.stringify(
                { id: call.id, result: { login: true, username: result.name } },
              ));
            })
            .catch((err) => {
              console.error('Login failed', err);
              ws.send(
                JSON.stringify({
                  id: call.id,
                  result: {},
                  error: 'Something is wrong',
                }),
              );
            });
        } else if (call.method === 'subscribe' && call.params && call.params[0]) {
          console.log('Subscribe success', call.params[0]);
          ws.name = call.params[0];
          ws.send(
            JSON.stringify({ id: call.id, result: { subscribe: true, username: call.params[0] } }),
          );
        } else {
          ws.send(
            JSON.stringify({
              id: call.id,
              result: {},
              error: 'Something is wrong',
            }),
          );
        }
      });
      ws.on('error', () => console.log('Error on connection with peer'));
      ws.on('close', () => console.log('Connection with peer closed'));
    });
  }
}

const wssConnection = new WebSocket();

module.exports = { wssConnection };
