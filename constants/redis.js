const { CALL_METHOD } = require('./notificationTypes');

exports.CAMPAIGN_LISTENER = {
  'expire:assign': CALL_METHOD.SUBSCRIBE_CAMPAIGN_ASSIGN,
  'expire:assign:false': CALL_METHOD.SUBSCRIBE_CAMPAIGN_ASSIGN,
  'expire:release': CALL_METHOD.SUBSCRIBE_CAMPAIGN_RELEASE,
  'expire:release:false': CALL_METHOD.SUBSCRIBE_CAMPAIGN_RELEASE,
  'expire:deactivation': CALL_METHOD.SUBSCRIBE_CAMPAIGN_DEACTIVATION,
  'expire:deactivation:false': CALL_METHOD.SUBSCRIBE_CAMPAIGN_DEACTIVATION,
  'expire:transactionId': CALL_METHOD.SUBSCRIBE_TRX_ID,
};

exports.MAIN_PARSER_LISTENER = {
  main_parser_tx_id: CALL_METHOD.SUBSCRIBE_TRX_ID,
  last_vote_block_num: CALL_METHOD.SUBSCRIBE_BLOCK,
  last_block_num: CALL_METHOD.SUBSCRIBE_BLOCK,
  campaign_last_block_num: CALL_METHOD.SUBSCRIBE_BLOCK,
};

exports.CACHE_KEYS = {
  COINGECKO: 'coingecko_cache',
};
