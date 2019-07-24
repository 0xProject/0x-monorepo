import { ContractAddresses, ContractWrappers } from '@0x/contract-wrappers';
import { tokenUtils } from '@0x/contract-wrappers/lib/test/utils/token_utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { FillScenarios } from '@0x/fill-scenarios';
import { assetDataUtils } from '@0x/order-utils';
import { MarketOperation, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { SwapQuote } from '../src';
import { ExchangeSwapQuoteConsumer } from '../src/quote_consumers/exchange_swap_quote_consumer';
import { ForwarderSwapQuoteConsumer } from '../src/quote_consumers/forwarder_swap_quote_consumer';
import { constants } from '../src/constants';

import { chaiSetup } from './utils/chai_setup';
import { migrateOnceAsync } from './utils/migrate';
import { getFullyFillableSwapQuoteWithNoFees, getSignedOrdersWithNoFeesAsync } from './utils/swap_quote';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const ONE_ETH_IN_WEI = new BigNumber(1000000000000000000);
const TESTRPC_NETWORK_ID = 50;
const MARKET_OPERATION = MarketOperation.Sell;
const FILLABLE_AMOUNTS = [new BigNumber(3), new BigNumber(2), new BigNumber(5)].map(value => value.multipliedBy(ONE_ETH_IN_WEI));
const FILLABLE_FEE_AMOUNTS = [new BigNumber(1), new BigNumber(1), new BigNumber(1)].map(value => value.multipliedBy(ONE_ETH_IN_WEI));

describe('ExchangeSwapQuoteConsumer', () => {
    let contractWrappers: ContractWrappers;
    let userAddresses: string[];
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
    describe('executeSwapQuoteOrThrowAsync', () => {

        describe('valid swap quote', () => {
            const orders: SignedOrder[] = [];
            let marketSellSwapQuote: SwapQuote;
            let marketBuySwapQuote: SwapQuote;
            let swapQuoteConsumer: ExchangeSwapQuoteConsumer;
            beforeEach(async () => {

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

                swapQuoteConsumer = new ExchangeSwapQuoteConsumer(provider, {
                    networkId,
                });
            });
            /*
             * Testing that SwapQuoteConsumer logic correctly performs a execution (doesn't throw or revert)
             * Does not test the validity of the state change performed by the forwarder smart contract
             */
            it('should perform a marketSell execution when provided a MarketSell type swapQuote', async () => {
                let makerBalance = await contractWrappers.erc20Token.getBalanceAsync(makerTokenAddress, makerAddress);
                let takerBalance = await contractWrappers.erc20Token.getBalanceAsync(makerTokenAddress, takerAddress);
                expect(makerBalance).to.bignumber.equal((new BigNumber(10)).multipliedBy(ONE_ETH_IN_WEI));
                expect(takerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
                await swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketSellSwapQuote, { takerAddress });
                makerBalance = await contractWrappers.erc20Token.getBalanceAsync(makerTokenAddress, makerAddress);
                takerBalance = await contractWrappers.erc20Token.getBalanceAsync(makerTokenAddress, takerAddress);
                expect(takerBalance).to.bignumber.equal((new BigNumber(10)).multipliedBy(ONE_ETH_IN_WEI));
                expect(makerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('should perform a marketBuy execution when provided a MarketBuy type swapQuote', async () => {
                let makerBalance = await contractWrappers.erc20Token.getBalanceAsync(makerTokenAddress, makerAddress);
                let takerBalance = await contractWrappers.erc20Token.getBalanceAsync(makerTokenAddress, takerAddress);
                expect(makerBalance).to.bignumber.equal((new BigNumber(10)).multipliedBy(ONE_ETH_IN_WEI));
                expect(takerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
                await swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketBuySwapQuote, { takerAddress });
                makerBalance = await contractWrappers.erc20Token.getBalanceAsync(makerTokenAddress, makerAddress);
                takerBalance = await contractWrappers.erc20Token.getBalanceAsync(makerTokenAddress, takerAddress);
                expect(takerBalance).to.bignumber.equal((new BigNumber(10)).multipliedBy(ONE_ETH_IN_WEI));
                expect(makerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
            });
        });
    });

    describe('getSmartContractParamsOrThrow', () => {

        describe('valid swap quote', async () => {
            it('provide correct and optimized smart contract params with default options for a marketSell SwapQuote', async () => {
            });
            it('provide correct and optimized smart contract params with default options for a marketBuy SwapQuote', async () => {
            });
        });
    });

    describe('getCalldataOrThrow', () => {
        describe('validation', () => {
            it('should throw if swap quote provided is not a valid forwarder SwapQuote (taker asset is WETH)', async () => {
            });
        });

        describe('valid swap quote', async () => {
            it('provide correct and optimized calldata options with default options for a marketSell SwapQuote (no affiliate fees)', async () => {
            });
            it('provide correct and optimized calldata options with default options for a marketBuy SwapQuote (no affiliate fees)', async () => {
            });
            it('provide correct and optimized calldata options with affiliate fees for a marketSell SwapQuote', async () => {
            });
            it('provide correct and optimized calldata options with affiliate fees for a marketBuy SwapQuote', async () => {
            });
        });
    });
});
