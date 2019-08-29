import { ContractAddresses, ContractWrappers } from '@0x/contract-wrappers';
import { BlockchainLifecycle, tokenUtils } from '@0x/dev-utils';
import { FillScenarios } from '@0x/fill-scenarios';
import { assetDataUtils } from '@0x/order-utils';
import { MarketOperation, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { SwapQuote, SwapQuoteConsumer } from '../src';
import { ConsumerType } from '../src/types';
import { swapQuoteConsumerUtils } from '../src/utils/swap_quote_consumer_utils';

import { chaiSetup } from './utils/chai_setup';
import { migrateOnceAsync } from './utils/migrate';
import { getFullyFillableSwapQuoteWithNoFees, getSignedOrdersWithNoFeesAsync } from './utils/swap_quote';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const ONE_ETH_IN_WEI = new BigNumber(1000000000000000000);
const ZERO = new BigNumber(0);
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
    let feeRecipientAddress: string;
    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let makerAssetData: string;
    let takerAssetData: string;
    let wethAssetData: string;
    let contractAddresses: ContractAddresses;
    let fillScenarios: FillScenarios;

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
        [takerAddress, makerAddress, feeRecipientAddress] = userAddresses;
        [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        [makerAssetData, takerAssetData, wethAssetData] = [
            assetDataUtils.encodeERC20AssetData(makerTokenAddress),
            assetDataUtils.encodeERC20AssetData(takerTokenAddress),
            assetDataUtils.encodeERC20AssetData(contractAddresses.etherToken),
        ];
        fillScenarios = new FillScenarios(
            provider,
            userAddresses,
            contractAddresses.zrxToken,
            contractAddresses.exchange,
            contractAddresses.erc20Proxy,
            contractAddresses.erc721Proxy,
        );
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
        let coordinatorOrders: SignedOrder[];
        let largeForwarderOrders: SignedOrder[];
        let forwarderSwapQuote: SwapQuote;
        let exchangeSwapQuote: SwapQuote;
        let coordinatorSwapQuote: SwapQuote;
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
            // Coordinator
            const coordinatorOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                makerAssetData,
                takerAssetData,
                ZERO,
                ZERO,
                makerAddress,
                takerAddress,
                FILLABLE_AMOUNTS[0],
                feeRecipientAddress,
                undefined, // expiration time
                contractAddresses.coordinator,
            );
            coordinatorOrders = [coordinatorOrder];
            coordinatorSwapQuote = getFullyFillableSwapQuoteWithNoFees(
                makerAssetData,
                takerAssetData,
                coordinatorOrders,
                MarketOperation.Sell,
            );
        });

        it('should return exchange consumer if takerAsset is not wEth', async () => {
            const consumerType = await swapQuoteConsumerUtils.getConsumerTypeForSwapQuoteAsync(
                exchangeSwapQuote,
                contractWrappers,
                provider,
                { takerAddress },
            );
            expect(consumerType).to.equal(ConsumerType.Exchange);
        });
        it('should return forwarder consumer if takerAsset is wEth and have enough eth balance', async () => {
            const consumerType = await swapQuoteConsumerUtils.getConsumerTypeForSwapQuoteAsync(
                forwarderSwapQuote,
                contractWrappers,
                provider,
                { takerAddress },
            );
            expect(consumerType).to.equal(ConsumerType.Forwarder);
        });
        it('should return exchange consumer if takerAsset is wEth and taker has enough weth', async () => {
            const etherInWei = new BigNumber(20).multipliedBy(ONE_ETH_IN_WEI);
            await contractWrappers.weth9.deposit.sendTransactionAsync({ value: etherInWei, from: takerAddress });
            const consumerType = await swapQuoteConsumerUtils.getConsumerTypeForSwapQuoteAsync(
                forwarderSwapQuote,
                contractWrappers,
                provider,
                { takerAddress },
            );
            expect(consumerType).to.equal(ConsumerType.Exchange);
        });
        it('should return forwarder consumer if takerAsset is wEth and takerAddress has no available balance in either weth or eth (defaulting behavior)', async () => {
            const etherInWei = new BigNumber(50).multipliedBy(ONE_ETH_IN_WEI);
            await contractWrappers.weth9.deposit.sendTransactionAsync({ value: etherInWei, from: takerAddress });
            const consumerType = await swapQuoteConsumerUtils.getConsumerTypeForSwapQuoteAsync(
                largeForwarderSwapQuote,
                contractWrappers,
                provider,
                { takerAddress },
            );
            expect(consumerType).to.equal(ConsumerType.Forwarder);
        });
        it('should return coordinator consumer if order specifies senderAddress as coordinator', async () => {
            const consumerType = await swapQuoteConsumerUtils.getConsumerTypeForSwapQuoteAsync(
                coordinatorSwapQuote,
                contractWrappers,
                provider,
                { takerAddress },
            );
            expect(consumerType).to.equal(ConsumerType.Coordinator);
        });
        it('should return forwarder consumer if takerAsset is wEth and taker has enough weth and the override is provided', async () => {
            const etherInWei = new BigNumber(20).multipliedBy(ONE_ETH_IN_WEI);
            await contractWrappers.weth9.deposit.sendTransactionAsync({ value: etherInWei, from: takerAddress });
            const swapQuoteConsumer = new SwapQuoteConsumer(provider, { networkId });
            const callData = await swapQuoteConsumer.getCalldataOrThrowAsync(forwarderSwapQuote, {
                useConsumerType: ConsumerType.Forwarder,
                takerAddress,
            });
            expect(callData.toAddress).to.equal(contractAddresses.forwarder);
        });
    });
});
