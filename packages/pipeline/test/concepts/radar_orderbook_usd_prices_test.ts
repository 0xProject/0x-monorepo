import * as chai from 'chai';
import 'mocha';

import { runQueryAsync } from '../../src/concepts/radar_orderbook_usd_prices';
import { createDbConnectionOnceAsync } from '../db_setup';
import { chaiSetup } from '../utils/chai_setup';

chaiSetup.configure();

describe('radar_orderbook_usd_prices', () => {
    it('Does not crash when running on current schema', async () => {
        const connection = await createDbConnectionOnceAsync();
        await runQueryAsync(connection);
    });
});
