import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';

import { BigNumber } from '../src';
import { BancorService, token } from '../src/utils/market_operation_utils/bancor_service';

import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

const ADDRESS_REGEX = /^(0x)?[0-9a-f]{40}$/i;
const RPC_URL = `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`;
// tslint:disable:custom-no-magic-numbers

// These tests test the bancor SDK against mainnet
// Will be skipped if the env variable INFURA_PROJECT_ID is not set
describe('Bancor Service', () => {
    const bancorService = new BancorService(RPC_URL);
    it('should retrieve the bancor network address', async () => {
        if (!process.env.INFURA_PROJECT_ID) {
            return;
        }
        const networkAddress = await bancorService.getBancorNetworkAddressAsync();
        expect(networkAddress).to.match(ADDRESS_REGEX);
    });
    it('should retrieve a quote', async () => {
        if (!process.env.INFURA_PROJECT_ID) {
            return;
        }
        const eth = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
        const bnt = '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c';
        const amt = new BigNumber(50);
        const quote = await bancorService.getQuoteAsync(eth, bnt, amt);

        // get rate from the bancor sdk
        const sdk = await bancorService.getSDKAsync();
        const expectedAmt = await sdk.pricing.getRateByPath(quote.fillData.path.map(s => token(s)), amt.toString());

        expect(quote.fillData.networkAddress).to.match(ADDRESS_REGEX);
        expect(quote.fillData.path).to.be.an.instanceOf(Array);
        expect(quote.fillData.path).to.have.lengthOf.above(2);
        expect(quote.amount).to.bignumber.eq(
            new BigNumber(expectedAmt).multipliedBy(bancorService.minReturnAmountBufferPercentage),
        );
    });
    // HACK (xianny): for exploring SDK results
    it.skip('should retrieve multiple quotes', async () => {
        const usdc = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
        const dai = '0x6b175474e89094c44da98b954eedeac495271d0f';
        const amts = [1, 10, 100, 1000].map(a => new BigNumber(a));
        const quotes = await Promise.all(amts.map(async amount => bancorService.getQuoteAsync(usdc, dai, amount)));
        quotes.map((q, i) => {
            // tslint:disable:no-console
            console.log(
                `Input ${amts[i]}; Output: ${q.amount}; Path: ${q.fillData.path.length}\nPath: ${JSON.stringify(
                    q.fillData.path,
                )}`,
            );
            // tslint:enable:no-console
        });
    });
});
