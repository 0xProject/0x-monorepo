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
import { ForwarderSwapQuoteConsumer } from '../src/quote_consumers/forwarder_swap_quote_consumer';

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
const FILLABLE_AMOUNTS = [new BigNumber(2), new BigNumber(3), new BigNumber(5)].map(value => value.multipliedBy(ONE_ETH_IN_WEI));
const FILLABLE_FEE_AMOUNTS = [new BigNumber(1), new BigNumber(1), new BigNumber(1)].map(value => value.multipliedBy(ONE_ETH_IN_WEI));

describe('ForwarderSwapQuoteConsumer', () => {
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
                    const swapQuoteConsumer = new ForwarderSwapQuoteConsumer(provider, {
                        networkId,
                    });
                    expect(
                        swapQuoteConsumer.executeSwapQuoteOrThrowAsync(invalidSwapQuote, { takerAddress }),
                    ).to.be.rejectedWith(`Expected quote.orders[0] to have takerAssetData set as ${wethAssetData}, but is ${takerAssetData}`);
            });
        });

        describe('valid swap quote', () => {
            let orders: SignedOrder[];
            let marketSellSwapQuote: SwapQuote;
            let marketBuySwapQuote: SwapQuote;
            let swapQuoteConsumer: ForwarderSwapQuoteConsumer;
            let erc20ProxyAddress: string;
            beforeEach(async () => {

                const UNLIMITED_ALLOWANCE = contractWrappers.erc20Token.UNLIMITED_ALLOWANCE_IN_BASE_UNITS;
                erc20ProxyAddress = contractWrappers.erc20Proxy.address;

                const totalFillableAmount = FILLABLE_AMOUNTS.reduce((a: BigNumber, c: BigNumber) => a.plus(c), new BigNumber(0));

                await contractWrappers.erc20Token.transferAsync(makerTokenAddress, coinbaseAddress, makerAddress, totalFillableAmount);

                await contractWrappers.erc20Token.setAllowanceAsync(makerTokenAddress, makerAddress, erc20ProxyAddress, UNLIMITED_ALLOWANCE);
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
                    networkId,
                });
            });
            /*
             * Testing that SwapQuoteConsumer logic correctly performs a execution (doesn't throw or revert)
             * Does not test the validity of the state change performed by the forwarder smart contract
             */
            it('should perform a marketSell execution when provided a MarketSell type swapQuote', async () => {
                // const makerBalance = await contractWrappers.erc20Token.getBalanceAsync(makerTokenAddress, makerAddress);
                // const takerBalance = await contractWrappers.erc20Token.getBalanceAsync(makerTokenAddress, takerAddress);
                // console.log(makerBalance, takerBalance);
                // const preEthBalanceMaker = await web3Wrapper.getBalanceInWeiAsync(makerAddress);
                // const preEthBalanceTaker = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
                // console.log('maker eth balance', preEthBalanceMaker, 'taker eth balance', preEthBalanceTaker);
                // const txHash = await swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketSellSwapQuote, { takerAddress });
                // console.log(txHash);
                // // expect(
                // //     swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketSellSwapQuote, { takerAddress }),
                // // ).to.not.be.rejected();
                // const ethBalanceMaker = await web3Wrapper.getBalanceInWeiAsync(makerAddress);
                // const ethBalanceTaker = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
                // console.log('maker eth balance', ethBalanceMaker, 'taker eth balance', ethBalanceTaker);
                // const postMakerBalance = await contractWrappers.erc20Token.getBalanceAsync(makerTokenAddress, makerAddress);
                // const postTakerBalance = await contractWrappers.erc20Token.getBalanceAsync(makerTokenAddress, takerAddress);
                // console.log(postMakerBalance, postTakerBalance);
            });
            it('should perform a marketBuy execution when provided a MarketBuy type swapQuote', async () => {
                // const makerBalance = await contractWrappers.erc20Token.getBalanceAsync(makerTokenAddress, makerAddress);
                // const takerBalance = await contractWrappers.erc20Token.getBalanceAsync(makerTokenAddress, takerAddress);
                // console.log(makerBalance, takerBalance);
                // const preEthBalanceMaker = await web3Wrapper.getBalanceInWeiAsync(makerAddress);
                // const preEthBalanceTaker = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
                // console.log('maker eth balance', preEthBalanceMaker, 'taker eth balance', preEthBalanceTaker);
                // await swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketBuySwapQuote, { takerAddress });
                // // expect(
                // //     swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketBuySwapQuote, { takerAddress }),
                // // ).to.not.be.rejected();
                // const ethBalanceMaker = await web3Wrapper.getBalanceInWeiAsync(makerAddress);
                // const ethBalanceTaker = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
                // console.log('maker eth balance', ethBalanceMaker, 'taker eth balance', ethBalanceTaker);
                // const postMakerBalance = await contractWrappers.erc20Token.getBalanceAsync(makerTokenAddress, makerAddress);
                // const postTakerBalance = await contractWrappers.erc20Token.getBalanceAsync(makerTokenAddress, takerAddress);
                // console.log(postMakerBalance, postTakerBalance);
            });

            it('should perform a marketSell execution with affiliate fees', () => {});
            it('should perform a marketSell execution with provided ethAmount in options', () => {});
            it('should throw on a marketSell execution with provided ethAmount that is lower than bestCaseQuoteInfo.totalTakerAssetAmount in options', () => {});
            it('should perform a marketSell execution with provided takerAddress in options', () => {});
        });
    });

    describe('getSmartContractParamsOrThrow', () => {

        describe('validation', () => {
            it('should throw if swap quote provided is not a valid forwarder SwapQuote (taker asset is WETH)', async () => {
            });
        });

        describe('valid swap quote', async () => {
            it('provide correct and optimized smart contract params with default options for a marketSell SwapQuote (no affiliate fees)', async () => {
            });
            it('provide correct and optimized smart contract params with default options for a marketBuy SwapQuote (no affiliate fees)', async () => {
            });
            it('provide correct and optimized smart contract params with affiliate fees for a marketSell SwapQuote', async () => {
            });
            it('provide correct and optimized smart contract params with affiliate fees for a marketBuy SwapQuote', async () => {
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
