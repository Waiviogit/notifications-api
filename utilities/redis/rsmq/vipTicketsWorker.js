const { sendSentryNotification } = require('utilities/helpers/sentryHelper');
const vipTicketsHelper = require('utilities/helpers/vipTicketsHelper');
const jsonHelper = require('utilities/helpers/jsonHelper');
const wssHelper = require('utilities/helpers/wssHelper');
const { QUEUES } = require('constants/common');
const RedisSMQWorker = require('rsmq-worker');
const Sentry = require('@sentry/node');
const config = require('config');

exports.ticketsWorker = new RedisSMQWorker(
  QUEUES.TICKETS,
  { options: { db: config.redis.actionsQueue } },
);

this.ticketsWorker.on('message', async (msg, next, id) => {
  const { from, ticketsAmount, blockNum } = jsonHelper.parseJson(msg);
  if (!from || !ticketsAmount) return next();

  for (let i = 0; i < ticketsAmount; i++) {
    await vipTicketsHelper.createTicket({
      userName: from,
      ticketsAmount,
      blockNum,
      msg,
    });
  }
  await wssHelper.sendVipTicketResponse(from);
  await this.ticketsWorker.del(id);
  next();
});

this.ticketsWorker.on('error', async (error) => {
  Sentry.captureException(error);
  await sendSentryNotification();
});
