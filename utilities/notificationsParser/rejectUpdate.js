const { NOTIFICATIONS_TYPES } = require('../../constants/notificationTypes');
const { shareMessageBySubscribers } = require('../../telegram/broadcasts');
const { PRODUCTION_HOST } = require('../../constants');

module.exports = async (params) => {
  await shareMessageBySubscribers(params.creator,
    `${params.voter} rejected ${params.creator} update for ${params.object_name}`,
    `${PRODUCTION_HOST}object/${params.author_permlink}/updates/${params.fieldName}`);

  return [[params.creator, {
    timestamp: Math.round(new Date().valueOf() / 1000),
    type: NOTIFICATIONS_TYPES.REJECT_UPDATE,
    author_permlink: params.author_permlink,
    parent_permlink: params.parent_permlink,
    object_name: params.object_name,
    parent_name: params.parent_name,
    fieldName: params.fieldName,
    account: params.creator,
    voter: params.voter,
  }]];
};
