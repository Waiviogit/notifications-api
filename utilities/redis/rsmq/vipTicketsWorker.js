const vipTicketsHelper = require('utilities/helpers/vipTicketsHelper');
const jsonHelper = require('utilities/helpers/jsonHelper');
const { QUEUES } = require('constants/common');
const RedisSMQWorker = require('rsmq-worker');

const config = require('config');
const _ = require('lodash');

exports.ticketsWorker = new RedisSMQWorker(
  QUEUES.TICKETS,
  { options: { db: config.redis.actionsQueue } },
);

this.ticketsWorker.on('message', async (msg, next) => {
  const { from, ticketsAmount } = jsonHelper.parseJson(msg);
  if (!from || !ticketsAmount) return next();

  for (let i = 0; i < ticketsAmount; i++) {
    await vipTicketsHelper.createTicket({ userName: from, msg });
  }

  next();
});

this.ticketsWorker.on('error', async (err, msg) => {
  console.log('error', err, msg.id);
});
