import * as chai from 'chai';
import 'mocha';

import { BloxySource, BloxyTrade } from '../../../src/data_sources/bloxy';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

describe('Bloxy data source', () => {
    it('should return some trades', async () => {
        const apiKey = process.env.BLOXY_API_KEY;
        if (apiKey === undefined) {
            throw new Error('Missing required env var: BLOXY_API_KEY');
        }
        // tslint:disable-next-line:custom-no-magic-numbers
        const bloxySource = new BloxySource(apiKey /*, 1 trades per query, 0 offset buffer*/);
        // tslint:disable-next-line:custom-no-magic-numbers
        const thirtyOneMinutesAgo = Date.now(); // - 1 * 60 * 1000;
        const rawTrades: BloxyTrade[] = await bloxySource.getDexTradesAsync(thirtyOneMinutesAgo);
        expect(rawTrades.length).to.be.greaterThan(0);
    });
});
