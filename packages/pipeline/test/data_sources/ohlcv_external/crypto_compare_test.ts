import * as chai from 'chai';
import 'mocha';
import * as R from 'ramda';

import { CryptoCompareOHLCVSource } from '../../../src/data_sources/ohlcv_external/crypto_compare';
import { TradingPair } from '../../../src/utils/get_ohlcv_trading_pairs';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
describe('ohlcv_external data source (Crypto Compare)', () => {
    describe('generateBackfillIntervals', () => {
        it('generates pairs with intervals to query', () => {
            const source = new CryptoCompareOHLCVSource(20);
            const pair: TradingPair = {
                fromSymbol: 'ETH',
                toSymbol: 'ZRX',
                latestSavedTime: new Date().getTime() - source.interval * 2,
            };

            const expected = [
                pair,
                R.merge(pair, { latestSavedTime: pair.latestSavedTime + source.interval }),
                R.merge(pair, { latestSavedTime: pair.latestSavedTime + source.interval * 2 }),
            ];

            const actual = source.generateBackfillIntervals(pair);
            expect(actual).deep.equal(expected);
        });

        it('returns single pair if no backfill is needed', () => {
            const source = new CryptoCompareOHLCVSource(20);
            const pair: TradingPair = {
                fromSymbol: 'ETH',
                toSymbol: 'ZRX',
                latestSavedTime: new Date().getTime() - source.interval + 5000,
            };

            const expected = [pair];

            const actual = source.generateBackfillIntervals(pair);
            expect(actual).deep.equal(expected);
        });
    });
});
