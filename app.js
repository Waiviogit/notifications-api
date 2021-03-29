const express = require('express');
const bodyParser = require('body-parser');
const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const { sendSentryNotification } = require('utilities/helpers/sentryHelper');
const swaggerDocument = require('./swagger/swagger.json');
const authMiddleware = require('./middlewares/authMiddleware');

if (process.env.NODE_ENV === 'production') {
  require('./telegram/notificationsBot');
  console.log('BOT STARTED!');
}

const port = process.env.PORT || 4000;
const app = express();

Sentry.init({
  environment: process.env.NODE_ENV,
  dsn: process.env.SENTRY_DNS,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app }),
  ],
});

process.on('unhandledRejection', (error) => {
  sendSentryNotification();
  Sentry.captureException(error);
});

exports.server = app.listen(port, () => console.log(`Listening on ${port}`));

const router = require('./routes');

app.use(bodyParser.json());
app.use(morgan('dev'));

app.use(Sentry.Handlers.requestHandler({ request: true, user: true }));
app.use('/', authMiddleware, router);
app.use('/notifications/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(Sentry.Handlers.errorHandler({
  shouldHandleError(error) {
    // Capture 500 errors
    if (error.status >= 500 || !error.status) {
      sendSentryNotification();
      return true;
    }
    return false;
  },
}));
app.use((req, res, next) => {
  res.status(res.result.status || 200).json(res.result.json);
});

app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500).json({ message: err.message });
});

/**
 We connect everything that is in some way connected with the socket below,
 because if we connect these modules higher than we initialized the server,
 the socket will not start
 * */
const { heartbeat } = require('./utilities/helpers/wssHelper');
const { startRedisListener } = require('./utilities/helpers/redisListenerHelper');
const { ticketsWorker } = require('./utilities/redis/rsmq');

heartbeat();
startRedisListener();
ticketsWorker.start();
