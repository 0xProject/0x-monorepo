// tslint:disable:no-unnecessary-type-assertion
import { ContractWrappers } from '@0x/contract-wrappers';
import { tokenUtils } from '@0x/contract-wrappers/lib/test/utils/token_utils';
import { BlockchainLifecycle, callbackErrorReporter } from '@0x/dev-utils';
import { EthRPCClient } from '@0x/eth-rpc-client';
import { FillScenarios } from '@0x/fill-scenarios';
import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
import {
    DoneCallback,
    ExchangeContractErrs,
    OrderState,
    OrderStateInvalid,
    OrderStateValid,
    SignedOrder,
} from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';

import {
    DependentOrderHashesTracker,
    OrderHashesByERC20ByMakerAddress,
} from '../src/order_watcher/dependent_order_hashes_tracker';
import { OrderWatcher } from '../src/order_watcher/order_watcher';
import { OrderWatcherError } from '../src/types';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { migrateOnceAsync } from './utils/migrate';
import { ethRPCClient, provider } from './utils/web3_wrapper';

const TIMEOUT_MS = 150;

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(ethRPCClient);

describe('OrderWatcher', () => {
    let contractWrappers: ContractWrappers;
    let fillScenarios: FillScenarios;
    let userAddresses: string[];
    let zrxTokenAddress: string;
    let makerAssetData: string;
    let takerAssetData: string;
    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let makerAddress: string;
    let takerAddress: string;
    let coinbase: string;
    let feeRecipient: string;
    let signedOrder: SignedOrder;
    let orderWatcher: OrderWatcher;
    const decimals = constants.ZRX_DECIMALS;
    const fillableAmount = EthRPCClient.toBaseUnitAmount(new BigNumber(5), decimals);
    before(async () => {
        const contractAddresses = await migrateOnceAsync();
        await blockchainLifecycle.startAsync();
        const networkId = constants.TESTRPC_NETWORK_ID;
        const config = {
            networkId,
            contractAddresses,
        };
        contractWrappers = new ContractWrappers(provider, config);
        userAddresses = await ethRPCClient.getAvailableAddressesAsync();
        zrxTokenAddress = contractAddresses.zrxToken;
        fillScenarios = new FillScenarios(
            provider,
            userAddresses,
            zrxTokenAddress,
            contractAddresses.exchange,
            contractAddresses.erc20Proxy,
            contractAddresses.erc721Proxy,
        );
        [coinbase, makerAddress, takerAddress, feeRecipient] = userAddresses;
        [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        [makerAssetData, takerAssetData] = [
            assetDataUtils.encodeERC20AssetData(makerTokenAddress),
            assetDataUtils.encodeERC20AssetData(takerTokenAddress),
        ];
        const orderWatcherConfig = {};
        orderWatcher = new OrderWatcher(provider, networkId, contractAddresses, orderWatcherConfig);
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
    describe('#removeOrder', async () => {
        it('should successfully remove existing order', async () => {
            signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerAssetData,
                takerAssetData,
                makerAddress,
                takerAddress,
                fillableAmount,
            );
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
            await orderWatcher.addOrderAsync(signedOrder);
            expect((orderWatcher as any)._orderByOrderHash).to.include({
                [orderHash]: signedOrder,
            });
            const dependentOrderHashesTracker = (orderWatcher as any)
                ._dependentOrderHashesTracker as DependentOrderHashesTracker;
            let orderHashesByERC20ByMakerAddress: OrderHashesByERC20ByMakerAddress = (dependentOrderHashesTracker as any)
                ._orderHashesByERC20ByMakerAddress;
            expect(orderHashesByERC20ByMakerAddress[signedOrder.makerAddress][makerTokenAddress]).to.have.keys(
                orderHash,
            );
            orderWatcher.removeOrder(orderHash);
            expect((orderWatcher as any)._orderByOrderHash).to.not.include({
                [orderHash]: signedOrder,
            });
            orderHashesByERC20ByMakerAddress = (dependentOrderHashesTracker as any)._orderHashesByERC20ByMakerAddress;
            expect(orderHashesByERC20ByMakerAddress[signedOrder.makerAddress]).to.be.undefined();
        });
        it('should no-op when removing a non-existing order', async () => {
            signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerAssetData,
                takerAssetData,
                makerAddress,
                takerAddress,
                fillableAmount,
            );
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
            const nonExistentOrderHash = `0x${orderHash
                .substr(2)
                .split('')
                .reverse()
                .join('')}`;
            orderWatcher.removeOrder(nonExistentOrderHash);
        });
    });
    describe('#subscribe', async () => {
        afterEach(async () => {
            orderWatcher.unsubscribe();
        });
        it('should fail when trying to subscribe twice', async () => {
            orderWatcher.subscribe(_.noop.bind(_));
            expect(() => orderWatcher.subscribe(_.noop.bind(_))).to.throw(OrderWatcherError.SubscriptionAlreadyPresent);
        });
    });
    describe('#getStats', async () => {
        it('orderCount should increment and decrement with order additions and removals', async () => {
            signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerAssetData,
                takerAssetData,
                makerAddress,
                takerAddress,
                fillableAmount,
            );
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
            expect(orderWatcher.getStats().orderCount).to.be.eq(0);
            await orderWatcher.addOrderAsync(signedOrder);
            expect(orderWatcher.getStats().orderCount).to.be.eq(1);
            orderWatcher.removeOrder(orderHash);
            expect(orderWatcher.getStats().orderCount).to.be.eq(0);
        });
    });
    describe('tests with cleanup', async () => {
        afterEach(async () => {
            orderWatcher.unsubscribe();
            const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
            orderWatcher.removeOrder(orderHash);
        });
        it('should emit orderStateInvalid when makerAddress allowance set to 0 for watched order', (done: DoneCallback) => {
            (async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerAssetData,
                    takerAssetData,
                    makerAddress,
                    takerAddress,
                    fillableAmount,
                );
                const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
                await orderWatcher.addOrderAsync(signedOrder);
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                    expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.InsufficientMakerAllowance);
                });
                orderWatcher.subscribe(callback);
                await contractWrappers.erc20Token.setProxyAllowanceAsync(
                    makerTokenAddress,
                    makerAddress,
                    new BigNumber(0),
                );
            })().catch(done);
        });
        it('should not emit an orderState event when irrelevant Transfer event received', (done: DoneCallback) => {
            (async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerAssetData,
                    takerAssetData,
                    makerAddress,
                    takerAddress,
                    fillableAmount,
                );
                await orderWatcher.addOrderAsync(signedOrder);
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((_orderState: OrderState) => {
                    throw new Error('OrderState callback fired for irrelevant order');
                });
                orderWatcher.subscribe(callback);
                const notTheMaker = userAddresses[0];
                const anyRecipient = takerAddress;
                const transferAmount = new BigNumber(2);
                await contractWrappers.erc20Token.transferAsync(
                    makerTokenAddress,
                    notTheMaker,
                    anyRecipient,
                    transferAmount,
                );
                setTimeout(() => {
                    done();
                }, TIMEOUT_MS);
            })().catch(done);
        });
        it('should emit orderStateInvalid when makerAddress moves balance backing watched order', (done: DoneCallback) => {
            (async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerAssetData,
                    takerAssetData,
                    makerAddress,
                    takerAddress,
                    fillableAmount,
                );
                const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
                await orderWatcher.addOrderAsync(signedOrder);
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                    expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.InsufficientMakerBalance);
                });
                orderWatcher.subscribe(callback);
                const anyRecipient = takerAddress;
                const makerBalance = await contractWrappers.erc20Token.getBalanceAsync(makerTokenAddress, makerAddress);
                await contractWrappers.erc20Token.transferAsync(
                    makerTokenAddress,
                    makerAddress,
                    anyRecipient,
                    makerBalance,
                );
            })().catch(done);
        });
        it('should emit orderStateInvalid when watched order fully filled', (done: DoneCallback) => {
            (async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerAssetData,
                    takerAssetData,
                    makerAddress,
                    takerAddress,
                    fillableAmount,
                );
                const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
                await orderWatcher.addOrderAsync(signedOrder);

                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                    expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.OrderRemainingFillAmountZero);
                });
                orderWatcher.subscribe(callback);

                await contractWrappers.exchange.fillOrderAsync(signedOrder, fillableAmount, takerAddress);
            })().catch(done);
        });
        it('should include transactionHash in emitted orderStateInvalid when watched order fully filled', (done: DoneCallback) => {
            (async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerAssetData,
                    takerAssetData,
                    makerAddress,
                    takerAddress,
                    fillableAmount,
                );
                await orderWatcher.addOrderAsync(signedOrder);

                let transactionHash: string;
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.transactionHash).to.be.equal(transactionHash);
                });
                orderWatcher.subscribe(callback);

                transactionHash = await contractWrappers.exchange.fillOrderAsync(
                    signedOrder,
                    fillableAmount,
                    takerAddress,
                );
            })().catch(done);
        });
        it('should emit orderStateValid when watched order partially filled', (done: DoneCallback) => {
            (async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerAssetData,
                    takerAssetData,
                    makerAddress,
                    takerAddress,
                    fillableAmount,
                );

                const makerBalance = await contractWrappers.erc20Token.getBalanceAsync(makerTokenAddress, makerAddress);
                const fillAmountInBaseUnits = new BigNumber(2);
                const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
                await orderWatcher.addOrderAsync(signedOrder);

                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.true();
                    const validOrderState = orderState as OrderStateValid;
                    expect(validOrderState.orderHash).to.be.equal(orderHash);
                    const orderRelevantState = validOrderState.orderRelevantState;
                    const remainingMakerBalance = makerBalance.sub(fillAmountInBaseUnits);
                    const remainingFillable = fillableAmount.minus(fillAmountInBaseUnits);
                    expect(orderRelevantState.remainingFillableMakerAssetAmount).to.be.bignumber.equal(
                        remainingFillable,
                    );
                    expect(orderRelevantState.remainingFillableTakerAssetAmount).to.be.bignumber.equal(
                        remainingFillable,
                    );
                    expect(orderRelevantState.makerBalance).to.be.bignumber.equal(remainingMakerBalance);
                });
                orderWatcher.subscribe(callback);
                await contractWrappers.exchange.fillOrderAsync(signedOrder, fillAmountInBaseUnits, takerAddress);
            })().catch(done);
        });
        it('should trigger the callback when orders backing ZRX allowance changes', (done: DoneCallback) => {
            (async () => {
                const makerFee = EthRPCClient.toBaseUnitAmount(new BigNumber(2), decimals);
                const takerFee = EthRPCClient.toBaseUnitAmount(new BigNumber(0), decimals);
                signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                    makerAssetData,
                    takerAssetData,
                    makerFee,
                    takerFee,
                    makerAddress,
                    takerAddress,
                    fillableAmount,
                    takerAddress,
                );
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)();
                await orderWatcher.addOrderAsync(signedOrder);
                orderWatcher.subscribe(callback);
                await contractWrappers.erc20Token.setProxyAllowanceAsync(
                    zrxTokenAddress,
                    makerAddress,
                    new BigNumber(0),
                );
            })().catch(done);
        });
        describe('remainingFillable(M|T)akerTokenAmount', () => {
            it('should calculate correct remaining fillable', (done: DoneCallback) => {
                (async () => {
                    const takerFillableAmount = EthRPCClient.toBaseUnitAmount(new BigNumber(10), decimals);
                    const makerFillableAmount = EthRPCClient.toBaseUnitAmount(new BigNumber(20), decimals);
                    signedOrder = await fillScenarios.createAsymmetricFillableSignedOrderAsync(
                        makerAssetData,
                        takerAssetData,
                        makerAddress,
                        takerAddress,
                        makerFillableAmount,
                        takerFillableAmount,
                    );
                    const fillAmountInBaseUnits = EthRPCClient.toBaseUnitAmount(new BigNumber(2), decimals);
                    const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
                    await orderWatcher.addOrderAsync(signedOrder);
                    const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                        expect(orderState.isValid).to.be.true();
                        const validOrderState = orderState as OrderStateValid;
                        expect(validOrderState.orderHash).to.be.equal(orderHash);
                        const orderRelevantState = validOrderState.orderRelevantState;
                        expect(orderRelevantState.remainingFillableMakerAssetAmount).to.be.bignumber.equal(
                            EthRPCClient.toBaseUnitAmount(new BigNumber(16), decimals),
                        );
                        expect(orderRelevantState.remainingFillableTakerAssetAmount).to.be.bignumber.equal(
                            EthRPCClient.toBaseUnitAmount(new BigNumber(8), decimals),
                        );
                    });
                    orderWatcher.subscribe(callback);
                    await contractWrappers.exchange.fillOrderAsync(signedOrder, fillAmountInBaseUnits, takerAddress);
                })().catch(done);
            });
            it('should equal approved amount when approved amount is lowest', (done: DoneCallback) => {
                (async () => {
                    signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerAssetData,
                        takerAssetData,
                        makerAddress,
                        takerAddress,
                        fillableAmount,
                    );

                    const changedMakerApprovalAmount = EthRPCClient.toBaseUnitAmount(new BigNumber(3), decimals);
                    await orderWatcher.addOrderAsync(signedOrder);

                    const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                        const validOrderState = orderState as OrderStateValid;
                        const orderRelevantState = validOrderState.orderRelevantState;
                        expect(orderRelevantState.remainingFillableMakerAssetAmount).to.be.bignumber.equal(
                            changedMakerApprovalAmount,
                        );
                        expect(orderRelevantState.remainingFillableTakerAssetAmount).to.be.bignumber.equal(
                            changedMakerApprovalAmount,
                        );
                    });
                    orderWatcher.subscribe(callback);
                    await contractWrappers.erc20Token.setProxyAllowanceAsync(
                        makerTokenAddress,
                        makerAddress,
                        changedMakerApprovalAmount,
                    );
                })().catch(done);
            });
            it('should equal balance amount when balance amount is lowest', (done: DoneCallback) => {
                (async () => {
                    signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerAssetData,
                        takerAssetData,
                        makerAddress,
                        takerAddress,
                        fillableAmount,
                    );

                    const makerBalance = await contractWrappers.erc20Token.getBalanceAsync(
                        makerTokenAddress,
                        makerAddress,
                    );

                    const remainingAmount = EthRPCClient.toBaseUnitAmount(new BigNumber(1), decimals);
                    const transferAmount = makerBalance.sub(remainingAmount);
                    await orderWatcher.addOrderAsync(signedOrder);

                    const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                        expect(orderState.isValid).to.be.true();
                        const validOrderState = orderState as OrderStateValid;
                        const orderRelevantState = validOrderState.orderRelevantState;
                        expect(orderRelevantState.remainingFillableMakerAssetAmount).to.be.bignumber.equal(
                            remainingAmount,
                        );
                        expect(orderRelevantState.remainingFillableTakerAssetAmount).to.be.bignumber.equal(
                            remainingAmount,
                        );
                    });
                    orderWatcher.subscribe(callback);
                    await contractWrappers.erc20Token.transferAsync(
                        makerTokenAddress,
                        makerAddress,
                        constants.NULL_ADDRESS,
                        transferAmount,
                    );
                })().catch(done);
            });
            it('should equal ratio amount when fee balance is lowered', (done: DoneCallback) => {
                (async () => {
                    const takerFee = EthRPCClient.toBaseUnitAmount(new BigNumber(0), decimals);
                    const makerFee = EthRPCClient.toBaseUnitAmount(new BigNumber(5), decimals);
                    signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                        makerAssetData,
                        takerAssetData,
                        makerFee,
                        takerFee,
                        makerAddress,
                        takerAddress,
                        fillableAmount,
                        feeRecipient,
                    );

                    const remainingFeeAmount = EthRPCClient.toBaseUnitAmount(new BigNumber(3), decimals);

                    const remainingTokenAmount = EthRPCClient.toBaseUnitAmount(new BigNumber(4), decimals);
                    const transferTokenAmount = makerFee.sub(remainingTokenAmount);
                    await orderWatcher.addOrderAsync(signedOrder);

                    const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                        const validOrderState = orderState as OrderStateValid;
                        const orderRelevantState = validOrderState.orderRelevantState;
                        expect(orderRelevantState.remainingFillableMakerAssetAmount).to.be.bignumber.equal(
                            remainingFeeAmount,
                        );
                    });
                    orderWatcher.subscribe(callback);
                    await contractWrappers.erc20Token.setProxyAllowanceAsync(
                        zrxTokenAddress,
                        makerAddress,
                        remainingFeeAmount,
                    );
                    await contractWrappers.erc20Token.transferAsync(
                        makerTokenAddress,
                        makerAddress,
                        constants.NULL_ADDRESS,
                        transferTokenAmount,
                    );
                })().catch(done);
            });
            it('should calculate full amount when all available and non-divisible', (done: DoneCallback) => {
                (async () => {
                    const takerFee = EthRPCClient.toBaseUnitAmount(new BigNumber(0), decimals);
                    const makerFee = EthRPCClient.toBaseUnitAmount(new BigNumber(2), decimals);
                    signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                        makerAssetData,
                        takerAssetData,
                        makerFee,
                        takerFee,
                        makerAddress,
                        takerAddress,
                        fillableAmount,
                        feeRecipient,
                    );

                    await orderWatcher.addOrderAsync(signedOrder);

                    const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                        const validOrderState = orderState as OrderStateValid;
                        const orderRelevantState = validOrderState.orderRelevantState;
                        expect(orderRelevantState.remainingFillableMakerAssetAmount).to.be.bignumber.equal(
                            fillableAmount,
                        );
                    });
                    orderWatcher.subscribe(callback);
                    await contractWrappers.erc20Token.setProxyAllowanceAsync(
                        makerTokenAddress,
                        makerAddress,
                        EthRPCClient.toBaseUnitAmount(new BigNumber(100), decimals),
                    );
                })().catch(done);
            });
        });
        it('should emit orderStateInvalid when watched order cancelled', (done: DoneCallback) => {
            (async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerAssetData,
                    takerAssetData,
                    makerAddress,
                    takerAddress,
                    fillableAmount,
                );
                const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
                await orderWatcher.addOrderAsync(signedOrder);

                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                    expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.OrderCancelled);
                });
                orderWatcher.subscribe(callback);
                await contractWrappers.exchange.cancelOrderAsync(signedOrder);
            })().catch(done);
        });
        it('should emit orderStateInvalid when within rounding error range after a partial fill', (done: DoneCallback) => {
            (async () => {
                const fillAmountInBaseUnits = new BigNumber(2);
                const makerAssetAmount = new BigNumber(1001);
                const takerAssetAmount = new BigNumber(3);
                signedOrder = await fillScenarios.createAsymmetricFillableSignedOrderAsync(
                    makerAssetData,
                    takerAssetData,
                    makerAddress,
                    takerAddress,
                    makerAssetAmount,
                    takerAssetAmount,
                );
                const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
                await orderWatcher.addOrderAsync(signedOrder);
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                    expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.OrderFillRoundingError);
                });
                orderWatcher.subscribe(callback);
                await contractWrappers.exchange.fillOrderAsync(signedOrder, fillAmountInBaseUnits, takerAddress);
            })().catch(done);
        });
        describe('erc721', () => {
            let makerErc721AssetData: string;
            let makerErc721TokenAddress: string;
            const tokenId = new BigNumber(42);
            [makerErc721TokenAddress] = tokenUtils.getDummyERC721TokenAddresses();
            makerErc721AssetData = assetDataUtils.encodeERC721AssetData(makerErc721TokenAddress, tokenId);
            const fillableErc721Amount = new BigNumber(1);
            it('should emit orderStateInvalid when maker allowance set to 0 for watched order', (done: DoneCallback) => {
                (async () => {
                    signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerErc721AssetData,
                        takerAssetData,
                        makerAddress,
                        takerAddress,
                        fillableErc721Amount,
                    );
                    const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
                    await orderWatcher.addOrderAsync(signedOrder);
                    const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                        expect(orderState.isValid).to.be.false();
                        const invalidOrderState = orderState as OrderStateInvalid;
                        expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                        expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.InsufficientMakerAllowance);
                    });
                    orderWatcher.subscribe(callback);
                    await contractWrappers.erc721Token.setApprovalAsync(
                        makerErc721TokenAddress,
                        constants.NULL_ADDRESS,
                        tokenId,
                    );
                })().catch(done);
            });
            it('should emit orderStateInvalid when maker allowance for all set to 0 for watched order', (done: DoneCallback) => {
                (async () => {
                    signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerErc721AssetData,
                        takerAssetData,
                        makerAddress,
                        takerAddress,
                        fillableErc721Amount,
                    );
                    await contractWrappers.erc721Token.setApprovalAsync(
                        makerErc721TokenAddress,
                        constants.NULL_ADDRESS,
                        tokenId,
                    );
                    let isApproved = true;
                    await contractWrappers.erc721Token.setProxyApprovalForAllAsync(
                        makerErc721TokenAddress,
                        makerAddress,
                        isApproved,
                    );
                    const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
                    await orderWatcher.addOrderAsync(signedOrder);
                    const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                        expect(orderState.isValid).to.be.false();
                        const invalidOrderState = orderState as OrderStateInvalid;
                        expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                        expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.InsufficientMakerAllowance);
                    });
                    orderWatcher.subscribe(callback);
                    isApproved = false;
                    await contractWrappers.erc721Token.setProxyApprovalForAllAsync(
                        makerErc721TokenAddress,
                        makerAddress,
                        isApproved,
                    );
                })().catch(done);
            });
            it('should emit orderStateInvalid when maker moves NFT backing watched order', (done: DoneCallback) => {
                (async () => {
                    signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerErc721AssetData,
                        takerAssetData,
                        makerAddress,
                        takerAddress,
                        fillableErc721Amount,
                    );
                    const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
                    await orderWatcher.addOrderAsync(signedOrder);
                    const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                        expect(orderState.isValid).to.be.false();
                        const invalidOrderState = orderState as OrderStateInvalid;
                        expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                        expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.InsufficientMakerBalance);
                    });
                    orderWatcher.subscribe(callback);
                    await contractWrappers.erc721Token.transferFromAsync(
                        makerErc721TokenAddress,
                        coinbase,
                        makerAddress,
                        tokenId,
                    );
                })().catch(done);
            });
        });
    });
}); // tslint:disable:max-file-line-count
