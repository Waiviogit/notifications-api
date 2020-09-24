/* eslint-disable camelcase */
const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');

module.exports = async ({
  author, guideName, reservedUser, permlink, campaignName,
  json_metadata, body, parent_author, parent_permlink,
}) => {
  const notSponsor = author !== guideName;
  const sendTo = notSponsor ? guideName : reservedUser;

  await shareMessageBySubscribers(sendTo,
    `${author} asked about ${campaignName}`,
    `${PRODUCTION_HOST}@${author}/${permlink}`);

  return [sendTo, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.CAMPAIGN_MESSAGE,
    parent_permlink,
    json_metadata,
    parent_author,
    campaignName,
    notSponsor,
    permlink,
    author,
    body,
  }];
};
