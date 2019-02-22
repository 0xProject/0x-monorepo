import { Connection, ConnectionOptions, createConnection } from 'typeorm';

import { logUtils } from '@0x/utils';

import * as ormConfig from '../ormconfig';
import { handleError } from '../utils';

import { createTableAsync, deleteTableAsync } from './queries/radar_orderbook_usd_prices';

(async () => {
    const connection = await createConnection(ormConfig as ConnectionOptions);
    logUtils.log('Generating radar_orderbook_usd_prices');
    await deleteTableAsync(connection);
    await createTableAsync(connection);
    logUtils.log('Done');
    process.exit(0);
})().catch(handleError);
