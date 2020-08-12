const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

if (process.env.NODE_ENV === 'production') {
  const { WaivioBot } = require('./telegram/notificationsBot');

  console.log('BOT STARTED!');
}

const port = process.env.PORT || 4000;
const app = express();
app.use(bodyParser.json());
exports.server = app.listen(port, () => console.log(`Listening on ${port}`));
const router = require('./routes');
const { heartbeat } = require('./helpers/wssHelper');
const authMiddleware = require('./middlewares/authMiddleware');

const swaggerDocument = require('./swagger/swagger.json');

app.use(morgan('dev'));
if (process.env.NODE_ENV === 'development') swaggerDocument.host = 'localhost:4000';
app.use('/notifications/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/', authMiddleware, router);
// app.use('/', router);
heartbeat();

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

const { startRedisListener } = require('./helpers/redisHelper');

startRedisListener();
