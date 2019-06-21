import { tokenUtils } from '@0x/contract-wrappers/lib/test/utils/token_utils';
import { BlockchainLifecycle, callbackErrorReporter } from '@0x/dev-utils';
import { FillScenarios } from '@0x/fill-scenarios';
import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
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
import { getFullyFillableSwapQuoteWithNoFees, getSignedOrdersWithNoFees } from './utils/swap_quote';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const FILLABLE_AMOUNTS = [new BigNumber(5), new BigNumber(10)];
const TESTRPC_NETWORK_ID = 50;

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
        // This constructor has incorrect types
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('getSmartContractParamsOrThrow', () => {

        describe('validation', () => {
            it('should throw if swap quote provided is not a valid forwarder SwapQuote (taker asset is WETH)', async () => {
                const invalidSignedOrders = getSignedOrdersWithNoFees(
                    makerAssetData,
                    takerAssetData,
                    makerAddress,
                    takerAddress,
                    FILLABLE_AMOUNTS,
                );
                const invalidSwapQuote = getFullyFillableSwapQuoteWithNoFees(makerAssetData, takerAssetData, invalidSignedOrders);
                const swapQuoteConsumer = new ForwarderSwapQuoteConsumer(provider, { networkId });

                expect(
                    () => swapQuoteConsumer.getSmartContractParamsOrThrow(invalidSwapQuote, {}),
                ).to.throw(`Expected quote.orders[0] to have takerAssetData set as ${wethAssetData}, but is ${takerAssetData}`);
            });
        });

        describe('valid swap quote', async () => {
            it('provide correct smart contract params with default options (no affiliate fee)', async () => {
                const signedOrders = getSignedOrdersWithNoFees(
                    makerAssetData,
                    wethAssetData,
                    makerAddress,
                    takerAddress,
                    FILLABLE_AMOUNTS,
                );
                const swapQuote = getFullyFillableSwapQuoteWithNoFees(makerAssetData, takerAssetData, signedOrders);
                const swapQuoteConsumer = new ForwarderSwapQuoteConsumer(provider, { networkId });
                const smartContractParamsInfo = swapQuoteConsumer.getSmartContractParamsOrThrow(swapQuote, {});
                // console.log(smartContractParamsInfo);
                // TODO(dave4506): Add elaborate testing
            });
        });
    });

    describe('getCalldataOrThrow', () => {

        describe('validation', () => {
            it('should throw if swap quote provided is not a valid forwarder SwapQuote (taker asset is WETH)', async () => {
                const invalidSignedOrders = getSignedOrdersWithNoFees(
                    makerAssetData,
                    takerAssetData,
                    makerAddress,
                    takerAddress,
                    FILLABLE_AMOUNTS,
                );
                const invalidSwapQuote = getFullyFillableSwapQuoteWithNoFees(makerAssetData, takerAssetData, invalidSignedOrders);
                const swapQuoteConsumer = new ForwarderSwapQuoteConsumer(provider, {});
                // TODO(dave4506) finish up testing/coverage
                // expect(
                //     swapQuoteConsumer.getSmartContractParamsOrThrow(invalidSwapQuote, {}),
                // ).to.throws();
            });
        });

        describe('valid swap quote', async () => {
            it('provide correct calldata hex with default options', async () => {
                const signedOrders = getSignedOrdersWithNoFees(
                    makerAssetData,
                    wethAssetData,
                    makerAddress,
                    takerAddress,
                    FILLABLE_AMOUNTS,
                );
                const swapQuote = getFullyFillableSwapQuoteWithNoFees(makerAssetData, takerAssetData, signedOrders);
                const swapQuoteConsumer = new ForwarderSwapQuoteConsumer(provider, { networkId });
                const callDataInfo = swapQuoteConsumer.getCalldataOrThrow(swapQuote, {});
                // console.log(callDataInfo);
                // TODO(dave4506): Add elaborate testing
            });
        });
    });
});
