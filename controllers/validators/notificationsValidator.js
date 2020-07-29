const Joi = require('@hapi/joi');
const notificationTypes = require('../../constants/notificationTypes');

exports.operationsSchema = Joi.object().keys({
  id: Joi.string().valid(...notificationTypes).required(),
  block: Joi.number(),
  data: Joi.when('id', [{
    is: 'transfer_from_savings',
    then: Joi.object().keys({
      from: Joi.string().required(),
      to: Joi.string().required(),
      amount: Joi.string().required(),
    }),
  }, {
    is: 'change_recovery_account',
    then: Joi.object().keys({
      account_to_recover: Joi.string().required(),
      new_recovery_account: Joi.string().required(),
    }),
  }, {
    is: 'transfer_to_vesting',
    then: Joi.object().keys({
      from: Joi.string().required(),
      to: Joi.string().required(),
      amount: Joi.string().required(),
    }),
  }, {
    is: 'changePassword',
    then: Joi.object().keys({
      account: Joi.string().required(),
    }),
  }, {
    is: 'withdraw_route',
    then: Joi.object().keys({
      percent: Joi.number().required(),
      from_account: Joi.string().required(),
      to_account: Joi.string().required(),
    }),
  }, {
    is: 'comment',
    then: Joi.object().keys({
      author: Joi.string().required(),
      permlink: Joi.string().required(),
      parent_author: Joi.string().allow('').required(),
      parent_permlink: Joi.string().allow('').required(),
      title: Joi.string().allow('').required(),
      body: Joi.string().required(),
      reply: Joi.boolean().default(false),
    }),
  }, {
    is: 'suspendedStatus',
    then: Joi.object().keys({
      sponsor: Joi.string().required(),
      reviewAuthor: Joi.string().required(),
      reviewPermlink: Joi.string().required(),
      days: Joi.number().required(),
    }),
  }, {
    is: 'custom_json',
    then: Joi.object().keys({
      id: Joi.string().valid('follow', 'reblog').required(),
      json: Joi.when('id', {
        is: 'reblog',
        then: Joi.object().keys({
          account: Joi.string().required(),
          author: Joi.string().required(),
          permlink: Joi.string().required(),
        }),
        otherwise: Joi.object().keys({
          follower: Joi.string().required(),
          following: Joi.string().required(),
        }),
      }),
    }),
  }, {
    is: 'transfer',
    then: Joi.object().keys({
      to: Joi.string().required(),
      from: Joi.string().required(),
      amount: Joi.string().required(),
      memo: Joi.string().allow('').required(),
    }),
  }, {
    is: 'withdraw_vesting',
    then: Joi.object().keys({
      account: Joi.string().required(),
      vesting_shares: Joi.string().required(),
    }),
  }, {
    is: 'account_witness_vote',
    then: Joi.object().keys({
      account: Joi.string().required(),
      approve: Joi.boolean().required(),
      witness: Joi.string().required(),
    }),
  }, {
    is: 'restaurantStatus',
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
    is: 'fillOrder',
    then: Joi.object().keys({
      account: Joi.string().required(),
      current_pays: Joi.string().required(),
      open_pays: Joi.string().required(),
      timestamp: Joi.number().required(),
      exchanger: Joi.string().required(),
      orderId: Joi.number().required(),
    }),
  }, {
    is: 'rejectUpdate',
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
    is: 'activateCampaign',
    then: Joi.object().keys({
      guide: Joi.string().required(),
      users: Joi.array().items(String).required(),
      author_permlink: Joi.string().required(),
      object_name: Joi.string().required(),
    }),
  }, {
    is: 'claimReward',
    then: Joi.object().keys({
      account: Joi.string().required(),
      reward_steem: Joi.string().required(),
      reward_sbd: Joi.string().required(),
    }),
  }, {
    is: 'like',
    then: Joi.object().keys({
      votes: Joi.array().items(
        Joi.object().keys({
          voter: Joi.string().required(),
          author: Joi.string().required(),
          permlink: Joi.string().required(),
          weight: Joi.number().required(),
          guest_author: Joi.string(),
        }),
      ),
    }),
  }]).required(),
}).options({ allowUnknown: true, stripUnknown: true });
