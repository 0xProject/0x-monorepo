import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { ParadexMarket, ParadexOrder } from '../../../src/data_sources/paradex';
import { TokenOrderbookSnapshot as TokenOrder } from '../../../src/entities';
import { parseParadexOrder } from '../../../src/parsers/paradex_orders';
import { OrderType } from '../../../src/types';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
describe('paradex_orders', () => {
    describe('parseParadexOrder', () => {
        it('converts ParadexOrder to TokenOrder entity', () => {
            const paradexOrder: ParadexOrder = {
                amount: '412',
                price: '0.1245',
            };
            const paradexMarket: ParadexMarket = {
                id: '2',
                symbol: 'ABC/DEF',
                baseToken: 'DEF',
                quoteToken: 'ABC',
                minOrderSize: '0.1',
                maxOrderSize: '1000',
                priceMaxDecimals: 5,
                amountMaxDecimals: 5,
                baseTokenAddress: '0xb45df06e38540a675fdb5b598abf2c0dbe9d6b81',
                quoteTokenAddress: '0x0000000000000000000000000000000000000000',
            };
            const observedTimestamp: number = Date.now();
            const orderType: OrderType = OrderType.Bid;
            const source: string = 'paradex';

            const expected = new TokenOrder();
            expected.source = 'paradex';
            expected.observedTimestamp = observedTimestamp;
            expected.orderType = OrderType.Bid;
            expected.price = new BigNumber(0.1245);
            expected.baseAssetSymbol = 'DEF';
            expected.baseAssetAddress = '0xb45df06e38540a675fdb5b598abf2c0dbe9d6b81';
            expected.baseVolume = new BigNumber(412);
            expected.quoteAssetSymbol = 'ABC';
            expected.quoteAssetAddress = '0x0000000000000000000000000000000000000000';
            expected.quoteVolume = new BigNumber(412 * 0.1245);
            expected.makerAddress = 'unknown';
            const actual = parseParadexOrder(paradexMarket, observedTimestamp, orderType, source, paradexOrder);
            expect(actual).deep.equal(expected);
        });
    });
});
