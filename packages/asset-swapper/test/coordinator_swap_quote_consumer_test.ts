import { ContractAddresses, ContractWrappers, CoordinatorWrapper, ERC20TokenContract } from '@0x/contract-wrappers';
import { BlockchainLifecycle, tokenUtils } from '@0x/dev-utils';
import { FillScenarios } from '@0x/fill-scenarios';
import { assetDataUtils, eip712Utils, signatureUtils } from '@0x/order-utils';
import { MarketOperation, SignedOrder, SignedZeroExTransaction } from '@0x/types';
import { BigNumber, signTypedDataUtils } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';
import * as Sinon from 'sinon';

import { SwapQuote } from '../src';
import { constants } from '../src/constants';
import { CoordinatorSwapQuoteConsumer } from '../src/quote_consumers/coordinator_swap_quote_consumer';

import { chaiSetup } from './utils/chai_setup';
import { migrateOnceAsync } from './utils/migrate';
import { getFullyFillableSwapQuoteWithNoFees } from './utils/swap_quote';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const ONE_ETH_IN_WEI = new BigNumber(1000000000000000000);
const ZERO = new BigNumber(0);
const TESTRPC_NETWORK_ID = 50;
const FILLABLE_AMOUNTS = [new BigNumber(3), new BigNumber(2), new BigNumber(5)].map(value =>
    value.multipliedBy(ONE_ETH_IN_WEI),
);

