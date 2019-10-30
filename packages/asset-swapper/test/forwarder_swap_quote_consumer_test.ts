import { ContractAddresses, ContractWrappers, ERC20TokenContract } from '@0x/contract-wrappers';
import { constants as devConstants, OrderFactory } from '@0x/contracts-test-utils';
import { BlockchainLifecycle, tokenUtils } from '@0x/dev-utils';
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
    MarketOperation,
    PrunedSignedOrder,
} from '../src/types';

import { chaiSetup } from './utils/chai_setup';
import { migrateOnceAsync } from './utils/migrate';
import { getFullyFillableSwapQuoteWithNoFees } from './utils/swap_quote';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const GAS_PRICE = new BigNumber(devConstants.DEFAULT_GAS_PRICE);
const ONE_ETH_IN_WEI = new BigNumber(1000000000000000000);
const TESTRPC_CHAIN_ID = 1337;
const FILLABLE_AMOUNTS = [new BigNumber(2), new BigNumber(3), new BigNumber(5)].map(value =>
    value.multipliedBy(ONE_ETH_IN_WEI),
);
const UNLIMITED_ALLOWANCE_IN_BASE_UNITS = new BigNumber(2).pow(256).minus(1); // tslint:disable-line:custom-no-magic-numbers

const PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS: Array<Partial<PrunedSignedOrder>> = [
    {
        takerAssetAmount: new BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
    },
    {
        takerAssetAmount: new BigNumber(1).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new BigNumber(3).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new BigNumber(1).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new BigNumber(3).multipliedBy(ONE_ETH_IN_WEI),
    },
    {
        takerAssetAmount: new BigNumber(1).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new BigNumber(5).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new BigNumber(1).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new BigNumber(5).multipliedBy(ONE_ETH_IN_WEI),
    },
];

