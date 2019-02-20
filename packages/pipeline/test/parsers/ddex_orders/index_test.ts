import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { DdexMarket } from '../../../src/data_sources/ddex';
import { TokenOrderbookSnapshot as TokenOrder } from '../../../src/entities';
import { parseDdexOrder } from '../../../src/parsers/ddex_orders';
import { OrderType } from '../../../src/types';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
describe('ddex_orders', () => {
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
                pricePrecision: 1,
                priceDecimals: 1,
                amountDecimals: 0,
            };
            const observedTimestamp: number = Date.now();
            const orderType: OrderType = OrderType.Bid;
            const source: string = 'ddex';

            const expected = new TokenOrder();
            expected.source = 'ddex';
            expected.observedTimestamp = observedTimestamp;
            expected.orderType = OrderType.Bid;
            expected.price = new BigNumber(0.5);
            expected.quoteAssetSymbol = 'ABC';
            expected.quoteAssetAddress = '0x0000000000000000000000000000000000000000';
            expected.quoteVolume = new BigNumber(5);
            expected.baseAssetSymbol = 'DEF';
            expected.baseAssetAddress = '0xb45df06e38540a675fdb5b598abf2c0dbe9d6b81';
            expected.baseVolume = new BigNumber(10);
            expected.makerAddress = 'unknown';
            const actual = parseDdexOrder(ddexMarket, observedTimestamp, orderType, source, ddexOrder);
            expect(actual).deep.equal(expected);
        });
    });
});
