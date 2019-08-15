import { ContractAddresses, ContractWrappers, ERC20TokenContract } from '@0x/contract-wrappers';
import { BlockchainLifecycle, tokenUtils } from '@0x/dev-utils';
import { FillScenarios } from '@0x/fill-scenarios';
import { assetDataUtils } from '@0x/order-utils';
import { MarketOperation, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { SwapQuote } from '../src';
import { constants } from '../src/constants';
import { ExchangeSwapQuoteConsumer } from '../src/quote_consumers/exchange_swap_quote_consumer';
import {
    ExchangeMarketBuySmartContractParams,
    ExchangeMarketSellSmartContractParams,
    MarketBuySwapQuote,
    MarketSellSwapQuote,
} from '../src/types';

import { chaiSetup } from './utils/chai_setup';
import { migrateOnceAsync } from './utils/migrate';
import { getFullyFillableSwapQuoteWithNoFees } from './utils/swap_quote';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const ONE_ETH_IN_WEI = new BigNumber(1000000000000000000);
const TESTRPC_NETWORK_ID = 50;
const FILLABLE_AMOUNTS = [new BigNumber(3), new BigNumber(2), new BigNumber(5)].map(value =>
    value.multipliedBy(ONE_ETH_IN_WEI),
);

describe('ExchangeSwapQuoteConsumer', () => {
    let contractWrappers: ContractWrappers;
    let userAddresses: string[];
    let erc20TokenContract: ERC20TokenContract;
    let coinbaseAddress: string;
    let makerAddress: string;
    let takerAddress: string;
    let fillScenarios: FillScenarios;
    let feeRecipient: string;
    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let makerAssetData: string;
    let takerAssetData: string;
    let wethAssetData: string;
    let contractAddresses: ContractAddresses;

    const networkId = TESTRPC_NETWORK_ID;

    let orders: SignedOrder[];
    let marketSellSwapQuote: SwapQuote;
    let marketBuySwapQuote: SwapQuote;
    let swapQuoteConsumer: ExchangeSwapQuoteConsumer;

    before(async () => {
        contractAddresses = await migrateOnceAsync();
        await blockchainLifecycle.startAsync();
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        fillScenarios = new FillScenarios(
            provider,
            userAddresses,
            contractAddresses.zrxToken,
            contractAddresses.exchange,
            contractAddresses.erc20Proxy,
            contractAddresses.erc721Proxy,
        );
        const config = {
            networkId,
            contractAddresses,
        };
        contractWrappers = new ContractWrappers(provider, config);
        [coinbaseAddress, takerAddress, makerAddress, feeRecipient] = userAddresses;
        [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        [makerAssetData, takerAssetData, wethAssetData] = [
            assetDataUtils.encodeERC20AssetData(makerTokenAddress),
            assetDataUtils.encodeERC20AssetData(takerTokenAddress),
            assetDataUtils.encodeERC20AssetData(contractAddresses.etherToken),
        ];
        erc20TokenContract = new ERC20TokenContract(makerTokenAddress, provider);
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
        orders = [];
        for (const fillableAmmount of FILLABLE_AMOUNTS) {
            const order = await fillScenarios.createFillableSignedOrderAsync(
                makerAssetData,
                takerAssetData,
                makerAddress,
                takerAddress,
                fillableAmmount,
            );
            orders.push(order);
        }

        marketSellSwapQuote = getFullyFillableSwapQuoteWithNoFees(
            makerAssetData,
            takerAssetData,
            orders,
            MarketOperation.Sell,
        );

        marketBuySwapQuote = getFullyFillableSwapQuoteWithNoFees(
            makerAssetData,
            takerAssetData,
            orders,
            MarketOperation.Buy,
        );

        swapQuoteConsumer = new ExchangeSwapQuoteConsumer(provider, {
            networkId,
        });
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('executeSwapQuoteOrThrowAsync', () => {
        /*
         * Testing that SwapQuoteConsumer logic correctly performs a execution (doesn't throw or revert)
         * Does not test the validity of the state change performed by the forwarder smart contract
         */
        it('should perform a marketSell execution when provided a MarketSell type swapQuote', async () => {
            let makerBalance = await erc20TokenContract.balanceOf.callAsync(makerAddress);
            let takerBalance = await erc20TokenContract.balanceOf.callAsync(takerAddress);
            expect(makerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
            expect(takerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
            await swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketSellSwapQuote, { takerAddress });
            makerBalance = await erc20TokenContract.balanceOf.callAsync(makerAddress);
            takerBalance = await erc20TokenContract.balanceOf.callAsync(takerAddress);
            expect(takerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
            expect(makerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should perform a marketBuy execution when provided a MarketBuy type swapQuote', async () => {
            let makerBalance = await erc20TokenContract.balanceOf.callAsync(makerAddress);
            let takerBalance = await erc20TokenContract.balanceOf.callAsync(takerAddress);
            expect(makerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
            expect(takerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
            await swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketBuySwapQuote, { takerAddress });
            makerBalance = await erc20TokenContract.balanceOf.callAsync(makerAddress);
            takerBalance = await erc20TokenContract.balanceOf.callAsync(takerAddress);
            expect(takerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
            expect(makerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
        });
    });

    describe('getSmartContractParamsOrThrow', () => {
        describe('valid swap quote', async () => {
            // TODO(david) Check for valid MethodAbi
            it('provide correct and optimized smart contract params for a marketSell SwapQuote', async () => {
                const { toAddress, params } = await swapQuoteConsumer.getSmartContractParamsOrThrowAsync(
                    marketSellSwapQuote,
                    {},
                );
                expect(toAddress).to.deep.equal(contractWrappers.exchange.address);
                const { takerAssetFillAmount, signatures, type } = params as ExchangeMarketSellSmartContractParams;
                expect(type).to.deep.equal(MarketOperation.Sell);
                expect(takerAssetFillAmount).to.bignumber.equal(
                    (marketSellSwapQuote as MarketSellSwapQuote).takerAssetFillAmount,
                );
                const orderSignatures = marketSellSwapQuote.orders.map(order => order.signature);
                expect(signatures).to.deep.equal(orderSignatures);
            });
            it('provide correct and optimized smart contract params for a marketBuy SwapQuote', async () => {
                const { toAddress, params } = await swapQuoteConsumer.getSmartContractParamsOrThrowAsync(
                    marketBuySwapQuote,
                    {},
                );
                expect(toAddress).to.deep.equal(contractWrappers.exchange.address);
                const { makerAssetFillAmount, signatures, type } = params as ExchangeMarketBuySmartContractParams;
                expect(type).to.deep.equal(MarketOperation.Buy);
                expect(makerAssetFillAmount).to.bignumber.equal(
                    (marketBuySwapQuote as MarketBuySwapQuote).makerAssetFillAmount,
                );
                const orderSignatures = marketSellSwapQuote.orders.map(order => order.signature);
                expect(signatures).to.deep.equal(orderSignatures);
            });
        });
    });

    describe('getCalldataOrThrow', () => {
        describe('valid swap quote', async () => {
            it('provide correct and optimized calldata options with default options for a marketSell SwapQuote (no affiliate fees)', async () => {
                let makerBalance = await erc20TokenContract.balanceOf.callAsync(makerAddress);
                let takerBalance = await erc20TokenContract.balanceOf.callAsync(takerAddress);
                expect(makerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
                expect(takerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
                const { calldataHexString, toAddress } = await swapQuoteConsumer.getCalldataOrThrowAsync(
                    marketSellSwapQuote,
                    {},
                );
                expect(toAddress).to.deep.equal(contractWrappers.exchange.address);
                await web3Wrapper.sendTransactionAsync({
                    from: takerAddress,
                    to: toAddress,
                    data: calldataHexString,
                    gas: 4000000,
                });
                makerBalance = await erc20TokenContract.balanceOf.callAsync(makerAddress);
                takerBalance = await erc20TokenContract.balanceOf.callAsync(takerAddress);
                expect(takerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
                expect(makerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('provide correct and optimized calldata options with default options for a marketBuy SwapQuote (no affiliate fees)', async () => {
                let makerBalance = await erc20TokenContract.balanceOf.callAsync(makerAddress);
                let takerBalance = await erc20TokenContract.balanceOf.callAsync(takerAddress);
                expect(makerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
                expect(takerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
                const { calldataHexString, toAddress } = await swapQuoteConsumer.getCalldataOrThrowAsync(
                    marketBuySwapQuote,
                    {},
                );
                expect(toAddress).to.deep.equal(contractWrappers.exchange.address);
                await web3Wrapper.sendTransactionAsync({
                    from: takerAddress,
                    to: toAddress,
                    data: calldataHexString,
                    gas: 4000000,
                });
                makerBalance = await erc20TokenContract.balanceOf.callAsync(makerAddress);
                takerBalance = await erc20TokenContract.balanceOf.callAsync(takerAddress);
                expect(takerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
                expect(makerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
            });
        });
    });
});
