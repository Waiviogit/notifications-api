const Joi = require('@hapi/joi');
const notificationTypes = require('../../constants/notificationTypes');

exports.operationsSchema = Joi.object().keys({
  id: Joi.string().valid(...notificationTypes).required(),
  block: Joi.number().required(),
  data: Joi.when('id', [{
    is: 'comment',
    then: Joi.object().keys({
      author: Joi.string().required(),
      permlink: Joi.string().required(),
      parent_author: Joi.string().allow('').required(),
      parent_permlink: Joi.string().allow('').required(),
      title: Joi.string().allow('').required(),
      body: Joi.string().required(),
      reply: Joi.boolean().default(false),
    }).required(),
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
    }).required(),
  }, {
    is: 'transfer',
    then: Joi.object().keys({
      to: Joi.string().required(),
      from: Joi.string().required(),
      amount: Joi.string().required(),
      memo: Joi.string().allow('').required(),
    }).required(),
  }, {
    is: 'withdraw_vesting',
    then: Joi.object().keys({
      account: Joi.string().required(),
      vesting_shares: Joi.string().required(),
    }).required(),
  }, {
    is: 'account_witness_vote',
    then: Joi.object().keys({
      account: Joi.string().required(),
      approve: Joi.boolean().required(),
      witness: Joi.string().required(),
    }).required(),
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
    }).required(),
  }, {
    is: 'fillOrder',
    then: Joi.object().keys({
      account: Joi.string().required(),
      current_pays: Joi.string().required(),
      open_pays: Joi.string().required(),
      timestamp: Joi.number().required(),
      exchanger: Joi.string().required(),
      orderId: Joi.number().required(),
    }).required(),
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
  }]),
}).options({ allowUnknown: true, stripUnknown: true });
