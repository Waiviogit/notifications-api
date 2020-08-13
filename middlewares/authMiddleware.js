const Bluebird = require('bluebird');
const sc2 = require('sc2-sdk');
const { validateAuthToken } = require('../utilities/helpers/waivioAuthHelper');

function createTimeout(timeout, promise) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error(`Request has timed out. It should take no longer than ${timeout}ms.`));
    }, timeout);
    promise.then(resolve, reject);
  });
}

async function authMiddleware(req, res, next) {
  const reqKey = req.get('API_KEY');
  if (reqKey && reqKey === process.env.API_KEY) {
    return next();
  }
  const token = req.get('Authorization');
  const waivioAuth = req.get('waivio-auth');
  if (!token) {
    return res.sendStatus(401);
  }

  try {
    let user;
    if (waivioAuth) {
      const { result } = await validateAuthToken(token);
      if (!result) return res.sendStatus(401);
      user = result;
    } else {
      const api = sc2.Initialize({
        app: 'waivio',
      });

      api.setAccessToken(token);

      const me = Bluebird.promisify(api.me, { context: api });

      user = await createTimeout(10000, me());
      if (!user) {
        return res.sendStatus(401);
      }
    }
    req.user = user.name;

    next();
  } catch (err) {
    return res.sendStatus(401);
  }
}

module.exports = authMiddleware;
