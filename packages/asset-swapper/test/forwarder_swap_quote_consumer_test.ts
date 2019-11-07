import { ContractAddresses, ContractWrappers, ERC20TokenContract } from '@0x/contract-wrappers';
import { BlockchainLifecycle, tokenUtils } from '@0x/dev-utils';
import { MarketOperation, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { SwapQuote } from '../src';
import { constants } from '../src/constants';
import { ForwarderSwapQuoteConsumer } from '../src/quote_consumers/forwarder_swap_quote_consumer';
import {
    ForwarderMarketBuySmartContractParams,
    ForwarderMarketSellSmartContractParams,
    MarketBuySwapQuote,
} from '../src/types';

import { chaiSetup } from './utils/chai_setup';
import { migrateOnceAsync } from './utils/migrate';
import { getFullyFillableSwapQuoteWithNoFees, getSignedOrdersWithNoFeesAsync } from './utils/swap_quote';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const ONE_ETH_IN_WEI = new BigNumber(1000000000000000000);
const TESTRPC_CHAIN_ID = 1337;
const MARKET_OPERATION = MarketOperation.Sell;
const FILLABLE_AMOUNTS = [new BigNumber(2), new BigNumber(3), new BigNumber(5)].map(value =>
    value.multipliedBy(ONE_ETH_IN_WEI),
);
const UNLIMITED_ALLOWANCE_IN_BASE_UNITS = new BigNumber(2).pow(256).minus(1); // tslint:disable-line:custom-no-magic-numbers

describe('ForwarderSwapQuoteConsumer', () => {
    let contractWrappers: ContractWrappers;
    let erc20Token: ERC20TokenContract;
    let userAddresses: string[];
    let coinbaseAddress: string;
    let makerAddress: string;
    let takerAddress: string;
    let feeRecipient: string;
    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let makerAssetData: string;
    let takerAssetData: string;
    let wethAssetData: string;
    let contractAddresses: ContractAddresses;

    let orders: SignedOrder[];
    let marketSellSwapQuote: SwapQuote;
    let marketBuySwapQuote: SwapQuote;
    let swapQuoteConsumer: ForwarderSwapQuoteConsumer;
    let erc20ProxyAddress: string;

    const chainId = TESTRPC_CHAIN_ID;
    before(async () => {
        contractAddresses = await migrateOnceAsync();
        await blockchainLifecycle.startAsync();
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        const config = {
            chainId,
            contractAddresses,
        };
        contractWrappers = new ContractWrappers(provider, config);
        [coinbaseAddress, takerAddress, makerAddress, feeRecipient] = userAddresses;
        [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        erc20Token = new ERC20TokenContract(makerTokenAddress, provider);
        [makerAssetData, takerAssetData, wethAssetData] = [
            await contractWrappers.devUtils.encodeERC20AssetData.callAsync(makerTokenAddress),
            await contractWrappers.devUtils.encodeERC20AssetData.callAsync(takerTokenAddress),
            await contractWrappers.devUtils.encodeERC20AssetData.callAsync(contractAddresses.etherToken),
        ];
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
        const UNLIMITED_ALLOWANCE = UNLIMITED_ALLOWANCE_IN_BASE_UNITS;
        erc20ProxyAddress = contractWrappers.erc20Proxy.address;

        const totalFillableAmount = FILLABLE_AMOUNTS.reduce(
            (a: BigNumber, c: BigNumber) => a.plus(c),
            new BigNumber(0),
        );

        await erc20Token.transfer.sendTransactionAsync(makerAddress, totalFillableAmount, {
            from: coinbaseAddress,
        });

        await erc20Token.approve.sendTransactionAsync(erc20ProxyAddress, UNLIMITED_ALLOWANCE, {
            from: makerAddress,
        });
        orders = await getSignedOrdersWithNoFeesAsync(
            provider,
            makerAssetData,
            wethAssetData,
            makerAddress,
            takerAddress,
            FILLABLE_AMOUNTS,
            contractAddresses.exchange,
        );

        marketSellSwapQuote = getFullyFillableSwapQuoteWithNoFees(
            makerAssetData,
            wethAssetData,
            orders,
            MarketOperation.Sell,
        );

        marketBuySwapQuote = getFullyFillableSwapQuoteWithNoFees(
            makerAssetData,
            wethAssetData,
            orders,
            MarketOperation.Buy,
        );

        swapQuoteConsumer = new ForwarderSwapQuoteConsumer(provider, {
            chainId,
        });
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('executeSwapQuoteOrThrowAsync', () => {
        describe('validation', () => {
            it('should throw if swapQuote provided is not a valid forwarder SwapQuote (taker asset is wEth', async () => {
                const invalidSignedOrders = await getSignedOrdersWithNoFeesAsync(
                    provider,
                    makerAssetData,
                    takerAssetData,
                    makerAddress,
                    takerAddress,
                    FILLABLE_AMOUNTS,
                );
                const invalidSwapQuote = getFullyFillableSwapQuoteWithNoFees(
                    makerAssetData,
                    takerAssetData,
                    invalidSignedOrders,
                    MARKET_OPERATION,
                );
                expect(
                    swapQuoteConsumer.executeSwapQuoteOrThrowAsync(invalidSwapQuote, { takerAddress }),
                ).to.be.rejectedWith(
                    `Expected quote.orders[0] to have takerAssetData set as ${wethAssetData}, but is ${takerAssetData}`,
                );
            });
        });

        // TODO(david) test execution of swap quotes with fee orders
        describe('valid swap quote', () => {
            /*
             * Testing that SwapQuoteConsumer logic correctly performs a execution (doesn't throw or revert)
             * Does not test the validity of the state change performed by the forwarder smart contract
             */
            it('should perform a marketSell execution when provided a MarketSell type swapQuote', async () => {
                let makerBalance = await erc20Token.balanceOf.callAsync(makerAddress);
                let takerBalance = await erc20Token.balanceOf.callAsync(takerAddress);
                expect(makerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
                expect(takerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
                await swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketSellSwapQuote, { takerAddress });
                makerBalance = await erc20Token.balanceOf.callAsync(makerAddress);
                takerBalance = await erc20Token.balanceOf.callAsync(takerAddress);
                expect(makerBalance).to.bignumber.equal(new BigNumber(0.5).multipliedBy(ONE_ETH_IN_WEI));
                expect(takerBalance).to.bignumber.equal(new BigNumber(9.5).multipliedBy(ONE_ETH_IN_WEI));
            });

            it('should perform a marketBuy execution when provided a MarketBuy type swapQuote', async () => {
                let makerBalance = await erc20Token.balanceOf.callAsync(makerAddress);
                let takerBalance = await erc20Token.balanceOf.callAsync(takerAddress);
                expect(makerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
                expect(takerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
                await swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketBuySwapQuote, { takerAddress });
                makerBalance = await erc20Token.balanceOf.callAsync(makerAddress);
                takerBalance = await erc20Token.balanceOf.callAsync(takerAddress);
                expect(takerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
                expect(makerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
            });

            it('should perform a marketBuy execution with affiliate fees', async () => {
                let makerBalance = await erc20Token.balanceOf.callAsync(makerAddress);
                let takerBalance = await erc20Token.balanceOf.callAsync(takerAddress);
                const feeRecipientEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(feeRecipient);
                expect(makerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
                expect(takerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
                await swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketBuySwapQuote, {
                    takerAddress,
                    feePercentage: 0.05,
                    feeRecipient,
                });
                makerBalance = await erc20Token.balanceOf.callAsync(makerAddress);
                takerBalance = await erc20Token.balanceOf.callAsync(takerAddress);
                const feeRecipientEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(feeRecipient);
                expect(makerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
                expect(takerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
                expect(feeRecipientEthBalanceAfter.minus(feeRecipientEthBalanceBefore)).to.bignumber.equal(
                    new BigNumber(0.5).multipliedBy(ONE_ETH_IN_WEI),
                );
            });

            // TODO(david) Finish marketSell affiliate fee excution testing
            // it('should perform a marketSell execution with affiliate fees', async () => {
            //     let makerBalance = await erc20Token.balanceOf.callAsync(makerAddress);
            //     let takerBalance = await erc20Token.balanceOf.callAsync(takerAddress);
            //     const feeRecipientEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(feeRecipient);
            //     expect(makerBalance).to.bignumber.equal((new BigNumber(10)).multipliedBy(ONE_ETH_IN_WEI));
            //     expect(takerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
            //     console.log(makerBalance, takerBalance, feeRecipientEthBalanceBefore);
            //     await swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketSellSwapQuote, { takerAddress, feePercentage: 0.05, feeRecipient });
            //     makerBalance = await erc20Token.balanceOf.callAsync(makerAddress);
            //     takerBalance = await erc20Token.balanceOf.callAsync(takerAddress);
            //     const feeRecipientEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(feeRecipient);
            //     console.log(makerBalance, takerBalance, feeRecipientEthBalanceAfter);
            //     expect(makerBalance).to.bignumber.equal((new BigNumber(0.5)).multipliedBy(ONE_ETH_IN_WEI));
            //     expect(takerBalance).to.bignumber.equal((new BigNumber(9.5)).multipliedBy(ONE_ETH_IN_WEI));
            //     expect(feeRecipientEthBalanceAfter.minus(feeRecipientEthBalanceBefore)).to.bignumber.equal((new BigNumber(0.5)).multipliedBy(ONE_ETH_IN_WEI));
            // });
        });
    });

    describe('getSmartContractParamsOrThrow', () => {
        describe('validation', () => {
            it('should throw if swap quote provided is not a valid forwarder SwapQuote (taker asset is WETH)', async () => {
                const invalidSignedOrders = await getSignedOrdersWithNoFeesAsync(
                    provider,
                    makerAssetData,
                    takerAssetData,
                    makerAddress,
                    takerAddress,
                    FILLABLE_AMOUNTS,
                );
                const invalidSwapQuote = getFullyFillableSwapQuoteWithNoFees(
                    makerAssetData,
                    takerAssetData,
                    invalidSignedOrders,
                    MARKET_OPERATION,
                );
                expect(swapQuoteConsumer.getSmartContractParamsOrThrowAsync(invalidSwapQuote, {})).to.be.rejectedWith(
                    `Expected quote.orders[0] to have takerAssetData set as ${wethAssetData}, but is ${takerAssetData}`,
                );
            });
        });

        describe('valid swap quote', async () => {
            it('provide correct and optimized smart contract params with default options for a marketSell SwapQuote (no affiliate fees)', async () => {
                const { toAddress, params } = await swapQuoteConsumer.getSmartContractParamsOrThrowAsync(
                    marketSellSwapQuote,
                    {},
                );
                expect(toAddress).to.deep.equal(contractWrappers.forwarder.address);
                const {
                    feeSignatures,
                    feePercentage,
                    feeRecipient: feeRecipientFromParams,
                    signatures,
                    type,
                } = params as ForwarderMarketSellSmartContractParams;
                expect(type).to.deep.equal(MarketOperation.Sell);
                expect(feeRecipientFromParams).to.deep.equal(constants.NULL_ADDRESS);
                const orderSignatures = marketSellSwapQuote.orders.map(order => order.signature);
                expect(signatures).to.deep.equal(orderSignatures);
                expect(feePercentage).to.bignumber.equal(0);
                expect(feeSignatures).to.deep.equal([]);
            });
            it('provide correct and optimized smart contract params with default options for a marketBuy SwapQuote (no affiliate fees)', async () => {
                const { toAddress, params } = await swapQuoteConsumer.getSmartContractParamsOrThrowAsync(
                    marketBuySwapQuote,
                    {},
                );
                expect(toAddress).to.deep.equal(contractWrappers.forwarder.address);
                const {
                    makerAssetFillAmount,
                    feeSignatures,
                    feePercentage,
                    feeRecipient: feeRecipientFromParams,
                    signatures,
                    type,
                } = params as ForwarderMarketBuySmartContractParams;
                expect(type).to.deep.equal(MarketOperation.Buy);
                expect(feeRecipientFromParams).to.deep.equal(constants.NULL_ADDRESS);
                expect(makerAssetFillAmount).to.bignumber.equal(
                    (marketBuySwapQuote as MarketBuySwapQuote).makerAssetFillAmount,
                );
                const orderSignatures = marketBuySwapQuote.orders.map(order => order.signature);
                expect(signatures).to.deep.equal(orderSignatures);
                expect(feePercentage).to.bignumber.equal(0);
                expect(feeSignatures).to.deep.equal([]);
            });
            it('provide correct and optimized smart contract params with affiliate fees for a marketSell SwapQuote', async () => {
                const { toAddress, params } = await swapQuoteConsumer.getSmartContractParamsOrThrowAsync(
                    marketSellSwapQuote,
                    {
                        feePercentage: 0.05,
                        feeRecipient,
                    },
                );
                expect(toAddress).to.deep.equal(contractWrappers.forwarder.address);
                const {
                    feeSignatures,
                    feePercentage,
                    feeRecipient: feeRecipientFromParams,
                    signatures,
                    type,
                } = params as ForwarderMarketSellSmartContractParams;
                expect(type).to.deep.equal(MarketOperation.Sell);
                expect(feeRecipientFromParams).to.deep.equal(feeRecipient);
                const orderSignatures = marketSellSwapQuote.orders.map(order => order.signature);
                expect(signatures).to.deep.equal(orderSignatures);
                expect(feePercentage).to.bignumber.equal(new BigNumber(0.05).multipliedBy(ONE_ETH_IN_WEI));
                expect(feeSignatures).to.deep.equal([]);
            });
            it('provide correct and optimized smart contract params with affiliate fees for a marketBuy SwapQuote', async () => {
                const { toAddress, params } = await swapQuoteConsumer.getSmartContractParamsOrThrowAsync(
                    marketBuySwapQuote,
                    {
                        feePercentage: 0.05,
                        feeRecipient,
                    },
                );
                expect(toAddress).to.deep.equal(contractWrappers.forwarder.address);
                const {
                    makerAssetFillAmount,
                    feeSignatures,
                    feePercentage,
                    feeRecipient: feeRecipientFromParams,
                    signatures,
                    type,
                } = params as ForwarderMarketBuySmartContractParams;
                expect(type).to.deep.equal(MarketOperation.Buy);
                expect(feeRecipientFromParams).to.deep.equal(feeRecipient);
                expect(makerAssetFillAmount).to.bignumber.equal(
                    (marketBuySwapQuote as MarketBuySwapQuote).makerAssetFillAmount,
                );
                const orderSignatures = marketBuySwapQuote.orders.map(order => order.signature);
                expect(signatures).to.deep.equal(orderSignatures);
                expect(feePercentage).to.bignumber.equal(new BigNumber(0.05).multipliedBy(ONE_ETH_IN_WEI));
                expect(feeSignatures).to.deep.equal([]);
            });
        });
    });

    describe('getCalldataOrThrow', () => {
        describe('validation', () => {
            it('should throw if swap quote provided is not a valid forwarder SwapQuote (taker asset is WETH)', async () => {
                const invalidSignedOrders = await getSignedOrdersWithNoFeesAsync(
                    provider,
                    makerAssetData,
                    takerAssetData,
                    makerAddress,
                    takerAddress,
                    FILLABLE_AMOUNTS,
                );
                const invalidSwapQuote = getFullyFillableSwapQuoteWithNoFees(
                    makerAssetData,
                    takerAssetData,
                    invalidSignedOrders,
                    MARKET_OPERATION,
                );
                expect(swapQuoteConsumer.getCalldataOrThrowAsync(invalidSwapQuote, {})).to.be.rejectedWith(
                    `Expected quote.orders[0] to have takerAssetData set as ${wethAssetData}, but is ${takerAssetData}`,
                );
            });
        });

        describe('valid swap quote', async () => {
            it('provide correct and optimized calldata options with default options for a marketSell SwapQuote (no affiliate fees)', async () => {
                let makerBalance = await erc20Token.balanceOf.callAsync(makerAddress);
                let takerBalance = await erc20Token.balanceOf.callAsync(takerAddress);
                expect(makerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
                expect(takerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
                const { calldataHexString, toAddress } = await swapQuoteConsumer.getCalldataOrThrowAsync(
                    marketSellSwapQuote,
                    {},
                );
                expect(toAddress).to.deep.equal(contractWrappers.forwarder.address);
                await web3Wrapper.sendTransactionAsync({
                    from: takerAddress,
                    to: toAddress,
                    data: calldataHexString,
                    value: marketSellSwapQuote.worstCaseQuoteInfo.totalTakerTokenAmount,
                    gas: 4000000,
                });
                makerBalance = await erc20Token.balanceOf.callAsync(makerAddress);
                takerBalance = await erc20Token.balanceOf.callAsync(takerAddress);
                expect(makerBalance).to.bignumber.equal(new BigNumber(0.5).multipliedBy(ONE_ETH_IN_WEI));
                expect(takerBalance).to.bignumber.equal(new BigNumber(9.5).multipliedBy(ONE_ETH_IN_WEI));
            });
            it('provide correct and optimized calldata options with default options for a marketBuy SwapQuote (no affiliate fees)', async () => {
                let makerBalance = await erc20Token.balanceOf.callAsync(makerAddress);
                let takerBalance = await erc20Token.balanceOf.callAsync(takerAddress);
                expect(makerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
                expect(takerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
                const { calldataHexString, toAddress } = await swapQuoteConsumer.getCalldataOrThrowAsync(
                    marketBuySwapQuote,
                    {},
                );
                expect(toAddress).to.deep.equal(contractAddresses.forwarder);
                await web3Wrapper.sendTransactionAsync({
                    from: takerAddress,
                    to: toAddress,
                    data: calldataHexString,
                    value: marketBuySwapQuote.worstCaseQuoteInfo.totalTakerTokenAmount,
                    gas: 4000000,
                });
                makerBalance = await erc20Token.balanceOf.callAsync(makerAddress);
                takerBalance = await erc20Token.balanceOf.callAsync(takerAddress);
                expect(takerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
                expect(makerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
            });
            // TODO(david) finish testing for affiliate fees calldata output
            // it('provide correct and optimized calldata options with affiliate fees for a marketSell SwapQuote', async () => {
            // });
            // it('provide correct and optimized calldata options with affiliate fees for a marketBuy SwapQuote', async () => {
            // });
        });
    });
});
