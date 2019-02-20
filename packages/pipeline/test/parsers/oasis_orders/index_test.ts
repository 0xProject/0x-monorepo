import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { OasisMarket } from '../../../src/data_sources/oasis';
import { TokenOrderbookSnapshot as TokenOrder } from '../../../src/entities';
import { parseOasisOrder } from '../../../src/parsers/oasis_orders';
import { OrderType } from '../../../src/types';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
describe('oasis_orders', () => {
    describe('parseOasisOrder', () => {
        it('converts oasisOrder to TokenOrder entity', () => {
            const oasisOrder: [string, BigNumber] = ['0.5', new BigNumber(10)];
            const oasisMarket: OasisMarket = {
                id: 'ABCDEF',
                base: 'DEF',
                quote: 'ABC',
                buyVol: 100,
                sellVol: 200,
                price: 1,
                high: 1,
                low: 0,
            };
            const observedTimestamp: number = Date.now();
            const orderType: OrderType = OrderType.Bid;
            const source: string = 'oasis';

            const expected = new TokenOrder();
            expected.source = 'oasis';
            expected.observedTimestamp = observedTimestamp;
            expected.orderType = OrderType.Bid;
            expected.price = new BigNumber(0.5);
            expected.baseAssetSymbol = 'DEF';
            expected.baseAssetAddress = null;
            expected.baseVolume = new BigNumber(10);
            expected.quoteAssetSymbol = 'ABC';
            expected.quoteAssetAddress = null;
            expected.quoteVolume = new BigNumber(5);
            expected.makerAddress = 'unknown';
            const actual = parseOasisOrder(oasisMarket, observedTimestamp, orderType, source, oasisOrder);
            expect(actual).deep.equal(expected);
        });
    });
});
