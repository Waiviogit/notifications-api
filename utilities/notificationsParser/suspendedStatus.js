const { NOTIFICATIONS_TYPES } = require('../../constants/notificationTypes');
const { shareMessageBySubscribers } = require('../../telegram/broadcasts');
const { PRODUCTION_HOST } = require('../../constants');

module.exports = async (params) => {
  await shareMessageBySubscribers(params.sponsor,
    `Warning: in ${params.days} days, all ${params.sponsor} 
        campaigns will be suspended because the accounts payable for ${params.reviewAuthor} 
        will exceed 30 days. ${PRODUCTION_HOST}@${params.reviewAuthor}/${params.reviewPermlink}`,
    `${PRODUCTION_HOST}rewards/payables`);

  return [params.sponsor, Object.assign(params, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.SUSPENDED_STATUS,
  })];
};
