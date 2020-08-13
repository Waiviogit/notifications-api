const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger/swagger.json');
const authMiddleware = require('./middlewares/authMiddleware');

if (process.env.NODE_ENV === 'production') {
  require('./telegram/notificationsBot');
  console.log('BOT STARTED!');
}

const port = process.env.PORT || 4000;
const app = express();
exports.server = app.listen(port, () => console.log(`Listening on ${port}`));

const router = require('./routes');

app.use(bodyParser.json());
app.use(morgan('dev'));
app.use('/', authMiddleware, router);
app.use('/notifications/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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

heartbeat();
startRedisListener();
