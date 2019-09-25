import { ContractAddresses, ContractWrappers } from '@0x/contract-wrappers';
import { BlockchainLifecycle, tokenUtils } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { MarketOperation, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { SwapQuote, SwapQuoteConsumer } from '../src';
import { ExtensionContractType } from '../src/types';

import { chaiSetup } from './utils/chai_setup';
import { migrateOnceAsync } from './utils/migrate';
import { getFullyFillableSwapQuoteWithNoFees, getSignedOrdersWithNoFeesAsync } from './utils/swap_quote';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const ONE_ETH_IN_WEI = new BigNumber(1000000000000000000);
const TESTRPC_NETWORK_ID = 50;
const FILLABLE_AMOUNTS = [new BigNumber(2), new BigNumber(3), new BigNumber(5)].map(value =>
    value.multipliedBy(ONE_ETH_IN_WEI),
);
const LARGE_FILLABLE_AMOUNTS = [new BigNumber(20), new BigNumber(20), new BigNumber(20)].map(value =>
    value.multipliedBy(ONE_ETH_IN_WEI),
);

describe('swapQuoteConsumerUtils', () => {
    let contractWrappers: ContractWrappers;
    let userAddresses: string[];
    let makerAddress: string;
    let takerAddress: string;
    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let makerAssetData: string;
    let takerAssetData: string;
    let wethAssetData: string;
    let contractAddresses: ContractAddresses;
    let swapQuoteConsumer: SwapQuoteConsumer;

    const networkId = TESTRPC_NETWORK_ID;
    before(async () => {
        contractAddresses = await migrateOnceAsync();
        await blockchainLifecycle.startAsync();
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        const config = {
            networkId,
            contractAddresses,
        };
        contractWrappers = new ContractWrappers(provider, config);
        [takerAddress, makerAddress] = userAddresses;
        [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        [makerAssetData, takerAssetData, wethAssetData] = [
            assetDataUtils.encodeERC20AssetData(makerTokenAddress),
            assetDataUtils.encodeERC20AssetData(takerTokenAddress),
            assetDataUtils.encodeERC20AssetData(contractAddresses.etherToken),
        ];

        swapQuoteConsumer = new SwapQuoteConsumer(provider, {
            networkId,
        });
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('getConsumerTypeForSwapQuoteAsync', () => {
        let forwarderOrders: SignedOrder[];
        let exchangeOrders: SignedOrder[];
        let largeForwarderOrders: SignedOrder[];
        let forwarderSwapQuote: SwapQuote;
        let exchangeSwapQuote: SwapQuote;
        let largeForwarderSwapQuote: SwapQuote;

        beforeEach(async () => {
            exchangeOrders = await getSignedOrdersWithNoFeesAsync(
                provider,
                makerAssetData,
                takerAssetData,
                makerAddress,
                takerAddress,
                FILLABLE_AMOUNTS,
            );

            forwarderOrders = await getSignedOrdersWithNoFeesAsync(
                provider,
                makerAssetData,
                wethAssetData,
                makerAddress,
                takerAddress,
                FILLABLE_AMOUNTS,
            );

            largeForwarderOrders = await getSignedOrdersWithNoFeesAsync(
                provider,
                makerAssetData,
                wethAssetData,
                makerAddress,
                takerAddress,
                LARGE_FILLABLE_AMOUNTS,
            );

            forwarderSwapQuote = getFullyFillableSwapQuoteWithNoFees(
                makerAssetData,
                wethAssetData,
                forwarderOrders,
                MarketOperation.Sell,
            );

            largeForwarderSwapQuote = getFullyFillableSwapQuoteWithNoFees(
                makerAssetData,
                wethAssetData,
                largeForwarderOrders,
                MarketOperation.Sell,
            );

            exchangeSwapQuote = getFullyFillableSwapQuoteWithNoFees(
                makerAssetData,
                takerAssetData,
                exchangeOrders,
                MarketOperation.Sell,
            );
        });

        it('should return exchange consumer if takerAsset is not wEth', async () => {
            const extensionContractType = await swapQuoteConsumer.getOptimalExtensionContractTypeAsync(
                exchangeSwapQuote,
                { takerAddress },
            );
            expect(extensionContractType).to.equal(ExtensionContractType.None);
        });
        it('should return forwarder consumer if takerAsset is wEth and have enough eth balance', async () => {
            const extensionContractType = await swapQuoteConsumer.getOptimalExtensionContractTypeAsync(
                forwarderSwapQuote,
                { takerAddress },
            );
            expect(extensionContractType).to.equal(ExtensionContractType.Forwarder);
        });
        it('should return exchange consumer if takerAsset is wEth and taker has enough weth', async () => {
            const etherInWei = new BigNumber(20).multipliedBy(ONE_ETH_IN_WEI);
            await contractWrappers.weth9.deposit.sendTransactionAsync({ value: etherInWei, from: takerAddress });
            const extensionContractType = await swapQuoteConsumer.getOptimalExtensionContractTypeAsync(
                forwarderSwapQuote,
                { takerAddress },
            );
            expect(extensionContractType).to.equal(ExtensionContractType.None);
        });
        it('should return forwarder consumer if takerAsset is wEth and takerAddress has no available balance in either weth or eth (defaulting behavior)', async () => {
            const etherInWei = new BigNumber(50).multipliedBy(ONE_ETH_IN_WEI);
            await contractWrappers.weth9.deposit.sendTransactionAsync({ value: etherInWei, from: takerAddress });
            const extensionContractType = await swapQuoteConsumer.getOptimalExtensionContractTypeAsync(
                largeForwarderSwapQuote,
                { takerAddress },
            );
            expect(extensionContractType).to.equal(ExtensionContractType.Forwarder);
        });
    });
});
