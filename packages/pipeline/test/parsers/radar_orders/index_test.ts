import { BigNumber } from '@0x/utils';
import { RadarBook, RadarMarket, RadarSignedOrder } from '@radarrelay/types';
import * as chai from 'chai';
import 'mocha';

import { TokenOrderbookSnapshot as TokenOrder } from '../../../src/entities';
import { AggregateOrdersByMaker, parseRadarOrder } from '../../../src/parsers/radar_orders';
import { OrderType } from '../../../src/types';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
describe('radar_orders', () => {
    describe('parseRadarOrder', () => {
        it('converts radarOrder to TokenOrder entity', () => {
            const radarOrder: AggregateOrdersByMaker = {
                makerAddress: '0x6eC92694ea172ebC430C30fa31De87620967A082',
                price: '0.01',
                amount: new BigNumber(10000000000),
            };
            const radarMarket = ({
                id: 'WETH-DAI',
                displayName: 'WETH/DAI',
                baseTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                quoteTokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
                baseTokenDecimals: 18,
                quoteTokenDecimals: 18,
                quoteIncrement: 8,
                minOrderSize: new BigNumber('0.00692535'),
                maxOrderSize: new BigNumber('1000000000'),
                score: 99.66,
                // Radar types are defined using an older version of BigNumber, so need to be force cast.
            } as any) as RadarMarket;
            const observedTimestamp: number = Date.now();
            const orderType: OrderType = OrderType.Bid;
            const source: string = 'radar';

            const expected = new TokenOrder();
            expected.source = 'radar';
            expected.observedTimestamp = observedTimestamp;
            expected.orderType = OrderType.Bid;
            expected.price = new BigNumber(0.01);
            expected.quoteAssetSymbol = 'DAI';
            expected.quoteAssetAddress = '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359';
            expected.quoteVolume = new BigNumber(100000000);
            expected.baseAssetSymbol = 'WETH';
            expected.baseAssetAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
            expected.baseVolume = new BigNumber(10000000000);
            expected.makerAddress = '0x6eC92694ea172ebC430C30fa31De87620967A082';
            const actual = parseRadarOrder(radarMarket, observedTimestamp, orderType, source, radarOrder);
            expect(actual).deep.equal(expected);
        });
    });
});
