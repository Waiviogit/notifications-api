const Joi = require('@hapi/joi');

exports.operationsSchema = Joi.object().keys({
  id: Joi.string().valid('comment', 'custom_json', 'transfer', 'account_witness_vote', 'restaurantStatus', 'withdraw_vesting', 'fillOrder').required(),
  block: Joi.number().required(),
  data: Joi
    .when('id', {
      is: 'comment',
      then: Joi.object().keys({
        author: Joi.string().required(),
        permlink: Joi.string().required(),
        parent_author: Joi.string().allow('').required(),
        parent_permlink: Joi.string().allow('').required(),
        title: Joi.string().allow('').required(),
        body: Joi.string().required(),
      }).required(),
    })
    .when('id', {
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
    })
    .when('id', {
      is: 'transfer',
      then: Joi.object().keys({
        to: Joi.string().required(),
        from: Joi.string().required(),
        amount: Joi.string().required(),
        memo: Joi.string().allow('').required(),
      }).required(),
    })
    .when('id', {
      is: 'withdraw_vesting',
      then: Joi.object().keys({
        account: Joi.string().required(),
        vesting_shares: Joi.string().required(),
      }).required(),
    })
    .when('id', {
      is: 'account_witness_vote',
      then: Joi.object().keys({
        account: Joi.string().required(),
        approve: Joi.boolean().required(),
        witness: Joi.string().required(),
      }).required(),
    })
    .when('id', {
      is: 'restaurantStatus',
      then: Joi.object().keys({
        object_name: Joi.string().required(),
        author_permlink: Joi.string().required(),
        experts: Joi.array().items(String).required(),
        creator: Joi.string().required(),
        body: Joi.string().required(),
        voter: Joi.string().allow('').default(''),
      }).required(),
    })
    .when('id', {
      is: 'fillOrder',
      then: Joi.object().keys({
        account: Joi.string().required(),
        current_pays: Joi.string().required(),
        open_pays: Joi.string().required(),
        timestamp: Joi.number().required(),
        exchanger: Joi.string().required(),
        orderId: Joi.number().required(),
      }).required(),
    }),
}).options({ allowUnknown: true, stripUnknown: true });