describe('CoordinatorSwapQuoteConsumer', () => {
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
    let makerToken: ERC20TokenContract;
    const stubs: Sinon.SinonStub[] = [];

    const networkId = TESTRPC_NETWORK_ID;

    let orders: SignedOrder[];
    let marketSellSwapQuote: SwapQuote;
    let marketBuySwapQuote: SwapQuote;
    let swapQuoteConsumer: CoordinatorSwapQuoteConsumer;

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
        makerToken = new ERC20TokenContract(makerTokenAddress, contractWrappers.getProvider());
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
        orders = [];
        for (const fillableAmmount of FILLABLE_AMOUNTS) {
            const coordinatorOrders = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                makerAssetData,
                takerAssetData,
                ZERO,
                ZERO,
                makerAddress,
                takerAddress,
                fillableAmmount,
                feeRecipient,
                undefined, // expiration time
                contractAddresses.coordinator,
            );
            orders.push(coordinatorOrders);
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

        const stub = Sinon.stub(CoordinatorWrapper.prototype, 'getCoordinatorApprovalsAsync').callsFake(
            async (
                _signedOrders: SignedOrder[],
                signedZeroExTransaction: SignedZeroExTransaction,
                txOrigin?: string,
            ) => {
                // tslint:disable-next-line:custom-no-magic-numbers
                const expirationTime = new BigNumber(Math.round(Date.now() / 1000) + 50_000);
                const coordinatorExpirationTimes = [expirationTime];
                const typedData = eip712Utils.createCoordinatorApprovalTypedData(
                    signedZeroExTransaction,
                    contractWrappers.coordinator.address,
                    txOrigin || signedZeroExTransaction.signerAddress,
                    coordinatorExpirationTimes[0],
                );
                const approvalHashBuff = signTypedDataUtils.generateTypedDataHash(typedData);
                const signature = await signatureUtils.ecSignHashAsync(
                    provider,
                    `0x${approvalHashBuff.toString('hex')}`,
                    feeRecipient,
                );
                return { coordinatorSignatures: [signature], coordinatorExpirationTimes };
            },
        );
        swapQuoteConsumer = new CoordinatorSwapQuoteConsumer(provider, {
            networkId,
        });
        stubs.push(stub);
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
        stubs.forEach(s => s.restore());
    });
    describe('executeSwapQuoteOrThrowAsync', () => {
        it('should perform a marketSell execution when provided a MarketSell type swapQuote', async () => {
            let makerBalance = await makerToken.balanceOf.callAsync(makerAddress);
            let takerBalance = await makerToken.balanceOf.callAsync(takerAddress);
            expect(makerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
            expect(takerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
            await swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketSellSwapQuote, { takerAddress });
            makerBalance = await makerToken.balanceOf.callAsync(makerAddress);
            takerBalance = await makerToken.balanceOf.callAsync(takerAddress);
            expect(takerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
            expect(makerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should perform a marketBuy execution when provided a MarketBuy type swapQuote', async () => {
            let makerBalance = await makerToken.balanceOf.callAsync(makerAddress);
            let takerBalance = await makerToken.balanceOf.callAsync(takerAddress);
            expect(makerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
            expect(takerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
            await swapQuoteConsumer.executeSwapQuoteOrThrowAsync(marketBuySwapQuote, { takerAddress });
            makerBalance = await makerToken.balanceOf.callAsync(makerAddress);
            takerBalance = await makerToken.balanceOf.callAsync(takerAddress);
            expect(takerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
            expect(makerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
        });
    });

    describe('getSmartContractParamsOrThrow', () => {
        describe('valid swap quote', async () => {
            it('provide correct smart contract params for a marketSell SwapQuote', async () => {
                const { toAddress } = await swapQuoteConsumer.getSmartContractParamsOrThrowAsync(marketSellSwapQuote, {
                    takerAddress,
                });
                expect(toAddress).to.deep.equal(contractWrappers.coordinator.address);
            });
            it('provide correct smart contract params for a marketBuy SwapQuote', async () => {
                const { toAddress } = await swapQuoteConsumer.getSmartContractParamsOrThrowAsync(marketBuySwapQuote, {
                    takerAddress,
                });
                expect(toAddress).to.deep.equal(contractWrappers.coordinator.address);
            });
        });
    });

    describe('getCalldataOrThrow', () => {
        describe('valid swap quote', async () => {
            it('provide correct calldata options with default options for a marketSell SwapQuote', async () => {
                let makerBalance = await makerToken.balanceOf.callAsync(makerAddress);
                let takerBalance = await makerToken.balanceOf.callAsync(takerAddress);
                expect(makerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
                expect(takerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
                const { calldataHexString, toAddress } = await swapQuoteConsumer.getCalldataOrThrowAsync(
                    marketSellSwapQuote,
                    { takerAddress },
                );
                expect(toAddress).to.deep.equal(contractWrappers.coordinator.address);
                await web3Wrapper.sendTransactionAsync({
                    from: takerAddress,
                    to: toAddress,
                    data: calldataHexString,
                    gas: 4000000,
                });
                makerBalance = await makerToken.balanceOf.callAsync(makerAddress);
                takerBalance = await makerToken.balanceOf.callAsync(takerAddress);
                expect(takerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
                expect(makerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('provide correct calldata options with default options for a marketBuy SwapQuote', async () => {
                let makerBalance = await makerToken.balanceOf.callAsync(makerAddress);
                let takerBalance = await makerToken.balanceOf.callAsync(takerAddress);
                expect(makerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
                expect(takerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
                const { calldataHexString, toAddress } = await swapQuoteConsumer.getCalldataOrThrowAsync(
                    marketBuySwapQuote,
                    { takerAddress },
                );
                expect(toAddress).to.deep.equal(contractWrappers.coordinator.address);
                await web3Wrapper.sendTransactionAsync({
                    from: takerAddress,
                    to: toAddress,
                    data: calldataHexString,
                    gas: 4000000,
                });
                makerBalance = await makerToken.balanceOf.callAsync(makerAddress);
                takerBalance = await makerToken.balanceOf.callAsync(takerAddress);
                expect(takerBalance).to.bignumber.equal(new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI));
                expect(makerBalance).to.bignumber.equal(constants.ZERO_AMOUNT);
            });
            it('provide correct calldata options with contract SwapQuote', async () => {
                const { toAddress, methodAbi } = await swapQuoteConsumer.getCalldataOrThrowAsync(marketBuySwapQuote, {
                    takerAddress: contractAddresses.assetProxyOwner,
                    txOrigin: takerAddress,
                });
                expect(toAddress).to.deep.equal(contractWrappers.coordinator.address);
                expect(methodAbi.name).to.eq('executeTransaction');
            });
        });
    });
});
