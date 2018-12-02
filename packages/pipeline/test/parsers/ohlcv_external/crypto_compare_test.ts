import * as chai from 'chai';
import 'mocha';
import { merge } from 'ramda';

import { CryptoCompareOHLCVRecord } from '../../../src/data_sources/ohlcv_external/crypto_compare';
import { OHLCVExternal } from '../../../src/entities';
import { parseRecords } from '../../../src/parsers/ohlcv_external/crypto_compare';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
describe('ohlcv_external parser (Crypto Compare)', () => {
    describe('parseRecords', () => {
        const record: CryptoCompareOHLCVRecord = {
            time: 200,
            close: 100,
            high: 101,
            low: 99,
            open: 98,
            volumefrom: 1234,
            volumeto: 4321,
        };

        const metadata = {
            fromSymbol: 'ETH',
            toSymbol: 'ZRX',
            exchange: 'CCCAGG',
            source: 'CryptoCompare',
            observedTimestamp: new Date().getTime(),
        };

        const scraped = new Date().getTime();

        const entity = new OHLCVExternal();
        entity.exchange = metadata.exchange;
        entity.fromSymbol = metadata.fromSymbol;
        entity.toSymbol = metadata.toSymbol;
        entity.startTime = 100000;
        entity.endTime = 200000;
        entity.open = record.open;
        entity.close = record.close;
        entity.low = record.low;
        entity.high = record.high;
        entity.volumeFrom = record.volumefrom;
        entity.volumeTo = record.volumeto;
        entity.source = metadata.source;
        entity.observedTimestamp = metadata.observedTimestamp;

        it('converts Crypto Compare OHLCV records to OHLCVExternal entity', () => {
            const input = [record, merge(record, { time: 300 }), merge(record, { time: 400 })];
            const expected = [
                entity,
                merge(entity, { startTime: 200000, endTime: 300000 }),
                merge(entity, { startTime: 300000, endTime: 400000 }),
            ];

            const actual = parseRecords(input, metadata);
            expect(actual).deep.equal(expected);
        });

        it('ignores records with no exchange specified', () => {
            const input = [record, merge(record, { time: 300, exchange: undefined }), merge(record, { time: 400 })];
            const expected = [entity, merge(entity, { startTime: 300000, endTime: 400000 })];

            const actual = parseRecords(input, metadata);
            expect(actual).deep.equal(expected);
        });

        it('ignores records if there is only one record in the batch', () => {
            const input = [record];
            const expected: OHLCVExternal[] = [];
            const actual = parseRecords(input, metadata);
            expect(actual).deep.equal(expected);
        });
    });
});
