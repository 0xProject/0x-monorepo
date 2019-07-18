import { tokenUtils } from '@0x/contract-wrappers/lib/test/utils/token_utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { FillScenarios } from '@0x/fill-scenarios';
import { assetDataUtils } from '@0x/order-utils';
import { MarketOperation } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { ForwarderSwapQuoteConsumer } from '../src/quote_consumers/forwarder_swap_quote_consumer';

import { chaiSetup } from './utils/chai_setup';
import { migrateOnceAsync } from './utils/migrate';
import { getFullyFillableSwapQuoteWithNoFees, getSignedOrdersWithNoFees } from './utils/swap_quote';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const FILLABLE_AMOUNTS = [new BigNumber(5), new BigNumber(10)];
const TESTRPC_NETWORK_ID = 50;
const MARKET_OPERATION = MarketOperation.Sell;

describe('ForwarderSwapQuoteConsumer', () => {
    let userAddresses: string[];
    let makerAddress: string;
    let takerAddress: string;
    let fillScenarios: FillScenarios;
    let feeRecipient: string;
    let makerAssetData: string;
    let takerAssetData: string;
    let wethAssetData: string;
    const networkId = TESTRPC_NETWORK_ID;
    before(async () => {
        const contractAddresses = await migrateOnceAsync();
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
        [makerAddress, takerAddress, feeRecipient] = userAddresses;
        const [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
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
                    const invalidSignedOrders = getSignedOrdersWithNoFees(
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
                        swapQuoteConsumer.executeSwapQuoteOrThrowAsync(invalidSwapQuote, {}),
                    ).to.be.rejectedWith(`Expected quote.orders[0] to have takerAssetData set as ${wethAssetData}, but is ${takerAssetData}`);
            });
        });

        it('should perform a marketSell execution when provided a MarketSell type swapQuote', () => {});
        it('should perform a marketBuy execution when provided a MarketBuy type swapQuote', () => {});

        it('should perform a marketSell execution with affiliate fees', () => {});
        it('should perform a marketSell execution with provided ethAmount in options', () => {});
        it('should perform a marketSell execution with provided takerAddress in options', () => {});
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