const expectMakerAndTakerBalancesAsyncFactory = (
    erc20TokenContract: ERC20TokenContract,
    makerAddress: string,
    takerAddress: string,
) => async (expectedMakerBalance: BigNumber, expectedTakerBalance: BigNumber) => {
    const makerBalance = await erc20TokenContract.balanceOf.callAsync(makerAddress);
    const takerBalance = await erc20TokenContract.balanceOf.callAsync(takerAddress);
    expect(makerBalance).to.bignumber.equal(expectedMakerBalance);
    expect(takerBalance).to.bignumber.equal(expectedTakerBalance);
};

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
    let orderFactory: OrderFactory;
    let invalidOrderFactory: OrderFactory;
    let wethAssetData: string;
    let contractAddresses: ContractAddresses;

    let orders: PrunedSignedOrder[];
    let invalidOrders: PrunedSignedOrder[];
    let marketSellSwapQuote: SwapQuote;
    let marketBuySwapQuote: SwapQuote;
    let invalidMarketBuySwapQuote: SwapQuote;
    let swapQuoteConsumer: ForwarderSwapQuoteConsumer;
    let expectMakerAndTakerBalancesAsync: (
        expectedMakerBalance: BigNumber,
        expectedTakerBalance: BigNumber,
    ) => Promise<void>;
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
        // Configure order defaults
        const defaultOrderParams = {
            ...devConstants.STATIC_ORDER_PARAMS,
            makerAddress,
            takerAddress: constants.NULL_ADDRESS,
            makerAssetData,
            takerAssetData: wethAssetData,
            makerFeeAssetData: constants.NULL_ERC20_ASSET_DATA,
            takerFeeAssetData: constants.NULL_ERC20_ASSET_DATA,
            makerFee: constants.ZERO_AMOUNT,
            takerFee: constants.ZERO_AMOUNT,
            feeRecipientAddress: feeRecipient,
            exchangeAddress: contractAddresses.exchange,
            chainId,
        };
        const invalidDefaultOrderParams = {
            ...defaultOrderParams,
            ...{
                takerAssetData,
            },
        };
        const privateKey = devConstants.TESTRPC_PRIVATE_KEYS[userAddresses.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
        expectMakerAndTakerBalancesAsync = expectMakerAndTakerBalancesAsyncFactory(
            erc20Token,
            makerAddress,
            takerAddress,
        );
        invalidOrderFactory = new OrderFactory(privateKey, invalidDefaultOrderParams);
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
        const UNLIMITED_ALLOWANCE = UNLIMITED_ALLOWANCE_IN_BASE_UNITS;

        const totalFillableAmount = FILLABLE_AMOUNTS.reduce(
            (a: BigNumber, c: BigNumber) => a.plus(c),
            new BigNumber(0),
        );

        await erc20Token.transfer.sendTransactionAsync(makerAddress, totalFillableAmount, {
            from: coinbaseAddress,
        });

        await erc20Token.approve.sendTransactionAsync(contractAddresses.erc20Proxy, UNLIMITED_ALLOWANCE, {
            from: makerAddress,
        });

        await contractWrappers.forwarder.approveMakerAssetProxy.sendTransactionAsync(makerAssetData, {
            from: makerAddress,
        });

        orders = [];
        for (const partialOrder of PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS) {
            const order = await orderFactory.newSignedOrderAsync(partialOrder);
            const prunedOrder = {
                ...order,
                ...partialOrder,
            };
            orders.push(prunedOrder as PrunedSignedOrder);
        }

        invalidOrders = [];
        for (const partialOrder of PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS) {
            const order = await invalidOrderFactory.newSignedOrderAsync(partialOrder);
            const prunedOrder = {
                ...order,
                ...partialOrder,
            };
            invalidOrders.push(prunedOrder as PrunedSignedOrder);
        }

        marketSellSwapQuote = getFullyFillableSwapQuoteWithNoFees(
            makerAssetData,
            wethAssetData,
            orders,
            MarketOperation.Sell,
            GAS_PRICE,
        );

        marketBuySwapQuote = getFullyFillableSwapQuoteWithNoFees(
            makerAssetData,
            wethAssetData,
            orders,
            MarketOperation.Buy,
            GAS_PRICE,
        );

        invalidMarketBuySwapQuote = getFullyFillableSwapQuoteWithNoFees(
            makerAssetData,
            takerAssetData,
            invalidOrders,
            MarketOperation.Buy,
            GAS_PRICE,
        );

        swapQuoteConsumer = new ForwarderSwapQuoteConsumer(provider, contractWrappers, {
            chainId,
        });
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('#executeSwapQuoteOrThrowAsync', () => {
        describe('validation', () => {
            it('should throw if swapQuote provided is not a valid forwarder SwapQuote (taker asset is wEth)', async () => {
                expect(
                    swapQuoteConsumer.executeSwapQuoteOrThrowAsync(invalidMarketBuySwapQuote, { takerAddress }),
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
            it('should perform a marketBuy execution when provided a MarketBuy type swapQuote', async () => {
                await expectMakerAndTakerBalancesAsync(
                    new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                    constants.ZERO_AMOUNT,
                );
                await swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketBuySwapQuote, {
                    takerAddress,
                    gasPrice: GAS_PRICE,
                    gasLimit: 4000000,
                });
                await expectMakerAndTakerBalancesAsync(
                    constants.ZERO_AMOUNT,
                    new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                );
            });

            it('should perform a marketSell execution when provided a MarketSell type swapQuote', async () => {
                await expectMakerAndTakerBalancesAsync(
                    new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                    constants.ZERO_AMOUNT,
                );
                await swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketSellSwapQuote, {
                    takerAddress,
                    gasLimit: 4000000,
                });
                await expectMakerAndTakerBalancesAsync(
                    constants.ZERO_AMOUNT,
                    new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                );
            });

            it('should perform a marketBuy execution with affiliate fees', async () => {
                await expectMakerAndTakerBalancesAsync(
                    new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                    constants.ZERO_AMOUNT,
                );
                const feeRecipientEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(feeRecipient);
                await swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketBuySwapQuote, {
                    takerAddress,
                    gasLimit: 4000000,
                    feePercentage: 0.05,
                    feeRecipient,
                });
                await expectMakerAndTakerBalancesAsync(
                    constants.ZERO_AMOUNT,
                    new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                );
                const feeRecipientEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(feeRecipient);
                expect(feeRecipientEthBalanceAfter.minus(feeRecipientEthBalanceBefore)).to.bignumber.equal(
                    new BigNumber(0.2).multipliedBy(ONE_ETH_IN_WEI),
                );
            });

            it('should perform a marketSell execution with affiliate fees', async () => {
                await expectMakerAndTakerBalancesAsync(
                    new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                    constants.ZERO_AMOUNT,
                );
                const feeRecipientEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(feeRecipient);
                await swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketSellSwapQuote, {
                    takerAddress,
                    feePercentage: 0.05,
                    feeRecipient,
                    gasLimit: 4000000,
                });
                await expectMakerAndTakerBalancesAsync(
                    constants.ZERO_AMOUNT,
                    new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                );
                const feeRecipientEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(feeRecipient);
                expect(feeRecipientEthBalanceAfter.minus(feeRecipientEthBalanceBefore)).to.bignumber.equal(
                    new BigNumber(0.2).multipliedBy(ONE_ETH_IN_WEI),
                );
            });
        });
    });

    describe('#getSmartContractParamsOrThrow', () => {
        describe('validation', () => {
            it('should throw if swap quote provided is not a valid forwarder SwapQuote (taker asset is WETH)', async () => {
                expect(
                    swapQuoteConsumer.getSmartContractParamsOrThrowAsync(invalidMarketBuySwapQuote, {}),
                ).to.be.rejectedWith(
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
            });
            it('provide correct and optimized smart contract params with default options for a marketBuy SwapQuote (no affiliate fees)', async () => {
                const { toAddress, params } = await swapQuoteConsumer.getSmartContractParamsOrThrowAsync(
                    marketBuySwapQuote,
                    {},
                );
                expect(toAddress).to.deep.equal(contractWrappers.forwarder.address);
                const {
                    makerAssetFillAmount,
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
            });
        });
    });

    describe('#getCalldataOrThrow', () => {
        describe('validation', () => {
            it('should throw if swap quote provided is not a valid forwarder SwapQuote (taker asset is WETH)', async () => {
                expect(swapQuoteConsumer.getCalldataOrThrowAsync(invalidMarketBuySwapQuote, {})).to.be.rejectedWith(
                    `Expected quote.orders[0] to have takerAssetData set as ${wethAssetData}, but is ${takerAssetData}`,
                );
            });
        });

        describe('valid swap quote', async () => {
            it('provide correct and optimized calldata options with default options for a marketSell SwapQuote (no affiliate fees)', async () => {
                await expectMakerAndTakerBalancesAsync(
                    new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                    constants.ZERO_AMOUNT,
                );
                const { calldataHexString, toAddress, ethAmount } = await swapQuoteConsumer.getCalldataOrThrowAsync(
                    marketSellSwapQuote,
                    {},
                );
                expect(toAddress).to.deep.equal(contractWrappers.forwarder.address);
                await web3Wrapper.sendTransactionAsync({
                    from: takerAddress,
                    to: toAddress,
                    data: calldataHexString,
                    value: ethAmount,
                    gas: 4000000,
                });
                await expectMakerAndTakerBalancesAsync(
                    constants.ZERO_AMOUNT,
                    new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                );
            });
            it('provide correct and optimized calldata options with default options for a marketBuy SwapQuote (no affiliate fees)', async () => {
                await expectMakerAndTakerBalancesAsync(
                    new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                    constants.ZERO_AMOUNT,
                );
                const { calldataHexString, toAddress, ethAmount } = await swapQuoteConsumer.getCalldataOrThrowAsync(
                    marketBuySwapQuote,
                    {},
                );
                expect(toAddress).to.deep.equal(contractAddresses.forwarder);
                await web3Wrapper.sendTransactionAsync({
                    from: takerAddress,
                    to: toAddress,
                    data: calldataHexString,
                    value: ethAmount,
                    gas: 4000000,
                });
                await expectMakerAndTakerBalancesAsync(
                    constants.ZERO_AMOUNT,
                    new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                );
            });
            it('provide correct and optimized calldata options with affiliate fees for a marketSell SwapQuote', async () => {
                await expectMakerAndTakerBalancesAsync(
                    new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                    constants.ZERO_AMOUNT,
                );
                const feeRecipientEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(feeRecipient);
                const { calldataHexString, toAddress, ethAmount } = await swapQuoteConsumer.getCalldataOrThrowAsync(
                    marketSellSwapQuote,
                    {
                        feePercentage: 0.05,
                        feeRecipient,
                    },
                );
                expect(toAddress).to.deep.equal(contractAddresses.forwarder);
                await web3Wrapper.sendTransactionAsync({
                    from: takerAddress,
                    to: toAddress,
                    data: calldataHexString,
                    value: ethAmount,
                    gas: 4000000,
                });
                await expectMakerAndTakerBalancesAsync(
                    constants.ZERO_AMOUNT,
                    new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                );
                const feeRecipientEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(feeRecipient);
                expect(feeRecipientEthBalanceAfter.minus(feeRecipientEthBalanceBefore)).to.bignumber.equal(
                    new BigNumber(0.2).multipliedBy(ONE_ETH_IN_WEI),
                );
            });
            it('provide correct and optimized calldata options with affiliate fees for a marketBuy SwapQuote', async () => {
                await expectMakerAndTakerBalancesAsync(
                    new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                    constants.ZERO_AMOUNT,
                );
                const feeRecipientEthBalanceBefore = await web3Wrapper.getBalanceInWeiAsync(feeRecipient);
                const { calldataHexString, toAddress, ethAmount } = await swapQuoteConsumer.getCalldataOrThrowAsync(
                    marketBuySwapQuote,
                    {
                        feePercentage: 0.05,
                        feeRecipient,
                    },
                );
                expect(toAddress).to.deep.equal(contractAddresses.forwarder);
                await web3Wrapper.sendTransactionAsync({
                    from: takerAddress,
                    to: toAddress,
                    data: calldataHexString,
                    value: ethAmount,
                    gas: 4000000,
                });
                await expectMakerAndTakerBalancesAsync(
                    constants.ZERO_AMOUNT,
                    new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                );
                const feeRecipientEthBalanceAfter = await web3Wrapper.getBalanceInWeiAsync(feeRecipient);
                expect(feeRecipientEthBalanceAfter.minus(feeRecipientEthBalanceBefore)).to.bignumber.equal(
                    new BigNumber(0.2).multipliedBy(ONE_ETH_IN_WEI),
                );
            });
        });
    });
    // tslint:disable-next-line: max-file-line-count
});
