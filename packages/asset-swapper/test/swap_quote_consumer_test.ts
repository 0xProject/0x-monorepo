import { ContractAddresses, ContractWrappers, ERC20TokenContract } from '@0x/contract-wrappers';
import { BlockchainLifecycle, tokenUtils } from '@0x/dev-utils';
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
const TESTRPC_CHAIN_ID = 1337;
const FILLABLE_AMOUNTS = [new BigNumber(3), new BigNumber(2), new BigNumber(5)].map(value =>
    value.multipliedBy(ONE_ETH_IN_WEI),
);

const UNLIMITED_ALLOWANCE_IN_BASE_UNITS = new BigNumber(2).pow(256).minus(1); // tslint:disable-line:custom-no-magic-numbers

describe('SwapQuoteConsumer', () => {
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

    const chainId = TESTRPC_CHAIN_ID;

    let orders: SignedOrder[];
    let marketSellSwapQuote: SwapQuote;
    let swapQuoteConsumer: SwapQuoteConsumer;
    let erc20ProxyAddress: string;

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

        swapQuoteConsumer = new SwapQuoteConsumer(provider, {
            chainId,
        });
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    // TODO(david): write tests to ensure options work for executeSwapQuote
    // describe('executeSwapQuoteOrThrowAsync', () => {
    //     /*
    //      * Testing that SwapQuoteConsumer logic correctly performs a execution (doesn't throw or revert)
    //      * Does not test the validity of the state change performed by the forwarder smart contract
    //      */
    //     it('should perform an asset swap with Forwarder contract when provided corresponding useExtensionContract option', async () => {
    //         let makerBalance = await erc20TokenContract.balanceOf.callAsync(makerAddress);
    //         let takerBalance = await erc20TokenContract.balanceOf.callAsync(takerAddress);
    //         expect(makerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
    //         expect(takerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
    //         await swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketSellSwapQuote, { takerAddress, useExtensionContract: ConsumerType.Forwarder });
    //         makerBalance = await erc20TokenContract.balanceOf.callAsync(makerAddress);
    //         takerBalance = await erc20TokenContract.balanceOf.callAsync(takerAddress);
    //         expect(takerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
    //         expect(makerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
    //     });
    //     it('should perform an asset swap with Exchange contract when provided corresponding useExtensionContract option', async () => {
    //         let makerBalance = await erc20TokenContract.balanceOf.callAsync(makerAddress);
    //         let takerBalance = await erc20TokenContract.balanceOf.callAsync(takerAddress);
    //         expect(makerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
    //         expect(takerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
    //         await swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketBuySwapQuote, { takerAddress });
    //         makerBalance = await erc20TokenContract.balanceOf.callAsync(makerAddress);
    //         takerBalance = await erc20TokenContract.balanceOf.callAsync(takerAddress);
    //         expect(takerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
    //         expect(makerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
    //     });
    // });

    describe('getSmartContractParamsOrThrow', () => {
        describe('valid swap quote', async () => {
            // TODO(david) Check for valid MethodAbi
            it('should provide correct and optimized smart contract params for Forwarder contract when provided corresponding useExtensionContract option', async () => {
                const { toAddress } = await swapQuoteConsumer.getSmartContractParamsOrThrowAsync(marketSellSwapQuote, {
                    useExtensionContract: ExtensionContractType.Forwarder,
                });
                expect(toAddress).to.deep.equal(contractWrappers.forwarder.address);
            });
            it('should provide correct and optimized smart contract params for Exchange contract when provided corresponding useExtensionContract option', async () => {
                const { toAddress } = await swapQuoteConsumer.getSmartContractParamsOrThrowAsync(marketSellSwapQuote, {
                    useExtensionContract: ExtensionContractType.None,
                });
                expect(toAddress).to.deep.equal(contractWrappers.exchange.address);
            });
        });
    });

    describe('getCalldataOrThrow', () => {
        describe('valid swap quote', async () => {
            it('should provide correct and optimized calldata options for Forwarder contract when provided corresponding useExtensionContract option', async () => {
                const { toAddress } = await swapQuoteConsumer.getCalldataOrThrowAsync(marketSellSwapQuote, {
                    useExtensionContract: ExtensionContractType.Forwarder,
                });
                expect(toAddress).to.deep.equal(contractWrappers.forwarder.address);
            });
            it('should provide correct and optimized smart contract params for Exchange contract when provided corresponding useExtensionContract option', async () => {
                const { toAddress } = await swapQuoteConsumer.getCalldataOrThrowAsync(marketSellSwapQuote, {
                    useExtensionContract: ExtensionContractType.None,
                });
                expect(toAddress).to.deep.equal(contractWrappers.exchange.address);
            });
        });
    });
});
