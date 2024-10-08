/* eslint-disable camelcase */
const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');

module.exports = async ({
  author, guideName, reservedUser, permlink, campaignName,
  json_metadata, body, parent_author, parent_permlink, newCampaigns, reservationPermlink,
}) => {
  const notSponsor = author !== guideName;
  const sendTo = notSponsor ? guideName : reservedUser;
  const message = notSponsor
    ? `${author} asked about ${campaignName}`
    : `${author} replied on your comment`;

  const url = notSponsor
    ? `${PRODUCTION_HOST}rewards/messages?reservationPermlink=${reservationPermlink || parent_permlink}`
    : `${PRODUCTION_HOST}rewards/history?reservationPermlink=${reservationPermlink || parent_permlink}&guideNames=${guideName}`;

  await shareMessageBySubscribers(
    sendTo,
    message,
    url,
  );

  return [sendTo, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.CAMPAIGN_MESSAGE,
    parent_permlink: reservationPermlink || parent_permlink,
    json_metadata,
    parent_author,
    campaignName,
    notSponsor,
    permlink,
    author,
    body,
    newCampaigns,
  }];
};
