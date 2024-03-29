const { sendSentryNotification } = require('utilities/helpers/sentryHelper');
const requestHelper = require('utilities/helpers/requestHelper');
const { vipTicketsModel } = require('models');
const Sentry = require('@sentry/node');

exports.createTicket = async ({
  userName, msg, blockNum, ticketsAmount,
}) => {
  const { result: countInCurrentBlock, error: countError } = await vipTicketsModel
    .countDocuments({ userName, blockNum });
  if (countError) return handleError(countError);
  if (countInCurrentBlock >= ticketsAmount) return false;

  const { ticket, error: createTicketErr } = await requestHelper.createVipTicket();
  if (createTicketErr) {
    return handleError({
      message: createTicketErr.message,
      details: `Create ticket error for user: ${userName}, data: ${msg}`,
    });
  }
  const { result, error: dbError } = await vipTicketsModel.create({ ticket, userName, blockNum });
  if (dbError) {
    return handleError({
      message: dbError.message,
      details: `Create ticket db record error for user: ${userName}, data: ${msg}, ticket: ${ticket}`,
    });
  }

  return !!result;
};

const handleError = async (error) => {
  Sentry.captureException(error);
  await sendSentryNotification();
  return false;
};
