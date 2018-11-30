import * as chai from 'chai';
import 'mocha';
import { merge } from 'ramda';

import { CryptoCompareOHLCVSource } from '../../../src/data_sources/ohlcv_external/crypto_compare';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
describe('ohlcv_external data source (Crypto Compare)', () => {
  describe('getBackfillIntervals', () => {
    it('generates pairs with intervals to query', () => {
      const source = new CryptoCompareOHLCVSource();
      const pair = {
        fromSymbol: 'ETH',
        toSymbol: 'ZRX',
        latest: new Date().getTime() - (source._interval * 2),
      };

      const expected = [
        pair,
        merge(pair, { latest: pair.latest + source._interval }),
        merge(pair, { latest: pair.latest + source._interval * 2 }),
      ];

      const actual = source.getBackfillIntervals(pair);
      expect(actual).deep.equal(expected);
    });

    it('returns single pair if no backfill is needed', () => {
      const source = new CryptoCompareOHLCVSource();
      const pair = {
        fromSymbol: 'ETH',
        toSymbol: 'ZRX',
        latest: new Date().getTime() - source._interval + 5000,
      };

      const expected = [ pair ];

      const actual = source.getBackfillIntervals(pair);
      expect(actual).deep.equal(expected);
    });
  });

  describe('getAsync', () => {
    // tslint:disable:no-empty
    // todo
  });
});
