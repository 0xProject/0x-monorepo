import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { DdexMarket } from '../../../src/data_sources/ddex';
import { TokenOrderbookSnapshot as TokenOrder } from '../../../src/entities';
import { aggregateOrders, parseDdexOrder } from '../../../src/parsers/ddex_orders';
import { OrderType } from '../../../src/types';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
describe('ddex_orders', () => {
    describe('aggregateOrders', () => {
        it('aggregates orders by price point', () => {
            const input = [
                { price: '1', amount: '20', orderId: 'testtest' },
                { price: '1', amount: '30', orderId: 'testone' },
                { price: '2', amount: '100', orderId: 'testtwo' },
            ];
            const expected = [['1', new BigNumber(50)], ['2', new BigNumber(100)]];
            const actual = aggregateOrders(input);
            expect(actual).deep.equal(expected);
        });
    });

    describe('parseDdexOrder', () => {
        it('converts ddexOrder to TokenOrder entity', () => {
            const ddexOrder: [string, BigNumber] = ['0.5', new BigNumber(10)];
            const ddexMarket: DdexMarket = {
                id: 'ABC-DEF',
                quoteToken: 'ABC',
                quoteTokenDecimals: 5,
                quoteTokenAddress: '0x0000000000000000000000000000000000000000',
                baseToken: 'DEF',
                baseTokenDecimals: 2,
                baseTokenAddress: '0xb45df06e38540a675fdb5b598abf2c0dbe9d6b81',
                minOrderSize: '0.1',
                maxOrderSize: '1000',
                pricePrecision: 1,
                priceDecimals: 1,
                amountDecimals: 0,
            };
            const observedTimestamp: number = Date.now();
            const orderType: OrderType = 'bid';
            const source: string = 'ddex';

            const expected = new TokenOrder();
            expected.source = 'ddex';
            expected.observedTimestamp = observedTimestamp;
            expected.orderType = 'bid';
            expected.price = new BigNumber(0.5);
            expected.baseAssetSymbol = 'DEF';
            expected.baseAssetAddress = '0xb45df06e38540a675fdb5b598abf2c0dbe9d6b81';
            expected.baseVolume = new BigNumber(5);
            expected.quoteAssetSymbol = 'ABC';
            expected.quoteAssetAddress = '0x0000000000000000000000000000000000000000';
            expected.quoteVolume = new BigNumber(10);

            const actual = parseDdexOrder(ddexMarket, observedTimestamp, orderType, source, ddexOrder);
            expect(actual).deep.equal(expected);
        });
    });
});
// tslint:enable:custom-no-magic-numbers
