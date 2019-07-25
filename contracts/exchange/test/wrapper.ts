import { ERC20ProxyContract, ERC20Wrapper, ERC721ProxyContract, ERC721Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { DummyERC721TokenContract } from '@0x/contracts-erc721';
import {
    chaiSetup,
    constants,
    ERC20BalancesByOwner,
    expectTransactionFailedAsync,
    getLatestBlockTimestampAsync,
    increaseTimeAndMineBlockAsync,
    OrderFactory,
    OrderStatus,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
import { RevertReason, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import * as _ from 'lodash';

import { artifacts, ExchangeContract, ExchangeWrapper, ReentrantERC20TokenContract } from '../src';

import { dependencyArtifacts } from './utils/dependency_artifacts';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Exchange wrappers', () => {
    let makerAddress: string;
    let owner: string;
    let takerAddress: string;
    let feeRecipientAddress: string;

    let erc20TokenA: DummyERC20TokenContract;
    let erc20TokenB: DummyERC20TokenContract;
    let zrxToken: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let exchange: ExchangeContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;
    let reentrantErc20Token: ReentrantERC20TokenContract;

    let exchangeWrapper: ExchangeWrapper;
    let erc20Wrapper: ERC20Wrapper;
    let erc721Wrapper: ERC721Wrapper;
    let erc20Balances: ERC20BalancesByOwner;
    let orderFactory: OrderFactory;

    let erc721MakerAssetId: BigNumber;
    let erc721TakerAssetId: BigNumber;

    let defaultMakerAssetAddress: string;
    let defaultTakerAssetAddress: string;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, makerAddress, takerAddress, feeRecipientAddress] = _.slice(accounts, 0, 4));

        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);
        erc721Wrapper = new ERC721Wrapper(provider, usedAddresses, owner);

        const numDummyErc20ToDeploy = 3;
        [erc20TokenA, erc20TokenB, zrxToken] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        [erc721Token] = await erc721Wrapper.deployDummyTokensAsync();
        erc721Proxy = await erc721Wrapper.deployProxyAsync();
        await erc721Wrapper.setBalancesAndAllowancesAsync();
        const erc721Balances = await erc721Wrapper.getBalancesAsync();
        erc721MakerAssetId = erc721Balances[makerAddress][erc721Token.address][0];
        erc721TakerAssetId = erc721Balances[takerAddress][erc721Token.address][0];

        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            dependencyArtifacts,
            assetDataUtils.encodeERC20AssetData(zrxToken.address),
        );
        exchangeWrapper = new ExchangeWrapper(exchange, provider);
        await exchangeWrapper.registerAssetProxyAsync(erc20Proxy.address, owner);
        await exchangeWrapper.registerAssetProxyAsync(erc721Proxy.address, owner);

        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        reentrantErc20Token = await ReentrantERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.ReentrantERC20Token,
            provider,
            txDefaults,
            dependencyArtifacts,
            exchange.address,
        );

        defaultMakerAssetAddress = erc20TokenA.address;
        defaultTakerAssetAddress = erc20TokenB.address;

        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            exchangeAddress: exchange.address,
            makerAddress,
            feeRecipientAddress,
            makerAssetData: assetDataUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            takerAssetData: assetDataUtils.encodeERC20AssetData(defaultTakerAssetAddress),
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
        erc20Balances = await erc20Wrapper.getBalancesAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('fillOrKillOrder', () => {
        const reentrancyTest = (functionNames: string[]) => {
            _.forEach(functionNames, async (functionName: string, functionId: number) => {
                const description = `should not allow fillOrKillOrder to reenter the Exchange contract via ${functionName}`;
                it(description, async () => {
                    const signedOrder = await orderFactory.newSignedOrderAsync({
                        makerAssetData: assetDataUtils.encodeERC20AssetData(reentrantErc20Token.address),
                    });
                    await web3Wrapper.awaitTransactionSuccessAsync(
                        await reentrantErc20Token.setCurrentFunction.sendTransactionAsync(functionId),
                        constants.AWAIT_TRANSACTION_MINED_MS,
                    );
                    await expectTransactionFailedAsync(
                        exchangeWrapper.fillOrKillOrderAsync(signedOrder, takerAddress),
                        RevertReason.TransferFailed,
                    );
                });
            });
        };
        describe('fillOrKillOrder reentrancy tests', () => reentrancyTest(constants.FUNCTIONS_WITH_MUTEX));

        it('should transfer the correct amounts', async () => {
            const signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), 18),
            });
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exchangeWrapper.fillOrKillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount,
            });

            const newBalances = await erc20Wrapper.getBalancesAsync();

            const makerAssetFilledAmount = takerAssetFillAmount
                .times(signedOrder.makerAssetAmount)
                .dividedToIntegerBy(signedOrder.takerAssetAmount);
            const makerFee = signedOrder.makerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            const takerFee = signedOrder.takerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFilledAmount),
            );
            expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultTakerAssetAddress].plus(takerAssetFillAmount),
            );
            expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][zrxToken.address].minus(makerFee),
            );
            expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFilledAmount),
            );
            expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][zrxToken.address].minus(takerFee),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].plus(makerFee.plus(takerFee)),
            );
        });

        it('should throw if a signedOrder is expired', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const signedOrder = await orderFactory.newSignedOrderAsync({
                expirationTimeSeconds: new BigNumber(currentTimestamp).minus(10),
            });

            return expectTransactionFailedAsync(
                exchangeWrapper.fillOrKillOrderAsync(signedOrder, takerAddress),
                RevertReason.OrderUnfillable,
            );
        });

        it('should throw if entire takerAssetFillAmount not filled', async () => {
            const signedOrder = await orderFactory.newSignedOrderAsync();

            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount: signedOrder.takerAssetAmount.div(2),
            });

            return expectTransactionFailedAsync(
                exchangeWrapper.fillOrKillOrderAsync(signedOrder, takerAddress),
                RevertReason.CompleteFillFailed,
            );
        });
    });

    describe('fillOrderNoThrow', () => {
        const reentrancyTest = (functionNames: string[]) => {
            _.forEach(functionNames, async (functionName: string, functionId: number) => {
                const description = `should not allow fillOrderNoThrow to reenter the Exchange contract via ${functionName}`;
                it(description, async () => {
                    const signedOrder = await orderFactory.newSignedOrderAsync({
                        makerAssetData: assetDataUtils.encodeERC20AssetData(reentrantErc20Token.address),
                    });
                    await web3Wrapper.awaitTransactionSuccessAsync(
                        await reentrantErc20Token.setCurrentFunction.sendTransactionAsync(functionId),
                        constants.AWAIT_TRANSACTION_MINED_MS,
                    );
                    await exchangeWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
                    const newBalances = await erc20Wrapper.getBalancesAsync();
                    expect(erc20Balances).to.deep.equal(newBalances);
                });
            });
        };
        describe('fillOrderNoThrow reentrancy tests', () => reentrancyTest(constants.FUNCTIONS_WITH_MUTEX));

        it('should transfer the correct amounts', async () => {
            const signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), 18),
            });
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);

            await exchangeWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress, {
                takerAssetFillAmount,
                // HACK(albrow): We need to hardcode the gas estimate here because
                // the Geth gas estimator doesn't work with the way we use
                // delegatecall and swallow errors.
                gas: 250000,
            });

            const newBalances = await erc20Wrapper.getBalancesAsync();
            const makerAssetFilledAmount = takerAssetFillAmount
                .times(signedOrder.makerAssetAmount)
                .dividedToIntegerBy(signedOrder.takerAssetAmount);
            const makerFee = signedOrder.makerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            const takerFee = signedOrder.takerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);

            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFilledAmount),
            );
            expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultTakerAssetAddress].plus(takerAssetFillAmount),
            );
            expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][zrxToken.address].minus(makerFee),
            );
            expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFilledAmount),
            );
            expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][zrxToken.address].minus(takerFee),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].plus(makerFee.plus(takerFee)),
            );
        });

        it('should not change erc20Balances if maker erc20Balances are too low to fill order', async () => {
            const signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18),
            });

            await exchangeWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(newBalances).to.be.deep.equal(erc20Balances);
        });

        it('should not change erc20Balances if taker erc20Balances are too low to fill order', async () => {
            const signedOrder = await orderFactory.newSignedOrderAsync({
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18),
            });

            await exchangeWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(newBalances).to.be.deep.equal(erc20Balances);
        });

        it('should not change erc20Balances if maker allowances are too low to fill order', async () => {
            const signedOrder = await orderFactory.newSignedOrderAsync();
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc20TokenA.approve.sendTransactionAsync(erc20Proxy.address, new BigNumber(0), {
                    from: makerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await exchangeWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc20TokenA.approve.sendTransactionAsync(erc20Proxy.address, constants.INITIAL_ERC20_ALLOWANCE, {
                    from: makerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(newBalances).to.be.deep.equal(erc20Balances);
        });

        it('should not change erc20Balances if taker allowances are too low to fill order', async () => {
            const signedOrder = await orderFactory.newSignedOrderAsync();
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc20TokenB.approve.sendTransactionAsync(erc20Proxy.address, new BigNumber(0), {
                    from: takerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await exchangeWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc20TokenB.approve.sendTransactionAsync(erc20Proxy.address, constants.INITIAL_ERC20_ALLOWANCE, {
                    from: takerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(newBalances).to.be.deep.equal(erc20Balances);
        });

        it('should not change erc20Balances if makerAssetAddress is ZRX, makerAssetAmount + makerFee > maker balance', async () => {
            const makerZRXBalance = new BigNumber(erc20Balances[makerAddress][zrxToken.address]);
            const signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: makerZRXBalance,
                makerFee: new BigNumber(1),
                makerAssetData: assetDataUtils.encodeERC20AssetData(zrxToken.address),
            });
            await exchangeWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(newBalances).to.be.deep.equal(erc20Balances);
        });

        it('should not change erc20Balances if makerAssetAddress is ZRX, makerAssetAmount + makerFee > maker allowance', async () => {
            const makerZRXAllowance = await zrxToken.allowance.callAsync(makerAddress, erc20Proxy.address);
            const signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(makerZRXAllowance),
                makerFee: new BigNumber(1),
                makerAssetData: assetDataUtils.encodeERC20AssetData(zrxToken.address),
            });
            await exchangeWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(newBalances).to.be.deep.equal(erc20Balances);
        });

        it('should not change erc20Balances if takerAssetAddress is ZRX, takerAssetAmount + takerFee > taker balance', async () => {
            const takerZRXBalance = new BigNumber(erc20Balances[takerAddress][zrxToken.address]);
            const signedOrder = await orderFactory.newSignedOrderAsync({
                takerAssetAmount: takerZRXBalance,
                takerFee: new BigNumber(1),
                takerAssetData: assetDataUtils.encodeERC20AssetData(zrxToken.address),
            });
            await exchangeWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(newBalances).to.be.deep.equal(erc20Balances);
        });

        it('should not change erc20Balances if takerAssetAddress is ZRX, takerAssetAmount + takerFee > taker allowance', async () => {
            const takerZRXAllowance = await zrxToken.allowance.callAsync(takerAddress, erc20Proxy.address);
            const signedOrder = await orderFactory.newSignedOrderAsync({
                takerAssetAmount: new BigNumber(takerZRXAllowance),
                takerFee: new BigNumber(1),
                takerAssetData: assetDataUtils.encodeERC20AssetData(zrxToken.address),
            });
            await exchangeWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress);
            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(newBalances).to.be.deep.equal(erc20Balances);
        });

        it('should successfully exchange ERC721 tokens', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetId;
            const takerAssetId = erc721TakerAssetId;
            const signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(1),
                makerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: assetDataUtils.encodeERC721AssetData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            await exchangeWrapper.fillOrderNoThrowAsync(signedOrder, takerAddress, {
                takerAssetFillAmount,
                // HACK(albrow): We need to hardcode the gas estimate here because
                // the Geth gas estimator doesn't work with the way we use
                // delegatecall and swallow errors.
                gas: 280000,
            });
            // Verify post-conditions
            const newOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(newOwnerMakerAsset).to.be.bignumber.equal(takerAddress);
            const newOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(newOwnerTakerAsset).to.be.bignumber.equal(makerAddress);
        });
    });

    describe('batch functions', () => {
        let signedOrders: SignedOrder[];
        beforeEach(async () => {
            signedOrders = [
                await orderFactory.newSignedOrderAsync(),
                await orderFactory.newSignedOrderAsync(),
                await orderFactory.newSignedOrderAsync(),
            ];
        });

        describe('batchFillOrders', () => {
            const reentrancyTest = (functionNames: string[]) => {
                _.forEach(functionNames, async (functionName: string, functionId: number) => {
                    const description = `should not allow batchFillOrders to reenter the Exchange contract via ${functionName}`;
                    it(description, async () => {
                        const signedOrder = await orderFactory.newSignedOrderAsync({
                            makerAssetData: assetDataUtils.encodeERC20AssetData(reentrantErc20Token.address),
                        });
                        await web3Wrapper.awaitTransactionSuccessAsync(
                            await reentrantErc20Token.setCurrentFunction.sendTransactionAsync(functionId),
                            constants.AWAIT_TRANSACTION_MINED_MS,
                        );
                        await expectTransactionFailedAsync(
                            exchangeWrapper.batchFillOrdersAsync([signedOrder], takerAddress),
                            RevertReason.TransferFailed,
                        );
                    });
                });
            };
            describe('batchFillOrders reentrancy tests', () => reentrancyTest(constants.FUNCTIONS_WITH_MUTEX));

            it('should transfer the correct amounts', async () => {
                const takerAssetFillAmounts: BigNumber[] = [];
                const makerAssetAddress = erc20TokenA.address;
                const takerAssetAddress = erc20TokenB.address;
                _.forEach(signedOrders, signedOrder => {
                    const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
                    const makerAssetFilledAmount = takerAssetFillAmount
                        .times(signedOrder.makerAssetAmount)
                        .dividedToIntegerBy(signedOrder.takerAssetAmount);
                    const makerFee = signedOrder.makerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    const takerFee = signedOrder.takerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    takerAssetFillAmounts.push(takerAssetFillAmount);
                    erc20Balances[makerAddress][makerAssetAddress] = erc20Balances[makerAddress][
                        makerAssetAddress
                    ].minus(makerAssetFilledAmount);
                    erc20Balances[makerAddress][takerAssetAddress] = erc20Balances[makerAddress][
                        takerAssetAddress
                    ].plus(takerAssetFillAmount);
                    erc20Balances[makerAddress][zrxToken.address] = erc20Balances[makerAddress][zrxToken.address].minus(
                        makerFee,
                    );
                    erc20Balances[takerAddress][makerAssetAddress] = erc20Balances[takerAddress][
                        makerAssetAddress
                    ].plus(makerAssetFilledAmount);
                    erc20Balances[takerAddress][takerAssetAddress] = erc20Balances[takerAddress][
                        takerAssetAddress
                    ].minus(takerAssetFillAmount);
                    erc20Balances[takerAddress][zrxToken.address] = erc20Balances[takerAddress][zrxToken.address].minus(
                        takerFee,
                    );
                    erc20Balances[feeRecipientAddress][zrxToken.address] = erc20Balances[feeRecipientAddress][
                        zrxToken.address
                    ].plus(makerFee.plus(takerFee));
                });

                await exchangeWrapper.batchFillOrdersAsync(signedOrders, takerAddress, {
                    takerAssetFillAmounts,
                });

                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances).to.be.deep.equal(erc20Balances);
            });
        });

        describe('batchFillOrKillOrders', () => {
            const reentrancyTest = (functionNames: string[]) => {
                _.forEach(functionNames, async (functionName: string, functionId: number) => {
                    const description = `should not allow batchFillOrKillOrders to reenter the Exchange contract via ${functionName}`;
                    it(description, async () => {
                        const signedOrder = await orderFactory.newSignedOrderAsync({
                            makerAssetData: assetDataUtils.encodeERC20AssetData(reentrantErc20Token.address),
                        });
                        await web3Wrapper.awaitTransactionSuccessAsync(
                            await reentrantErc20Token.setCurrentFunction.sendTransactionAsync(functionId),
                            constants.AWAIT_TRANSACTION_MINED_MS,
                        );
                        await expectTransactionFailedAsync(
                            exchangeWrapper.batchFillOrKillOrdersAsync([signedOrder], takerAddress),
                            RevertReason.TransferFailed,
                        );
                    });
                });
            };
            describe('batchFillOrKillOrders reentrancy tests', () => reentrancyTest(constants.FUNCTIONS_WITH_MUTEX));

            it('should transfer the correct amounts', async () => {
                const takerAssetFillAmounts: BigNumber[] = [];
                const makerAssetAddress = erc20TokenA.address;
                const takerAssetAddress = erc20TokenB.address;
                _.forEach(signedOrders, signedOrder => {
                    const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
                    const makerAssetFilledAmount = takerAssetFillAmount
                        .times(signedOrder.makerAssetAmount)
                        .dividedToIntegerBy(signedOrder.takerAssetAmount);
                    const makerFee = signedOrder.makerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    const takerFee = signedOrder.takerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    takerAssetFillAmounts.push(takerAssetFillAmount);
                    erc20Balances[makerAddress][makerAssetAddress] = erc20Balances[makerAddress][
                        makerAssetAddress
                    ].minus(makerAssetFilledAmount);
                    erc20Balances[makerAddress][takerAssetAddress] = erc20Balances[makerAddress][
                        takerAssetAddress
                    ].plus(takerAssetFillAmount);
                    erc20Balances[makerAddress][zrxToken.address] = erc20Balances[makerAddress][zrxToken.address].minus(
                        makerFee,
                    );
                    erc20Balances[takerAddress][makerAssetAddress] = erc20Balances[takerAddress][
                        makerAssetAddress
                    ].plus(makerAssetFilledAmount);
                    erc20Balances[takerAddress][takerAssetAddress] = erc20Balances[takerAddress][
                        takerAssetAddress
                    ].minus(takerAssetFillAmount);
                    erc20Balances[takerAddress][zrxToken.address] = erc20Balances[takerAddress][zrxToken.address].minus(
                        takerFee,
                    );
                    erc20Balances[feeRecipientAddress][zrxToken.address] = erc20Balances[feeRecipientAddress][
                        zrxToken.address
                    ].plus(makerFee.plus(takerFee));
                });

                await exchangeWrapper.batchFillOrKillOrdersAsync(signedOrders, takerAddress, {
                    takerAssetFillAmounts,
                });

                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances).to.be.deep.equal(erc20Balances);
            });

            it('should throw if a single signedOrder does not fill the expected amount', async () => {
                const takerAssetFillAmounts: BigNumber[] = [];
                _.forEach(signedOrders, signedOrder => {
                    const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
                    takerAssetFillAmounts.push(takerAssetFillAmount);
                });

                await exchangeWrapper.fillOrKillOrderAsync(signedOrders[0], takerAddress);

                return expectTransactionFailedAsync(
                    exchangeWrapper.batchFillOrKillOrdersAsync(signedOrders, takerAddress, {
                        takerAssetFillAmounts,
                    }),
                    RevertReason.OrderUnfillable,
                );
            });
        });

        describe('batchFillOrdersNoThrow', async () => {
            const reentrancyTest = (functionNames: string[]) => {
                _.forEach(functionNames, async (functionName: string, functionId: number) => {
                    const description = `should not allow batchFillOrdersNoThrow to reenter the Exchange contract via ${functionName}`;
                    it(description, async () => {
                        const signedOrder = await orderFactory.newSignedOrderAsync({
                            makerAssetData: assetDataUtils.encodeERC20AssetData(reentrantErc20Token.address),
                        });
                        await web3Wrapper.awaitTransactionSuccessAsync(
                            await reentrantErc20Token.setCurrentFunction.sendTransactionAsync(functionId),
                            constants.AWAIT_TRANSACTION_MINED_MS,
                        );
                        await exchangeWrapper.batchFillOrdersNoThrowAsync([signedOrder], takerAddress);
                        const newBalances = await erc20Wrapper.getBalancesAsync();
                        expect(erc20Balances).to.deep.equal(newBalances);
                    });
                });
            };
            describe('batchFillOrdersNoThrow reentrancy tests', () => reentrancyTest(constants.FUNCTIONS_WITH_MUTEX));

            it('should transfer the correct amounts', async () => {
                const takerAssetFillAmounts: BigNumber[] = [];
                const makerAssetAddress = erc20TokenA.address;
                const takerAssetAddress = erc20TokenB.address;
                _.forEach(signedOrders, signedOrder => {
                    const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
                    const makerAssetFilledAmount = takerAssetFillAmount
                        .times(signedOrder.makerAssetAmount)
                        .dividedToIntegerBy(signedOrder.takerAssetAmount);
                    const makerFee = signedOrder.makerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    const takerFee = signedOrder.takerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    takerAssetFillAmounts.push(takerAssetFillAmount);
                    erc20Balances[makerAddress][makerAssetAddress] = erc20Balances[makerAddress][
                        makerAssetAddress
                    ].minus(makerAssetFilledAmount);
                    erc20Balances[makerAddress][takerAssetAddress] = erc20Balances[makerAddress][
                        takerAssetAddress
                    ].plus(takerAssetFillAmount);
                    erc20Balances[makerAddress][zrxToken.address] = erc20Balances[makerAddress][zrxToken.address].minus(
                        makerFee,
                    );
                    erc20Balances[takerAddress][makerAssetAddress] = erc20Balances[takerAddress][
                        makerAssetAddress
                    ].plus(makerAssetFilledAmount);
                    erc20Balances[takerAddress][takerAssetAddress] = erc20Balances[takerAddress][
                        takerAssetAddress
                    ].minus(takerAssetFillAmount);
                    erc20Balances[takerAddress][zrxToken.address] = erc20Balances[takerAddress][zrxToken.address].minus(
                        takerFee,
                    );
                    erc20Balances[feeRecipientAddress][zrxToken.address] = erc20Balances[feeRecipientAddress][
                        zrxToken.address
                    ].plus(makerFee.plus(takerFee));
                });

                await exchangeWrapper.batchFillOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerAssetFillAmounts,
                    // HACK(albrow): We need to hardcode the gas estimate here because
                    // the Geth gas estimator doesn't work with the way we use
                    // delegatecall and swallow errors.
                    gas: 600000,
                });

                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances).to.be.deep.equal(erc20Balances);
            });

            it('should not throw if an order is invalid and fill the remaining orders', async () => {
                const takerAssetFillAmounts: BigNumber[] = [];
                const makerAssetAddress = erc20TokenA.address;
                const takerAssetAddress = erc20TokenB.address;

                const invalidOrder = {
                    ...signedOrders[0],
                    signature: '0x00',
                };
                const validOrders = signedOrders.slice(1);

                takerAssetFillAmounts.push(invalidOrder.takerAssetAmount.div(2));
                _.forEach(validOrders, signedOrder => {
                    const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
                    const makerAssetFilledAmount = takerAssetFillAmount
                        .times(signedOrder.makerAssetAmount)
                        .dividedToIntegerBy(signedOrder.takerAssetAmount);
                    const makerFee = signedOrder.makerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    const takerFee = signedOrder.takerFee
                        .times(makerAssetFilledAmount)
                        .dividedToIntegerBy(signedOrder.makerAssetAmount);
                    takerAssetFillAmounts.push(takerAssetFillAmount);
                    erc20Balances[makerAddress][makerAssetAddress] = erc20Balances[makerAddress][
                        makerAssetAddress
                    ].minus(makerAssetFilledAmount);
                    erc20Balances[makerAddress][takerAssetAddress] = erc20Balances[makerAddress][
                        takerAssetAddress
                    ].plus(takerAssetFillAmount);
                    erc20Balances[makerAddress][zrxToken.address] = erc20Balances[makerAddress][zrxToken.address].minus(
                        makerFee,
                    );
                    erc20Balances[takerAddress][makerAssetAddress] = erc20Balances[takerAddress][
                        makerAssetAddress
                    ].plus(makerAssetFilledAmount);
                    erc20Balances[takerAddress][takerAssetAddress] = erc20Balances[takerAddress][
                        takerAssetAddress
                    ].minus(takerAssetFillAmount);
                    erc20Balances[takerAddress][zrxToken.address] = erc20Balances[takerAddress][zrxToken.address].minus(
                        takerFee,
                    );
                    erc20Balances[feeRecipientAddress][zrxToken.address] = erc20Balances[feeRecipientAddress][
                        zrxToken.address
                    ].plus(makerFee.plus(takerFee));
                });

                const newOrders = [invalidOrder, ...validOrders];
                await exchangeWrapper.batchFillOrdersNoThrowAsync(newOrders, takerAddress, {
                    takerAssetFillAmounts,
                    // HACK(albrow): We need to hardcode the gas estimate here because
                    // the Geth gas estimator doesn't work with the way we use
                    // delegatecall and swallow errors.
                    gas: 450000,
                });

                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances).to.be.deep.equal(erc20Balances);
            });
        });

        describe('marketSellOrders', () => {
            const reentrancyTest = (functionNames: string[]) => {
                _.forEach(functionNames, async (functionName: string, functionId: number) => {
                    const description = `should not allow marketSellOrders to reenter the Exchange contract via ${functionName}`;
                    it(description, async () => {
                        const signedOrder = await orderFactory.newSignedOrderAsync({
                            makerAssetData: assetDataUtils.encodeERC20AssetData(reentrantErc20Token.address),
                        });
                        await web3Wrapper.awaitTransactionSuccessAsync(
                            await reentrantErc20Token.setCurrentFunction.sendTransactionAsync(functionId),
                            constants.AWAIT_TRANSACTION_MINED_MS,
                        );
                        await expectTransactionFailedAsync(
                            exchangeWrapper.marketSellOrdersAsync([signedOrder], takerAddress, {
                                takerAssetFillAmount: signedOrder.takerAssetAmount,
                            }),
                            RevertReason.TransferFailed,
                        );
                    });
                });
            };
            describe('marketSellOrders reentrancy tests', () => reentrancyTest(constants.FUNCTIONS_WITH_MUTEX));

            it('should stop when the entire takerAssetFillAmount is filled', async () => {
                const takerAssetFillAmount = signedOrders[0].takerAssetAmount.plus(
                    signedOrders[1].takerAssetAmount.div(2),
                );
                await exchangeWrapper.marketSellOrdersAsync(signedOrders, takerAddress, {
                    takerAssetFillAmount,
                });

                const newBalances = await erc20Wrapper.getBalancesAsync();

                const makerAssetFilledAmount = signedOrders[0].makerAssetAmount.plus(
                    signedOrders[1].makerAssetAmount.dividedToIntegerBy(2),
                );
                const makerFee = signedOrders[0].makerFee.plus(signedOrders[1].makerFee.dividedToIntegerBy(2));
                const takerFee = signedOrders[0].takerFee.plus(signedOrders[1].takerFee.dividedToIntegerBy(2));
                expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFilledAmount),
                );
                expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][defaultTakerAssetAddress].plus(takerAssetFillAmount),
                );
                expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][zrxToken.address].minus(makerFee),
                );
                expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount),
                );
                expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFilledAmount),
                );
                expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][zrxToken.address].minus(takerFee),
                );
                expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[feeRecipientAddress][zrxToken.address].plus(makerFee.plus(takerFee)),
                );
            });

            it('should fill all signedOrders if cannot fill entire takerAssetFillAmount', async () => {
                const takerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18);
                _.forEach(signedOrders, signedOrder => {
                    erc20Balances[makerAddress][defaultMakerAssetAddress] = erc20Balances[makerAddress][
                        defaultMakerAssetAddress
                    ].minus(signedOrder.makerAssetAmount);
                    erc20Balances[makerAddress][defaultTakerAssetAddress] = erc20Balances[makerAddress][
                        defaultTakerAssetAddress
                    ].plus(signedOrder.takerAssetAmount);
                    erc20Balances[makerAddress][zrxToken.address] = erc20Balances[makerAddress][zrxToken.address].minus(
                        signedOrder.makerFee,
                    );
                    erc20Balances[takerAddress][defaultMakerAssetAddress] = erc20Balances[takerAddress][
                        defaultMakerAssetAddress
                    ].plus(signedOrder.makerAssetAmount);
                    erc20Balances[takerAddress][defaultTakerAssetAddress] = erc20Balances[takerAddress][
                        defaultTakerAssetAddress
                    ].minus(signedOrder.takerAssetAmount);
                    erc20Balances[takerAddress][zrxToken.address] = erc20Balances[takerAddress][zrxToken.address].minus(
                        signedOrder.takerFee,
                    );
                    erc20Balances[feeRecipientAddress][zrxToken.address] = erc20Balances[feeRecipientAddress][
                        zrxToken.address
                    ].plus(signedOrder.makerFee.plus(signedOrder.takerFee));
                });
                await exchangeWrapper.marketSellOrdersAsync(signedOrders, takerAddress, {
                    takerAssetFillAmount,
                });

                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances).to.be.deep.equal(erc20Balances);
            });

            it('should throw when a signedOrder does not use the same takerAssetAddress', async () => {
                signedOrders = [
                    await orderFactory.newSignedOrderAsync(),
                    await orderFactory.newSignedOrderAsync({
                        takerAssetData: assetDataUtils.encodeERC20AssetData(zrxToken.address),
                    }),
                    await orderFactory.newSignedOrderAsync(),
                ];

                return expectTransactionFailedAsync(
                    exchangeWrapper.marketSellOrdersAsync(signedOrders, takerAddress, {
                        takerAssetFillAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(1000), 18),
                    }),
                    // We simply use the takerAssetData from the first order for all orders.
                    // If they are not the same, the contract throws when validating the order signature
                    RevertReason.InvalidOrderSignature,
                );
            });
        });

        describe('marketSellOrdersNoThrow', () => {
            const reentrancyTest = (functionNames: string[]) => {
                _.forEach(functionNames, async (functionName: string, functionId: number) => {
                    const description = `should not allow marketSellOrdersNoThrow to reenter the Exchange contract via ${functionName}`;
                    it(description, async () => {
                        const signedOrder = await orderFactory.newSignedOrderAsync({
                            makerAssetData: assetDataUtils.encodeERC20AssetData(reentrantErc20Token.address),
                        });
                        await web3Wrapper.awaitTransactionSuccessAsync(
                            await reentrantErc20Token.setCurrentFunction.sendTransactionAsync(functionId),
                            constants.AWAIT_TRANSACTION_MINED_MS,
                        );
                        await exchangeWrapper.marketSellOrdersNoThrowAsync([signedOrder], takerAddress, {
                            takerAssetFillAmount: signedOrder.takerAssetAmount,
                        });
                        const newBalances = await erc20Wrapper.getBalancesAsync();
                        expect(erc20Balances).to.deep.equal(newBalances);
                    });
                });
            };
            describe('marketSellOrdersNoThrow reentrancy tests', () => reentrancyTest(constants.FUNCTIONS_WITH_MUTEX));

            it('should stop when the entire takerAssetFillAmount is filled', async () => {
                const takerAssetFillAmount = signedOrders[0].takerAssetAmount.plus(
                    signedOrders[1].takerAssetAmount.div(2),
                );
                await exchangeWrapper.marketSellOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerAssetFillAmount,
                    // HACK(albrow): We need to hardcode the gas estimate here because
                    // the Geth gas estimator doesn't work with the way we use
                    // delegatecall and swallow errors.
                    gas: 6000000,
                });

                const newBalances = await erc20Wrapper.getBalancesAsync();

                const makerAssetFilledAmount = signedOrders[0].makerAssetAmount.plus(
                    signedOrders[1].makerAssetAmount.dividedToIntegerBy(2),
                );
                const makerFee = signedOrders[0].makerFee.plus(signedOrders[1].makerFee.dividedToIntegerBy(2));
                const takerFee = signedOrders[0].takerFee.plus(signedOrders[1].takerFee.dividedToIntegerBy(2));
                expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFilledAmount),
                );
                expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][defaultTakerAssetAddress].plus(takerAssetFillAmount),
                );
                expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][zrxToken.address].minus(makerFee),
                );
                expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount),
                );
                expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFilledAmount),
                );
                expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][zrxToken.address].minus(takerFee),
                );
                expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[feeRecipientAddress][zrxToken.address].plus(makerFee.plus(takerFee)),
                );
            });

            it('should fill all signedOrders if cannot fill entire takerAssetFillAmount', async () => {
                const takerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18);
                _.forEach(signedOrders, signedOrder => {
                    erc20Balances[makerAddress][defaultMakerAssetAddress] = erc20Balances[makerAddress][
                        defaultMakerAssetAddress
                    ].minus(signedOrder.makerAssetAmount);
                    erc20Balances[makerAddress][defaultTakerAssetAddress] = erc20Balances[makerAddress][
                        defaultTakerAssetAddress
                    ].plus(signedOrder.takerAssetAmount);
                    erc20Balances[makerAddress][zrxToken.address] = erc20Balances[makerAddress][zrxToken.address].minus(
                        signedOrder.makerFee,
                    );
                    erc20Balances[takerAddress][defaultMakerAssetAddress] = erc20Balances[takerAddress][
                        defaultMakerAssetAddress
                    ].plus(signedOrder.makerAssetAmount);
                    erc20Balances[takerAddress][defaultTakerAssetAddress] = erc20Balances[takerAddress][
                        defaultTakerAssetAddress
                    ].minus(signedOrder.takerAssetAmount);
                    erc20Balances[takerAddress][zrxToken.address] = erc20Balances[takerAddress][zrxToken.address].minus(
                        signedOrder.takerFee,
                    );
                    erc20Balances[feeRecipientAddress][zrxToken.address] = erc20Balances[feeRecipientAddress][
                        zrxToken.address
                    ].plus(signedOrder.makerFee.plus(signedOrder.takerFee));
                });
                await exchangeWrapper.marketSellOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerAssetFillAmount,
                    // HACK(albrow): We need to hardcode the gas estimate here because
                    // the Geth gas estimator doesn't work with the way we use
                    // delegatecall and swallow errors.
                    gas: 600000,
                });

                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances).to.be.deep.equal(erc20Balances);
            });

            it('should not fill a signedOrder that does not use the same takerAssetAddress', async () => {
                signedOrders = [
                    await orderFactory.newSignedOrderAsync(),
                    await orderFactory.newSignedOrderAsync(),
                    await orderFactory.newSignedOrderAsync({
                        takerAssetData: assetDataUtils.encodeERC20AssetData(zrxToken.address),
                    }),
                ];
                const takerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18);
                const filledSignedOrders = signedOrders.slice(0, -1);
                _.forEach(filledSignedOrders, signedOrder => {
                    erc20Balances[makerAddress][defaultMakerAssetAddress] = erc20Balances[makerAddress][
                        defaultMakerAssetAddress
                    ].minus(signedOrder.makerAssetAmount);
                    erc20Balances[makerAddress][defaultTakerAssetAddress] = erc20Balances[makerAddress][
                        defaultTakerAssetAddress
                    ].plus(signedOrder.takerAssetAmount);
                    erc20Balances[makerAddress][zrxToken.address] = erc20Balances[makerAddress][zrxToken.address].minus(
                        signedOrder.makerFee,
                    );
                    erc20Balances[takerAddress][defaultMakerAssetAddress] = erc20Balances[takerAddress][
                        defaultMakerAssetAddress
                    ].plus(signedOrder.makerAssetAmount);
                    erc20Balances[takerAddress][defaultTakerAssetAddress] = erc20Balances[takerAddress][
                        defaultTakerAssetAddress
                    ].minus(signedOrder.takerAssetAmount);
                    erc20Balances[takerAddress][zrxToken.address] = erc20Balances[takerAddress][zrxToken.address].minus(
                        signedOrder.takerFee,
                    );
                    erc20Balances[feeRecipientAddress][zrxToken.address] = erc20Balances[feeRecipientAddress][
                        zrxToken.address
                    ].plus(signedOrder.makerFee.plus(signedOrder.takerFee));
                });
                await exchangeWrapper.marketSellOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerAssetFillAmount,
                    // HACK(albrow): We need to hardcode the gas estimate here because
                    // the Geth gas estimator doesn't work with the way we use
                    // delegatecall and swallow errors.
                    gas: 600000,
                });

                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances).to.be.deep.equal(erc20Balances);
            });
        });

        describe('marketBuyOrders', () => {
            const reentrancyTest = (functionNames: string[]) => {
                _.forEach(functionNames, async (functionName: string, functionId: number) => {
                    const description = `should not allow marketBuyOrders to reenter the Exchange contract via ${functionName}`;
                    it(description, async () => {
                        const signedOrder = await orderFactory.newSignedOrderAsync({
                            makerAssetData: assetDataUtils.encodeERC20AssetData(reentrantErc20Token.address),
                        });
                        await web3Wrapper.awaitTransactionSuccessAsync(
                            await reentrantErc20Token.setCurrentFunction.sendTransactionAsync(functionId),
                            constants.AWAIT_TRANSACTION_MINED_MS,
                        );
                        await expectTransactionFailedAsync(
                            exchangeWrapper.marketBuyOrdersAsync([signedOrder], takerAddress, {
                                makerAssetFillAmount: signedOrder.makerAssetAmount,
                            }),
                            RevertReason.TransferFailed,
                        );
                    });
                });
            };
            describe('marketBuyOrders reentrancy tests', () => reentrancyTest(constants.FUNCTIONS_WITH_MUTEX));

            it('should stop when the entire makerAssetFillAmount is filled', async () => {
                const makerAssetFillAmount = signedOrders[0].makerAssetAmount.plus(
                    signedOrders[1].makerAssetAmount.div(2),
                );
                await exchangeWrapper.marketBuyOrdersAsync(signedOrders, takerAddress, {
                    makerAssetFillAmount,
                });

                const newBalances = await erc20Wrapper.getBalancesAsync();

                const makerAmountBought = signedOrders[0].takerAssetAmount.plus(
                    signedOrders[1].takerAssetAmount.dividedToIntegerBy(2),
                );
                const makerFee = signedOrders[0].makerFee.plus(signedOrders[1].makerFee.dividedToIntegerBy(2));
                const takerFee = signedOrders[0].takerFee.plus(signedOrders[1].takerFee.dividedToIntegerBy(2));
                expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
                );
                expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][defaultTakerAssetAddress].plus(makerAmountBought),
                );
                expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][zrxToken.address].minus(makerFee),
                );
                expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][defaultTakerAssetAddress].minus(makerAmountBought),
                );
                expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount),
                );
                expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][zrxToken.address].minus(takerFee),
                );
                expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[feeRecipientAddress][zrxToken.address].plus(makerFee.plus(takerFee)),
                );
            });

            it('should fill all signedOrders if cannot fill entire makerAssetFillAmount', async () => {
                const makerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18);
                _.forEach(signedOrders, signedOrder => {
                    erc20Balances[makerAddress][defaultMakerAssetAddress] = erc20Balances[makerAddress][
                        defaultMakerAssetAddress
                    ].minus(signedOrder.makerAssetAmount);
                    erc20Balances[makerAddress][defaultTakerAssetAddress] = erc20Balances[makerAddress][
                        defaultTakerAssetAddress
                    ].plus(signedOrder.takerAssetAmount);
                    erc20Balances[makerAddress][zrxToken.address] = erc20Balances[makerAddress][zrxToken.address].minus(
                        signedOrder.makerFee,
                    );
                    erc20Balances[takerAddress][defaultMakerAssetAddress] = erc20Balances[takerAddress][
                        defaultMakerAssetAddress
                    ].plus(signedOrder.makerAssetAmount);
                    erc20Balances[takerAddress][defaultTakerAssetAddress] = erc20Balances[takerAddress][
                        defaultTakerAssetAddress
                    ].minus(signedOrder.takerAssetAmount);
                    erc20Balances[takerAddress][zrxToken.address] = erc20Balances[takerAddress][zrxToken.address].minus(
                        signedOrder.takerFee,
                    );
                    erc20Balances[feeRecipientAddress][zrxToken.address] = erc20Balances[feeRecipientAddress][
                        zrxToken.address
                    ].plus(signedOrder.makerFee.plus(signedOrder.takerFee));
                });
                await exchangeWrapper.marketBuyOrdersAsync(signedOrders, takerAddress, {
                    makerAssetFillAmount,
                });

                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances).to.be.deep.equal(erc20Balances);
            });

            it('should throw when a signedOrder does not use the same makerAssetAddress', async () => {
                signedOrders = [
                    await orderFactory.newSignedOrderAsync(),
                    await orderFactory.newSignedOrderAsync({
                        makerAssetData: assetDataUtils.encodeERC20AssetData(zrxToken.address),
                    }),
                    await orderFactory.newSignedOrderAsync(),
                ];

                return expectTransactionFailedAsync(
                    exchangeWrapper.marketBuyOrdersAsync(signedOrders, takerAddress, {
                        makerAssetFillAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(1000), 18),
                    }),
                    RevertReason.InvalidOrderSignature,
                );
            });
        });

        describe('marketBuyOrdersNoThrow', () => {
            const reentrancyTest = (functionNames: string[]) => {
                _.forEach(functionNames, async (functionName: string, functionId: number) => {
                    const description = `should not allow marketBuyOrdersNoThrow to reenter the Exchange contract via ${functionName}`;
                    it(description, async () => {
                        const signedOrder = await orderFactory.newSignedOrderAsync({
                            makerAssetData: assetDataUtils.encodeERC20AssetData(reentrantErc20Token.address),
                        });
                        await web3Wrapper.awaitTransactionSuccessAsync(
                            await reentrantErc20Token.setCurrentFunction.sendTransactionAsync(functionId),
                            constants.AWAIT_TRANSACTION_MINED_MS,
                        );
                        await exchangeWrapper.marketBuyOrdersNoThrowAsync([signedOrder], takerAddress, {
                            makerAssetFillAmount: signedOrder.makerAssetAmount,
                        });
                        const newBalances = await erc20Wrapper.getBalancesAsync();
                        expect(erc20Balances).to.deep.equal(newBalances);
                    });
                });
            };
            describe('marketBuyOrdersNoThrow reentrancy tests', () => reentrancyTest(constants.FUNCTIONS_WITH_MUTEX));

            it('should stop when the entire makerAssetFillAmount is filled', async () => {
                const makerAssetFillAmount = signedOrders[0].makerAssetAmount.plus(
                    signedOrders[1].makerAssetAmount.div(2),
                );
                await exchangeWrapper.marketBuyOrdersNoThrowAsync(signedOrders, takerAddress, {
                    makerAssetFillAmount,
                    // HACK(albrow): We need to hardcode the gas estimate here because
                    // the Geth gas estimator doesn't work with the way we use
                    // delegatecall and swallow errors.
                    gas: 600000,
                });

                const newBalances = await erc20Wrapper.getBalancesAsync();

                const makerAmountBought = signedOrders[0].takerAssetAmount.plus(
                    signedOrders[1].takerAssetAmount.dividedToIntegerBy(2),
                );
                const makerFee = signedOrders[0].makerFee.plus(signedOrders[1].makerFee.dividedToIntegerBy(2));
                const takerFee = signedOrders[0].takerFee.plus(signedOrders[1].takerFee.dividedToIntegerBy(2));
                expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFillAmount),
                );
                expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][defaultTakerAssetAddress].plus(makerAmountBought),
                );
                expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[makerAddress][zrxToken.address].minus(makerFee),
                );
                expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][defaultTakerAssetAddress].minus(makerAmountBought),
                );
                expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][defaultMakerAssetAddress].plus(makerAssetFillAmount),
                );
                expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[takerAddress][zrxToken.address].minus(takerFee),
                );
                expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                    erc20Balances[feeRecipientAddress][zrxToken.address].plus(makerFee.plus(takerFee)),
                );
            });

            it('should fill all signedOrders if cannot fill entire makerAssetFillAmount', async () => {
                const makerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18);
                _.forEach(signedOrders, signedOrder => {
                    erc20Balances[makerAddress][defaultMakerAssetAddress] = erc20Balances[makerAddress][
                        defaultMakerAssetAddress
                    ].minus(signedOrder.makerAssetAmount);
                    erc20Balances[makerAddress][defaultTakerAssetAddress] = erc20Balances[makerAddress][
                        defaultTakerAssetAddress
                    ].plus(signedOrder.takerAssetAmount);
                    erc20Balances[makerAddress][zrxToken.address] = erc20Balances[makerAddress][zrxToken.address].minus(
                        signedOrder.makerFee,
                    );
                    erc20Balances[takerAddress][defaultMakerAssetAddress] = erc20Balances[takerAddress][
                        defaultMakerAssetAddress
                    ].plus(signedOrder.makerAssetAmount);
                    erc20Balances[takerAddress][defaultTakerAssetAddress] = erc20Balances[takerAddress][
                        defaultTakerAssetAddress
                    ].minus(signedOrder.takerAssetAmount);
                    erc20Balances[takerAddress][zrxToken.address] = erc20Balances[takerAddress][zrxToken.address].minus(
                        signedOrder.takerFee,
                    );
                    erc20Balances[feeRecipientAddress][zrxToken.address] = erc20Balances[feeRecipientAddress][
                        zrxToken.address
                    ].plus(signedOrder.makerFee.plus(signedOrder.takerFee));
                });
                await exchangeWrapper.marketBuyOrdersNoThrowAsync(signedOrders, takerAddress, {
                    makerAssetFillAmount,
                    // HACK(albrow): We need to hardcode the gas estimate here because
                    // the Geth gas estimator doesn't work with the way we use
                    // delegatecall and swallow errors.
                    gas: 600000,
                });

                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances).to.be.deep.equal(erc20Balances);
            });

            it('should not fill a signedOrder that does not use the same makerAssetAddress', async () => {
                signedOrders = [
                    await orderFactory.newSignedOrderAsync(),
                    await orderFactory.newSignedOrderAsync(),
                    await orderFactory.newSignedOrderAsync({
                        makerAssetData: assetDataUtils.encodeERC20AssetData(zrxToken.address),
                    }),
                ];

                const makerAssetFillAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18);
                const filledSignedOrders = signedOrders.slice(0, -1);
                _.forEach(filledSignedOrders, signedOrder => {
                    erc20Balances[makerAddress][defaultMakerAssetAddress] = erc20Balances[makerAddress][
                        defaultMakerAssetAddress
                    ].minus(signedOrder.makerAssetAmount);
                    erc20Balances[makerAddress][defaultTakerAssetAddress] = erc20Balances[makerAddress][
                        defaultTakerAssetAddress
                    ].plus(signedOrder.takerAssetAmount);
                    erc20Balances[makerAddress][zrxToken.address] = erc20Balances[makerAddress][zrxToken.address].minus(
                        signedOrder.makerFee,
                    );
                    erc20Balances[takerAddress][defaultMakerAssetAddress] = erc20Balances[takerAddress][
                        defaultMakerAssetAddress
                    ].plus(signedOrder.makerAssetAmount);
                    erc20Balances[takerAddress][defaultTakerAssetAddress] = erc20Balances[takerAddress][
                        defaultTakerAssetAddress
                    ].minus(signedOrder.takerAssetAmount);
                    erc20Balances[takerAddress][zrxToken.address] = erc20Balances[takerAddress][zrxToken.address].minus(
                        signedOrder.takerFee,
                    );
                    erc20Balances[feeRecipientAddress][zrxToken.address] = erc20Balances[feeRecipientAddress][
                        zrxToken.address
                    ].plus(signedOrder.makerFee.plus(signedOrder.takerFee));
                });
                await exchangeWrapper.marketBuyOrdersNoThrowAsync(signedOrders, takerAddress, {
                    makerAssetFillAmount,
                    // HACK(albrow): We need to hardcode the gas estimate here because
                    // the Geth gas estimator doesn't work with the way we use
                    // delegatecall and swallow errors.
                    gas: 600000,
                });

                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(newBalances).to.be.deep.equal(erc20Balances);
            });
        });

        describe('batchCancelOrders', () => {
            it('should be able to cancel multiple signedOrders', async () => {
                const takerAssetCancelAmounts = _.map(signedOrders, signedOrder => signedOrder.takerAssetAmount);
                await exchangeWrapper.batchCancelOrdersAsync(signedOrders, makerAddress);

                await exchangeWrapper.batchFillOrdersNoThrowAsync(signedOrders, takerAddress, {
                    takerAssetFillAmounts: takerAssetCancelAmounts,
                });
                const newBalances = await erc20Wrapper.getBalancesAsync();
                expect(erc20Balances).to.be.deep.equal(newBalances);
            });
        });

        describe('getOrdersInfo', () => {
            beforeEach(async () => {
                signedOrders = [
                    await orderFactory.newSignedOrderAsync(),
                    await orderFactory.newSignedOrderAsync(),
                    await orderFactory.newSignedOrderAsync(),
                ];
            });
            it('should get the correct information for multiple unfilled orders', async () => {
                const ordersInfo = await exchangeWrapper.getOrdersInfoAsync(signedOrders);
                expect(ordersInfo.length).to.be.equal(3);
                _.forEach(signedOrders, (signedOrder, index) => {
                    const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
                    const expectedTakerAssetFilledAmount = new BigNumber(0);
                    const expectedOrderStatus = OrderStatus.Fillable;
                    const orderInfo = ordersInfo[index];
                    expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
                    expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
                    expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
                });
            });
            it('should get the correct information for multiple partially filled orders', async () => {
                const takerAssetFillAmounts = _.map(signedOrders, signedOrder => signedOrder.takerAssetAmount.div(2));
                await exchangeWrapper.batchFillOrdersAsync(signedOrders, takerAddress, { takerAssetFillAmounts });
                const ordersInfo = await exchangeWrapper.getOrdersInfoAsync(signedOrders);
                expect(ordersInfo.length).to.be.equal(3);
                _.forEach(signedOrders, (signedOrder, index) => {
                    const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
                    const expectedTakerAssetFilledAmount = signedOrder.takerAssetAmount.div(2);
                    const expectedOrderStatus = OrderStatus.Fillable;
                    const orderInfo = ordersInfo[index];
                    expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
                    expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
                    expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
                });
            });
            it('should get the correct information for multiple fully filled orders', async () => {
                await exchangeWrapper.batchFillOrdersAsync(signedOrders, takerAddress);
                const ordersInfo = await exchangeWrapper.getOrdersInfoAsync(signedOrders);
                expect(ordersInfo.length).to.be.equal(3);
                _.forEach(signedOrders, (signedOrder, index) => {
                    const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
                    const expectedTakerAssetFilledAmount = signedOrder.takerAssetAmount;
                    const expectedOrderStatus = OrderStatus.FullyFilled;
                    const orderInfo = ordersInfo[index];
                    expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
                    expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
                    expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
                });
            });
            it('should get the correct information for multiple cancelled and unfilled orders', async () => {
                await exchangeWrapper.batchCancelOrdersAsync(signedOrders, makerAddress);
                const ordersInfo = await exchangeWrapper.getOrdersInfoAsync(signedOrders);
                expect(ordersInfo.length).to.be.equal(3);
                _.forEach(signedOrders, (signedOrder, index) => {
                    const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
                    const expectedTakerAssetFilledAmount = new BigNumber(0);
                    const expectedOrderStatus = OrderStatus.Cancelled;
                    const orderInfo = ordersInfo[index];
                    expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
                    expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
                    expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
                });
            });
            it('should get the correct information for multiple cancelled and partially filled orders', async () => {
                const takerAssetFillAmounts = _.map(signedOrders, signedOrder => signedOrder.takerAssetAmount.div(2));
                await exchangeWrapper.batchFillOrdersAsync(signedOrders, takerAddress, { takerAssetFillAmounts });
                await exchangeWrapper.batchCancelOrdersAsync(signedOrders, makerAddress);
                const ordersInfo = await exchangeWrapper.getOrdersInfoAsync(signedOrders);
                expect(ordersInfo.length).to.be.equal(3);
                _.forEach(signedOrders, (signedOrder, index) => {
                    const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
                    const expectedTakerAssetFilledAmount = signedOrder.takerAssetAmount.div(2);
                    const expectedOrderStatus = OrderStatus.Cancelled;
                    const orderInfo = ordersInfo[index];
                    expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
                    expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
                    expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
                });
            });
            it('should get the correct information for multiple expired and unfilled orders', async () => {
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const timeUntilExpiration = signedOrders[0].expirationTimeSeconds.minus(currentTimestamp).toNumber();
                await increaseTimeAndMineBlockAsync(timeUntilExpiration);
                const ordersInfo = await exchangeWrapper.getOrdersInfoAsync(signedOrders);
                expect(ordersInfo.length).to.be.equal(3);
                _.forEach(signedOrders, (signedOrder, index) => {
                    const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
                    const expectedTakerAssetFilledAmount = new BigNumber(0);
                    const expectedOrderStatus = OrderStatus.Expired;
                    const orderInfo = ordersInfo[index];
                    expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
                    expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
                    expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
                });
            });
            it('should get the correct information for multiple expired and partially filled orders', async () => {
                const takerAssetFillAmounts = _.map(signedOrders, signedOrder => signedOrder.takerAssetAmount.div(2));
                await exchangeWrapper.batchFillOrdersAsync(signedOrders, takerAddress, { takerAssetFillAmounts });
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const timeUntilExpiration = signedOrders[0].expirationTimeSeconds.minus(currentTimestamp).toNumber();
                await increaseTimeAndMineBlockAsync(timeUntilExpiration);
                const ordersInfo = await exchangeWrapper.getOrdersInfoAsync(signedOrders);
                expect(ordersInfo.length).to.be.equal(3);
                _.forEach(signedOrders, (signedOrder, index) => {
                    const expectedOrderHash = orderHashUtils.getOrderHashHex(signedOrder);
                    const expectedTakerAssetFilledAmount = signedOrder.takerAssetAmount.div(2);
                    const expectedOrderStatus = OrderStatus.Expired;
                    const orderInfo = ordersInfo[index];
                    expect(orderInfo.orderHash).to.be.equal(expectedOrderHash);
                    expect(orderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(expectedTakerAssetFilledAmount);
                    expect(orderInfo.orderStatus).to.equal(expectedOrderStatus);
                });
            });
            it('should get the correct information for a mix of unfilled, partially filled, fully filled, cancelled, and expired orders', async () => {
                const unfilledOrder = await orderFactory.newSignedOrderAsync();
                const partiallyFilledOrder = await orderFactory.newSignedOrderAsync();
                await exchangeWrapper.fillOrderAsync(partiallyFilledOrder, takerAddress, {
                    takerAssetFillAmount: partiallyFilledOrder.takerAssetAmount.div(2),
                });
                const fullyFilledOrder = await orderFactory.newSignedOrderAsync();
                await exchangeWrapper.fillOrderAsync(fullyFilledOrder, takerAddress);
                const cancelledOrder = await orderFactory.newSignedOrderAsync();
                await exchangeWrapper.cancelOrderAsync(cancelledOrder, makerAddress);
                const currentTimestamp = await getLatestBlockTimestampAsync();
                const expiredOrder = await orderFactory.newSignedOrderAsync({
                    expirationTimeSeconds: new BigNumber(currentTimestamp),
                });
                signedOrders = [unfilledOrder, partiallyFilledOrder, fullyFilledOrder, cancelledOrder, expiredOrder];
                const ordersInfo = await exchangeWrapper.getOrdersInfoAsync(signedOrders);
                expect(ordersInfo.length).to.be.equal(5);

                const expectedUnfilledOrderHash = orderHashUtils.getOrderHashHex(unfilledOrder);
                const expectedUnfilledTakerAssetFilledAmount = new BigNumber(0);
                const expectedUnfilledOrderStatus = OrderStatus.Fillable;
                const unfilledOrderInfo = ordersInfo[0];
                expect(unfilledOrderInfo.orderHash).to.be.equal(expectedUnfilledOrderHash);
                expect(unfilledOrderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(
                    expectedUnfilledTakerAssetFilledAmount,
                );
                expect(unfilledOrderInfo.orderStatus).to.be.equal(expectedUnfilledOrderStatus);

                const expectedPartialOrderHash = orderHashUtils.getOrderHashHex(partiallyFilledOrder);
                const expectedPartialTakerAssetFilledAmount = partiallyFilledOrder.takerAssetAmount.div(2);
                const expectedPartialOrderStatus = OrderStatus.Fillable;
                const partialOrderInfo = ordersInfo[1];
                expect(partialOrderInfo.orderHash).to.be.equal(expectedPartialOrderHash);
                expect(partialOrderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(
                    expectedPartialTakerAssetFilledAmount,
                );
                expect(partialOrderInfo.orderStatus).to.be.equal(expectedPartialOrderStatus);

                const expectedFilledOrderHash = orderHashUtils.getOrderHashHex(fullyFilledOrder);
                const expectedFilledTakerAssetFilledAmount = fullyFilledOrder.takerAssetAmount;
                const expectedFilledOrderStatus = OrderStatus.FullyFilled;
                const filledOrderInfo = ordersInfo[2];
                expect(filledOrderInfo.orderHash).to.be.equal(expectedFilledOrderHash);
                expect(filledOrderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(
                    expectedFilledTakerAssetFilledAmount,
                );
                expect(filledOrderInfo.orderStatus).to.be.equal(expectedFilledOrderStatus);

                const expectedCancelledOrderHash = orderHashUtils.getOrderHashHex(cancelledOrder);
                const expectedCancelledTakerAssetFilledAmount = new BigNumber(0);
                const expectedCancelledOrderStatus = OrderStatus.Cancelled;
                const cancelledOrderInfo = ordersInfo[3];
                expect(cancelledOrderInfo.orderHash).to.be.equal(expectedCancelledOrderHash);
                expect(cancelledOrderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(
                    expectedCancelledTakerAssetFilledAmount,
                );
                expect(cancelledOrderInfo.orderStatus).to.be.equal(expectedCancelledOrderStatus);

                const expectedExpiredOrderHash = orderHashUtils.getOrderHashHex(expiredOrder);
                const expectedExpiredTakerAssetFilledAmount = new BigNumber(0);
                const expectedExpiredOrderStatus = OrderStatus.Expired;
                const expiredOrderInfo = ordersInfo[4];
                expect(expiredOrderInfo.orderHash).to.be.equal(expectedExpiredOrderHash);
                expect(expiredOrderInfo.orderTakerAssetFilledAmount).to.be.bignumber.equal(
                    expectedExpiredTakerAssetFilledAmount,
                );
                expect(expiredOrderInfo.orderStatus).to.be.equal(expectedExpiredOrderStatus);
            });
        });
    });
}); // tslint:disable-line:max-file-line-count
