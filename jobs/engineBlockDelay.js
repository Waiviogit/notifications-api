/* eslint-disable camelcase */
const { NOTIFICATIONS_TYPES, ENGINE_CHAIN_STATUSES } = require('constants/notificationTypes');
const { getLatestBlockInfo } = require('utilities/hiveEngine/blocks');
const hiveQuery = require('utilities/hiveApi/hiveQuery');
const wssHelper = require('utilities/helpers/wssHelper');
const _ = require('lodash');

module.exports = async () => {
  const hiveEngineBlock = await getLatestBlockInfo();
  const hiveBlock = await hiveQuery({
    method: 'condenser_api.get_dynamic_global_properties', params: [],
  });

  if (_.has(hiveBlock, 'error') || _.has(hiveEngineBlock, 'error')) return;

  const head_block_number = _.get(hiveBlock, 'head_block_number');
  const refHiveBlockNumber = _.get(hiveEngineBlock, 'refHiveBlockNumber');
  if (!head_block_number || !refHiveBlockNumber) return;

  const delay = head_block_number - refHiveBlockNumber;

  const notification = {
    status: delay > 100
      ? ENGINE_CHAIN_STATUSES.WARNING
      : ENGINE_CHAIN_STATUSES.OK,
    delay,
  };

  wssHelper.sendToAllClients(
    JSON.stringify({ type: NOTIFICATIONS_TYPES.HIVE_ENGINE_DELAY, notification }),
  );
};
