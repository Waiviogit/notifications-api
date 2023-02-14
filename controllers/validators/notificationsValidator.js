const Joi = require('@hapi/joi');
const { NOTIFICATIONS_TYPES, CUSTOM_JSON_IDS } = require('../../constants/notificationTypes');

exports.operationsSchema = Joi.object().keys({
  id: Joi.string().valid(...Object.values(NOTIFICATIONS_TYPES)).required(),
  block: Joi.number(),
  data: Joi.when('id', [{
    is: NOTIFICATIONS_TYPES.TRANSFER_FROM_SAVINGS,
    then: Joi.object().keys({
      from: Joi.string().required(),
      to: Joi.string().required(),
      amount: Joi.string().required(),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.CHANGE_RECOVERY_ACCOUNT,
    then: Joi.object().keys({
      account_to_recover: Joi.string().required(),
      new_recovery_account: Joi.string().required(),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.TRANSFER_TO_VESTING,
    then: Joi.object().keys({
      from: Joi.string().required(),
      to: Joi.string().required(),
      amount: Joi.string().required(),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.CHANGE_PASSWORD,
    then: Joi.object().keys({
      account: Joi.string().required(),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.WITHDRAW_ROUTE,
    then: Joi.object().keys({
      percent: Joi.number().required(),
      from_account: Joi.string().required(),
      to_account: Joi.string().required(),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.COMMENT,
    then: Joi.object().keys({
      author: Joi.string().required(),
      permlink: Joi.string().required(),
      parent_author: Joi.string().allow('').required(),
      parent_permlink: Joi.string().allow('').required(),
      title: Joi.string().allow('').required(),
      body: Joi.string().required(),
      reply: Joi.boolean().default(false),
      wobjects: Joi.array().items(Joi.object().keys({
        author_permlink: Joi.string().required(),
        name: Joi.string().required(),
      })).default([]),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.SUSPENDED_STATUS,
    then: Joi.object().keys({
      sponsor: Joi.string().required(),
      reviewAuthor: Joi.string().required(),
      reviewPermlink: Joi.string().required(),
      days: Joi.number().required(),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.CUSTOM_JSON,
    then: Joi.object().keys({
      id: Joi.string().valid(...Object.values(CUSTOM_JSON_IDS)).required(),
      json: Joi.when('id', {
        is: CUSTOM_JSON_IDS.REBLOG,
        then: Joi.object().keys({
          account: Joi.string().required(),
          author: Joi.string().required(),
          permlink: Joi.string().required(),
          title: Joi.string().required(),
        }),
        otherwise: Joi.object().keys({
          follower: Joi.string().required(),
          following: Joi.string().required(),
        }),
      }),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.TRANSFER,
    then: Joi.object().keys({
      to: Joi.string().required(),
      from: Joi.string().required(),
      amount: Joi.string().required(),
      memo: Joi.string().allow('').default(''),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.DELEGATE,
    then: Joi.object().keys({
      to: Joi.string().required(),
      from: Joi.string().required(),
      amount: Joi.string().required(),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.UNDELEGATE,
    then: Joi.object().keys({
      to: Joi.string().required(),
      from: Joi.string().required(),
      amount: Joi.string().required(),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.DELEGATE_VESTING_SHARES,
    then: Joi.object().keys({
      to: Joi.string().required(),
      from: Joi.string().required(),
      amount: Joi.string().required(),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.UNSTAKE,
    then: Joi.object().keys({
      amount: Joi.string().required(),
      to: Joi.string().required(),
      from: Joi.string().required(),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.STAKE,
    then: Joi.object().keys({
      amount: Joi.string().required(),
      to: Joi.string().required(),
      from: Joi.string().required(),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.CANCEL_UNSTAKE,
    then: Joi.object().keys({
      amount: Joi.string().required(),
      account: Joi.string().required(),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.WITHDRAW_VESTING,
    then: Joi.object().keys({
      account: Joi.string().required(),
      vesting_shares: Joi.string().required(),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.ACCOUNT_WITNESS_VOTE,
    then: Joi.object().keys({
      account: Joi.string().required(),
      approve: Joi.boolean().required(),
      witness: Joi.string().required(),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.RESTAURANT_STATUS,
    then: Joi.object().keys({
      object_name: Joi.string().required(),
      author_permlink: Joi.string().required(),
      experts: Joi.array().items(String).required(),
      creator: Joi.string().required(),
      voter: Joi.string().allow(null).default(null),
      oldStatus: Joi.string().allow('').required(),
      newStatus: Joi.string().allow('').required(),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.FILL_ORDER,
    then: Joi.object().keys({
      account: Joi.string().required(),
      current_pays: Joi.string().required(),
      open_pays: Joi.string().required(),
      timestamp: Joi.number().required(),
      exchanger: Joi.string().required(),
      orderId: Joi.number().required(),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.REJECT_UPDATE,
    then: Joi.object().keys({
      creator: Joi.string().required(),
      voter: Joi.string().required(),
      author_permlink: Joi.string().required(),
      object_name: Joi.string().required(),
      parent_permlink: Joi.string().default(''),
      parent_name: Joi.string().default(''),
      fieldName: Joi.string().required(),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.ACTIVATE_CAMPAIGN,
    then: Joi.object().keys({
      guide: Joi.string().required(),
      users: Joi.array().items(String).required(),
      author_permlink: Joi.string().required(),
      object_name: Joi.string().required(),
      newCampaigns: Joi.boolean().default(false),
      reach: Joi.string(),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.DEACTIVATE_CAMPAIGN,
    then: Joi.object().keys({
      guide: Joi.string().required(),
      users: Joi.array().items(String).required(),
      author_permlink: Joi.string().required(),
      object_name: Joi.string().required(),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.CLAIM_REWARD,
    then: Joi.object().keys({
      account: Joi.string().required(),
      reward_hive: Joi.string().required(),
      reward_hbd: Joi.string().required(),
      reward_vests: Joi.string().required(),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.CAMPAIGN_MESSAGE,
    then: Joi.object().keys({
      author: Joi.string().required(),
      body: Joi.string().required(),
      json_metadata: Joi.string().required(),
      parent_author: Joi.string().required(),
      parent_permlink: Joi.string().required(),
      permlink: Joi.string().required(),
      guideName: Joi.string().required(),
      campaignName: Joi.string().required(),
      reservedUser: Joi.string().required(),
      newCampaigns: Joi.boolean().default(false),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.LIKE,
    then: Joi.object().keys({
      likes: Joi.array().items(Joi.object().keys({
        voter: Joi.string().required(),
        author: Joi.string().required(),
        permlink: Joi.string().required(),
        weight: Joi.number().required(),
        guest_author: Joi.string(),
      })),
    }).required(),
  }, {
    is: NOTIFICATIONS_TYPES.BELL_WOBJ_REWARDS,
    then: Joi.object().keys({
      guideName: Joi.string().required(),
      objectName: Joi.string().required(),
      primaryObject: Joi.string().required(),
      objectPermlink: Joi.string().required(),
      users: Joi.array().items(String).required(),
    }),
  }, {
    is: NOTIFICATIONS_TYPES.WEB_SITE_BALANCE,
    then: Joi.array().items(Joi.object().keys({
      owner: Joi.string().required(),
      message: Joi.string().required(),
    })).required(),
  }, {
    is: NOTIFICATIONS_TYPES.ARBITRAGE,
    then: Joi.array().items(Joi.object().keys({
      account: Joi.string().required(),
      differencePercent: Joi.string().required(),
      tokenPair: Joi.string().required(),
    })).required(),
  }]).required(),
}).options({ allowUnknown: true, stripUnknown: true });
