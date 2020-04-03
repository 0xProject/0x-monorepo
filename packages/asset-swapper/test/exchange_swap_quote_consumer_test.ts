import { ContractAddresses } from '@0x/contract-addresses';
import { ERC20TokenContract, ExchangeContract } from '@0x/contract-wrappers';
import { constants as devConstants, OrderFactory } from '@0x/contracts-test-utils';
import { BlockchainLifecycle, tokenUtils } from '@0x/dev-utils';
import { migrateOnceAsync } from '@0x/migrations';
import { assetDataUtils } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { SwapQuote } from '../src';
import { constants } from '../src/constants';
import { ExchangeSwapQuoteConsumer } from '../src/quote_consumers/exchange_swap_quote_consumer';
import { MarketOperation, SignedOrderWithFillableAmounts } from '../src/types';

import { chaiSetup } from './utils/chai_setup';
import { getFullyFillableSwapQuoteWithNoFeesAsync } from './utils/swap_quote';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const GAS_PRICE = new BigNumber(devConstants.DEFAULT_GAS_PRICE);
const ONE_ETH_IN_WEI = new BigNumber(1000000000000000000);
const TESTRPC_CHAIN_ID = devConstants.TESTRPC_CHAIN_ID;
const UNLIMITED_ALLOWANCE = new BigNumber(2).pow(256).minus(1); // tslint:disable-line:custom-no-magic-numbers

const PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS: Array<Partial<SignedOrderWithFillableAmounts>> = [
    {
        takerAssetAmount: new BigNumber(5).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new BigNumber(5).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
    },
    {
        takerAssetAmount: new BigNumber(3).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new BigNumber(3).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new BigNumber(3).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new BigNumber(3).multipliedBy(ONE_ETH_IN_WEI),
    },
    {
        takerAssetAmount: new BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new BigNumber(5).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new BigNumber(5).multipliedBy(ONE_ETH_IN_WEI),
    },
];

const expectMakerAndTakerBalancesAsyncFactory = (
    erc20TokenContract: ERC20TokenContract,
    makerAddress: string,
    takerAddress: string,
) => async (expectedMakerBalance: BigNumber, expectedTakerBalance: BigNumber) => {
    const makerBalance = await erc20TokenContract.balanceOf(makerAddress).callAsync();
    const takerBalance = await erc20TokenContract.balanceOf(takerAddress).callAsync();
    expect(makerBalance).to.bignumber.equal(expectedMakerBalance);
    expect(takerBalance).to.bignumber.equal(expectedTakerBalance);
};

