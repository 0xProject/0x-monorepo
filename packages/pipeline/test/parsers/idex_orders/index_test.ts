import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { IdexOrder, IdexOrderParam } from '../../../src/data_sources/idex';
import { TokenOrderbookSnapshot as TokenOrder } from '../../../src/entities';
import { aggregateOrders, parseIdexOrder } from '../../../src/parsers/idex_orders';
import { OrderType } from '../../../src/types';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
describe('idex_orders', () => {
    describe('aggregateOrders', () => {
        it('aggregates orders by price point', () => {
            const emptyOrderParam: IdexOrderParam = {
                tokenBuy: '',
                buySymbol: '',
                buyPrecision: 2,
                amountBuy: '',
                tokenSell: '',
                sellSymbol: '',
                sellPrecision: 2,
                amountSell: '',
                expires: 100000,
                nonce: 1,
                user: '',
            };
            const input = [
                { price: '1', amount: '20', orderHash: 'testtest', total: '20', params: emptyOrderParam },
                { price: '1', amount: '30', orderHash: 'testone', total: '30', params: emptyOrderParam },
                { price: '2', amount: '100', orderHash: 'testtwo', total: '200', params: emptyOrderParam },
            ];
            const expected = [['1', new BigNumber(50)], ['2', new BigNumber(100)]];
            const actual = aggregateOrders(input);
            expect(actual).deep.equal(expected);
        });

        it('handles empty orders gracefully', () => {
            const input: IdexOrder[] = [];
            const expected: Array<[string, BigNumber]> = [];
            const actual = aggregateOrders(input);
            expect(actual).deep.equal(expected);
        });
    });

    describe('parseIdexOrder', () => {
        // for market listed as 'DEF_ABC'.
        it('correctly converts bid type idexOrder to TokenOrder entity', () => {
            const idexOrder: [string, BigNumber] = ['0.5', new BigNumber(10)];
            const idexOrderParam: IdexOrderParam = {
                tokenBuy: '0x0000000000000000000000000000000000000000',
                buySymbol: 'ABC',
                buyPrecision: 2,
                amountBuy: '10',
                tokenSell: '0xb45df06e38540a675fdb5b598abf2c0dbe9d6b81',
                sellSymbol: 'DEF',
                sellPrecision: 2,
                amountSell: '5',
                expires: Date.now() + 100000,
                nonce: 1,
                user: '0x212345667543456435324564345643453453333',
            };
            const observedTimestamp: number = Date.now();
            const orderType: OrderType = 'bid';
            const source: string = 'idex';

            const expected = new TokenOrder();
            expected.source = 'idex';
            expected.observedTimestamp = observedTimestamp;
            expected.orderType = 'bid';
            expected.price = new BigNumber(0.5);
            expected.baseAssetSymbol = 'ABC';
            expected.baseAssetAddress = '0x0000000000000000000000000000000000000000';
            expected.baseVolume = new BigNumber(10);
            expected.quoteAssetSymbol = 'DEF';
            expected.quoteAssetAddress = '0xb45df06e38540a675fdb5b598abf2c0dbe9d6b81';
            expected.quoteVolume = new BigNumber(5);

            const actual = parseIdexOrder(idexOrderParam, observedTimestamp, orderType, source, idexOrder);
            expect(actual).deep.equal(expected);
        });
        it('correctly converts ask type idexOrder to TokenOrder entity', () => {
            const idexOrder: [string, BigNumber] = ['0.5', new BigNumber(10)];
            const idexOrderParam: IdexOrderParam = {
                tokenBuy: '0xb45df06e38540a675fdb5b598abf2c0dbe9d6b81',
                buySymbol: 'DEF',
                buyPrecision: 2,
                amountBuy: '5',
                tokenSell: '0x0000000000000000000000000000000000000000',
                sellSymbol: 'ABC',
                sellPrecision: 2,
                amountSell: '10',
                expires: Date.now() + 100000,
                nonce: 1,
                user: '0x212345667543456435324564345643453453333',
            };
            const observedTimestamp: number = Date.now();
            const orderType: OrderType = 'ask';
            const source: string = 'idex';

            const expected = new TokenOrder();
            expected.source = 'idex';
            expected.observedTimestamp = observedTimestamp;
            expected.orderType = 'ask';
            expected.price = new BigNumber(0.5);
            expected.baseAssetSymbol = 'ABC';
            expected.baseAssetAddress = '0x0000000000000000000000000000000000000000';
            expected.baseVolume = new BigNumber(10);
            expected.quoteAssetSymbol = 'DEF';
            expected.quoteAssetAddress = '0xb45df06e38540a675fdb5b598abf2c0dbe9d6b81';
            expected.quoteVolume = new BigNumber(5);

            const actual = parseIdexOrder(idexOrderParam, observedTimestamp, orderType, source, idexOrder);
            expect(actual).deep.equal(expected);
        });
    });
});
