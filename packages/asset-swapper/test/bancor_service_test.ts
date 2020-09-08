import { web3Factory, Web3ProviderEngine } from '@0x/dev-utils';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';

import { BancorFillData, BigNumber } from '../src';
import { BancorService, token } from '../src/utils/market_operation_utils/bancor_service';

import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

const ADDRESS_REGEX = /^(0x)?[0-9a-f]{40}$/i;
const RPC_URL = `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`;

const provider: Web3ProviderEngine = web3Factory.getRpcProvider({ rpcUrl: RPC_URL });
// tslint:disable:custom-no-magic-numbers

// These tests test the bancor SDK against mainnet
// TODO (xianny): After we move asset-swapper out of the monorepo, we should add an env variable to circle CI to run this test
describe.skip('Bancor Service', () => {
    const bancorService = new BancorService(provider);
    const eth = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    const bnt = '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c';
    it('should retrieve the bancor network address', async () => {
        const networkAddress = await bancorService.getBancorNetworkAddressAsync();
        expect(networkAddress).to.match(ADDRESS_REGEX);
    });
    it('should retrieve a quote', async () => {
        const amt = new BigNumber(2);
        const quotes = await bancorService.getQuotesAsync(eth, bnt, [amt]);
        const fillData = quotes[0].fillData as BancorFillData;

        // get rate from the bancor sdk
        const sdk = await bancorService.getSDKAsync();
        const expectedAmt = await sdk.pricing.getRateByPath(fillData.path.map(s => token(s)), amt.toString());

        expect(fillData.networkAddress).to.match(ADDRESS_REGEX);
        expect(fillData.path).to.be.an.instanceOf(Array);
        expect(fillData.path).to.have.lengthOf(3);
        expect(quotes[0].amount.dp(0)).to.bignumber.eq(
            new BigNumber(expectedAmt).multipliedBy(bancorService.minReturnAmountBufferPercentage).dp(0),
        );
    });
    // HACK (xianny): for exploring SDK results
    it('should retrieve multiple quotes', async () => {
        const amts = [1, 10, 100, 1000].map(a => new BigNumber(a).multipliedBy(10e18));
        const quotes = await bancorService.getQuotesAsync(eth, bnt, amts);
        quotes.map((q, i) => {
            // tslint:disable:no-console
            const fillData = q.fillData as BancorFillData;
            console.log(
                `Input ${amts[i].toExponential()}; Output: ${q.amount}; Path: ${
                    fillData.path.length
                }\nPath: ${JSON.stringify(fillData.path)}`,
            );
            // tslint:enable:no-console
        });
    });
});
