const { PRODUCTION_HOST } = require('constants/index');
const { shareMessageBySubscribers } = require('telegram/broadcasts');
const { NOTIFICATIONS_TYPES } = require('constants/notificationTypes');

module.exports = async (params) => {
  await shareMessageBySubscribers(params.guideName,
    `${params.author} asked about ${params.campaignName}`,
    `${PRODUCTION_HOST}@${params.author}/${params.permlink}`);

  return [params.guideName, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.CAMPAIGN_MESSAGE,
    parent_permlink: params.parent_permlink,
    json_metadata: params.json_metadata,
    parent_author: params.parent_author,
    campaignName: params.campaignName,
    permlink: params.permlink,
    author: params.author,
    body: params.body,
  }];
};
