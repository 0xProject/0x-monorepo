import { BlockchainLifecycle, callbackErrorReporter } from '@0x/dev-utils';
import { orderFactory } from '@0x/order-utils/lib/src/order_factory';
import { Web3ProviderEngine } from '@0x/subproviders';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import 'mocha';
import * as TypeMoq from 'typemoq';

import { ForwarderSwapQuoteConsumer, SwapQuote } from '../src';

import { chaiSetup } from './utils/chai_setup';
import { migrateOnceAsync } from './utils/migrate';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('ForwarderSwapQuoteConsumer', () => {
    let userAddresses: string[];

    before(async () => {
        const contractAddresses = await migrateOnceAsync();
        await blockchainLifecycle.startAsync();
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        // fillScenarios = new FillScenarios(
        //     provider,
        //     userAddresses,
        //     contractAddresses.zrxToken,
        //     contractAddresses.exchange,
        //     contractAddresses.erc20Proxy,
        //     contractAddresses.erc721Proxy,
        // );
        // [coinbase, makerAddress, takerAddress, feeRecipient] = userAddresses;
        // const [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        // [makerAssetData, takerAssetData] = [
        //     assetDataUtils.encodeERC20AssetData(makerTokenAddress),
        //     assetDataUtils.encodeERC20AssetData(takerTokenAddress),
        // ];
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
        // This constructor has incorrect types
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    it('works', () => {
        expect(true).to.be.equal(true);
    });
});
