const { NOTIFICATIONS_TYPES } = require('../../constants/notificationTypes');

module.exports = async (params) => [params.guideName, {
  timestamp: Math.round(new Date().valueOf() / 1000),
  type: NOTIFICATIONS_TYPES.CAMPAIGN_MESSAGE,
  parent_permlink: params.parent_permlink,
  json_metadata: params.json_metadata,
  parent_author: params.parent_author,
  permlink: params.permlink,
  author: params.author,
  body: params.body,
}];