describe('ExchangeSwapQuoteConsumer', () => {
    let userAddresses: string[];
    let erc20MakerTokenContract: ERC20TokenContract;
    let erc20TakerTokenContract: ERC20TokenContract;
    let coinbaseAddress: string;
    let makerAddress: string;
    let takerAddress: string;
    let orderFactory: OrderFactory;
    let feeRecipient: string;
    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let makerAssetData: string;
    let takerAssetData: string;
    let wethAssetData: string;
    let contractAddresses: ContractAddresses;
    let exchangeContract: ExchangeContract;

    const chainId = TESTRPC_CHAIN_ID;

    let orders: SignedOrderWithFillableAmounts[];
    let marketSellSwapQuote: SwapQuote;
    let marketBuySwapQuote: SwapQuote;
    let swapQuoteConsumer: ExchangeSwapQuoteConsumer;
    let expectMakerAndTakerBalancesForMakerAssetAsync: (
        expectedMakerBalance: BigNumber,
        expectedTakerBalance: BigNumber,
    ) => Promise<void>;
    let expectMakerAndTakerBalancesForTakerAssetAsync: (
        expectedMakerBalance: BigNumber,
        expectedTakerBalance: BigNumber,
    ) => Promise<void>;

    before(async () => {
        contractAddresses = await migrateOnceAsync(provider);
        await blockchainLifecycle.startAsync();
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        [coinbaseAddress, takerAddress, makerAddress, feeRecipient] = userAddresses;
        [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        [makerAssetData, takerAssetData, wethAssetData] = [
            assetDataUtils.encodeERC20AssetData(makerTokenAddress),
            assetDataUtils.encodeERC20AssetData(takerTokenAddress),
            assetDataUtils.encodeERC20AssetData(contractAddresses.etherToken),
        ];
        erc20MakerTokenContract = new ERC20TokenContract(makerTokenAddress, provider);
        erc20TakerTokenContract = new ERC20TokenContract(takerTokenAddress, provider);
        exchangeContract = new ExchangeContract(contractAddresses.exchange, provider);
        // Configure order defaults
        const defaultOrderParams = {
            ...devConstants.STATIC_ORDER_PARAMS,
            makerAddress,
            takerAddress,
            makerAssetData,
            takerAssetData,
            makerFeeAssetData: constants.NULL_ERC20_ASSET_DATA,
            takerFeeAssetData: constants.NULL_ERC20_ASSET_DATA,
            makerFee: constants.ZERO_AMOUNT,
            takerFee: constants.ZERO_AMOUNT,
            feeRecipientAddress: feeRecipient,
            exchangeAddress: contractAddresses.exchange,
            chainId,
        };
        const privateKey = devConstants.TESTRPC_PRIVATE_KEYS[userAddresses.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
        expectMakerAndTakerBalancesForTakerAssetAsync = expectMakerAndTakerBalancesAsyncFactory(
            erc20TakerTokenContract,
            makerAddress,
            takerAddress,
        );
        expectMakerAndTakerBalancesForMakerAssetAsync = expectMakerAndTakerBalancesAsyncFactory(
            erc20MakerTokenContract,
            makerAddress,
            takerAddress,
        );
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
        orders = [];
        for (const partialOrder of PARTIAL_PRUNED_SIGNED_ORDERS_FEELESS) {
            const order = await orderFactory.newSignedOrderAsync(partialOrder);
            const prunedOrder = {
                ...order,
                ...partialOrder,
            };
            orders.push(prunedOrder as SignedOrderWithFillableAmounts);
        }

        marketSellSwapQuote = await getFullyFillableSwapQuoteWithNoFeesAsync(
            makerAssetData,
            takerAssetData,
            orders,
            MarketOperation.Sell,
            GAS_PRICE,
        );

        marketBuySwapQuote = await getFullyFillableSwapQuoteWithNoFeesAsync(
            makerAssetData,
            takerAssetData,
            orders,
            MarketOperation.Buy,
            GAS_PRICE,
        );

        swapQuoteConsumer = new ExchangeSwapQuoteConsumer(provider, contractAddresses, {
            chainId,
        });

        await erc20MakerTokenContract
            .transfer(makerAddress, marketBuySwapQuote.worstCaseQuoteInfo.makerAssetAmount)
            .sendTransactionAsync({
                from: coinbaseAddress,
            });
        await erc20TakerTokenContract
            .transfer(takerAddress, marketBuySwapQuote.worstCaseQuoteInfo.totalTakerAssetAmount)
            .sendTransactionAsync({
                from: coinbaseAddress,
            });
        await erc20MakerTokenContract
            .approve(contractAddresses.erc20Proxy, UNLIMITED_ALLOWANCE)
            .sendTransactionAsync({ from: makerAddress });
        await erc20TakerTokenContract
            .approve(contractAddresses.erc20Proxy, UNLIMITED_ALLOWANCE)
            .sendTransactionAsync({ from: takerAddress });
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('#executeSwapQuoteOrThrowAsync', () => {
        /*
         * Testing that SwapQuoteConsumer logic correctly performs a execution (doesn't throw or revert)
         * Does not test the validity of the state change performed by the forwarder smart contract
         */
        it('should perform a marketSell execution when provided a MarketSell type swapQuote', async () => {
            await expectMakerAndTakerBalancesForMakerAssetAsync(
                new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                constants.ZERO_AMOUNT,
            );
            await expectMakerAndTakerBalancesForTakerAssetAsync(
                constants.ZERO_AMOUNT,
                new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
            );
            await swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketSellSwapQuote, {
                takerAddress,
                gasLimit: 4000000,
            });
            await expectMakerAndTakerBalancesForMakerAssetAsync(
                constants.ZERO_AMOUNT,
                new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
            );
            await expectMakerAndTakerBalancesForTakerAssetAsync(
                new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                constants.ZERO_AMOUNT,
            );
        });
        it('should perform a marketBuy execution when provided a MarketBuy type swapQuote', async () => {
            await expectMakerAndTakerBalancesForMakerAssetAsync(
                new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                constants.ZERO_AMOUNT,
            );
            await expectMakerAndTakerBalancesForTakerAssetAsync(
                constants.ZERO_AMOUNT,
                new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
            );
            await swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketBuySwapQuote, {
                takerAddress,
                gasLimit: 4000000,
            });
            await expectMakerAndTakerBalancesForMakerAssetAsync(
                constants.ZERO_AMOUNT,
                new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
            );
            await expectMakerAndTakerBalancesForTakerAssetAsync(
                new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                constants.ZERO_AMOUNT,
            );
        });
    });

    describe('#getCalldataOrThrow', () => {
        describe('valid swap quote', async () => {
            it('provide correct and optimized calldata options with default options for a marketSell SwapQuote (no affiliate fees)', async () => {
                await expectMakerAndTakerBalancesForMakerAssetAsync(
                    new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                    constants.ZERO_AMOUNT,
                );
                const { calldataHexString, toAddress, ethAmount } = await swapQuoteConsumer.getCalldataOrThrowAsync(
                    marketSellSwapQuote,
                    {},
                );
                expect(toAddress).to.deep.equal(exchangeContract.address);
                await web3Wrapper.sendTransactionAsync({
                    from: takerAddress,
                    to: toAddress,
                    data: calldataHexString,
                    gas: 4000000,
                    gasPrice: GAS_PRICE,
                    value: ethAmount,
                });
                await expectMakerAndTakerBalancesForMakerAssetAsync(
                    constants.ZERO_AMOUNT,
                    new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                );
            });
            it('provide correct and optimized calldata options with default options for a marketBuy SwapQuote (no affiliate fees)', async () => {
                await expectMakerAndTakerBalancesForMakerAssetAsync(
                    new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                    constants.ZERO_AMOUNT,
                );
                const { calldataHexString, toAddress, ethAmount } = await swapQuoteConsumer.getCalldataOrThrowAsync(
                    marketBuySwapQuote,
                    {},
                );
                expect(toAddress).to.deep.equal(exchangeContract.address);
                await web3Wrapper.sendTransactionAsync({
                    from: takerAddress,
                    to: toAddress,
                    data: calldataHexString,
                    gas: 4000000,
                    gasPrice: GAS_PRICE,
                    value: ethAmount,
                });
                await expectMakerAndTakerBalancesForMakerAssetAsync(
                    constants.ZERO_AMOUNT,
                    new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI),
                );
            });
        });
    });
});
