import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { EdpsExchange } from '../../../src/data_sources/slippage';
import { Slippage } from '../../../src/entities';
import { calculateSlippage } from '../../../src/parsers/slippage';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
describe('slippage', () => {
    describe('calculateSlippage', () => {
        it('calculates slippage correctly', () => {

            const exchange = 'Radar Relay';
            const ts = 1549961441473;
            const symbol = 'DAI';
            const amount = 1000;
            const buyPrice = 10;
            const sellPrice = 9;
            const expectedSlippage = 0.1;

            const buyEdps = new Map<string, EdpsExchange>();
            const buyOrder: EdpsExchange = {
                exchangeName: exchange,
                totalPrice: buyPrice,
                tokenAmount: amount,
                tokenSymbol: symbol,
                avgPrice: buyPrice / amount,
                timestamp: ts,
                error: '',
            };
            buyEdps.set(exchange, buyOrder);

            const sellEdps = new Map<string, EdpsExchange>();
            const sellOrder: EdpsExchange = {
                exchangeName: exchange,
                totalPrice: sellPrice,
                tokenAmount: amount,
                tokenSymbol: symbol,
                avgPrice: sellPrice / amount,
                timestamp: ts,
                error: '',
            };
            sellEdps.set(exchange, sellOrder);
            const expected = new Slippage();
            expected.observedTimestamp = ts;
            expected.symbol = symbol;
            expected.exchange = exchange;
            expected.usdAmount = new BigNumber(amount);
            expected.tokenAmount = new BigNumber(amount); // API returns a string
            expected.avgPriceInEthBuy = new BigNumber(buyPrice / amount);
            expected.avgPriceInEthSell = new BigNumber(sellPrice / amount);
            expected.slippage = new BigNumber(0.1);

            const actual = calculateSlippage(amount, exchange, buyEdps, sellEdps);
            const actualSlippage: BigNumber = actual.slippage ? actual.slippage : new BigNumber(0);
            expect(actualSlippage.toNumber()).to.be.closeTo(expectedSlippage, 0.0001);
        });
    });
});
