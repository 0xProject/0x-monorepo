// tslint:disable:no-unnecessary-type-assertion
import { BlockParamLiteral, ContractWrappers } from '@0xproject/contract-wrappers';
import { tokenUtils } from '@0xproject/contract-wrappers/lib/test/utils/token_utils';
import { BlockchainLifecycle, callbackErrorReporter } from '@0xproject/dev-utils';
import { FillScenarios } from '@0xproject/fill-scenarios';
import { assetProxyUtils, orderHashUtils } from '@0xproject/order-utils';
import {
    DoneCallback,
    ExchangeContractErrs,
    OrderState,
    OrderStateInvalid,
    OrderStateValid,
    SignedOrder,
} from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
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
import { provider, web3Wrapper } from './utils/web3_wrapper';

const TIMEOUT_MS = 150;

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('OrderWatcher', () => {
    const networkId = constants.TESTRPC_NETWORK_ID;
    const config = { networkId };
    const contractWrappers = new ContractWrappers(provider, config);
    let fillScenarios: FillScenarios;
    let userAddresses: string[];
    let zrxTokenAddress: string;
    let exchangeContractAddress: string;
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
    const fillableAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(5), decimals);
    before(async () => {
        await blockchainLifecycle.startAsync();
        const erc20ProxyAddress = contractWrappers.erc20Proxy.getContractAddress();
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        zrxTokenAddress = tokenUtils.getProtocolTokenAddress();
        exchangeContractAddress = contractWrappers.exchange.getContractAddress();
        fillScenarios = new FillScenarios(
            provider,
            userAddresses,
            zrxTokenAddress,
            exchangeContractAddress,
            erc20ProxyAddress,
        );
        [coinbase, makerAddress, takerAddress, feeRecipient] = userAddresses;
        [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        [makerAssetData, takerAssetData] = [
            assetProxyUtils.encodeERC20AssetData(makerTokenAddress),
            assetProxyUtils.encodeERC20AssetData(takerTokenAddress),
        ];
        const orderWatcherConfig = { stateLayer: BlockParamLiteral.Latest };
        orderWatcher = new OrderWatcher(provider, networkId, orderWatcherConfig);
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
            orderWatcher.addOrder(signedOrder);
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
            orderWatcher.subscribe(_.noop);
            expect(() => orderWatcher.subscribe(_.noop)).to.throw(OrderWatcherError.SubscriptionAlreadyPresent);
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
                orderWatcher.addOrder(signedOrder);
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
                orderWatcher.addOrder(signedOrder);
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
                orderWatcher.addOrder(signedOrder);
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
                orderWatcher.addOrder(signedOrder);

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
                orderWatcher.addOrder(signedOrder);

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
                const makerFee = Web3Wrapper.toBaseUnitAmount(new BigNumber(2), decimals);
                const takerFee = Web3Wrapper.toBaseUnitAmount(new BigNumber(0), decimals);
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
                orderWatcher.addOrder(signedOrder);
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
                    const takerFillableAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(10), decimals);
                    const makerFillableAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(20), decimals);
                    signedOrder = await fillScenarios.createAsymmetricFillableSignedOrderAsync(
                        makerAssetData,
                        takerAssetData,
                        makerAddress,
                        takerAddress,
                        makerFillableAmount,
                        takerFillableAmount,
                    );
                    const fillAmountInBaseUnits = Web3Wrapper.toBaseUnitAmount(new BigNumber(2), decimals);
                    const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
                    orderWatcher.addOrder(signedOrder);
                    const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                        expect(orderState.isValid).to.be.true();
                        const validOrderState = orderState as OrderStateValid;
                        expect(validOrderState.orderHash).to.be.equal(orderHash);
                        const orderRelevantState = validOrderState.orderRelevantState;
                        expect(orderRelevantState.remainingFillableMakerAssetAmount).to.be.bignumber.equal(
                            Web3Wrapper.toBaseUnitAmount(new BigNumber(16), decimals),
                        );
                        expect(orderRelevantState.remainingFillableTakerAssetAmount).to.be.bignumber.equal(
                            Web3Wrapper.toBaseUnitAmount(new BigNumber(8), decimals),
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

                    const changedMakerApprovalAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(3), decimals);
                    orderWatcher.addOrder(signedOrder);

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

                    const remainingAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(1), decimals);
                    const transferAmount = makerBalance.sub(remainingAmount);
                    orderWatcher.addOrder(signedOrder);

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
                    const takerFee = Web3Wrapper.toBaseUnitAmount(new BigNumber(0), decimals);
                    const makerFee = Web3Wrapper.toBaseUnitAmount(new BigNumber(5), decimals);
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

                    const remainingFeeAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(3), decimals);

                    const remainingTokenAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(4), decimals);
                    const transferTokenAmount = makerFee.sub(remainingTokenAmount);
                    orderWatcher.addOrder(signedOrder);

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
                    const takerFee = Web3Wrapper.toBaseUnitAmount(new BigNumber(0), decimals);
                    const makerFee = Web3Wrapper.toBaseUnitAmount(new BigNumber(2), decimals);
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

                    orderWatcher.addOrder(signedOrder);

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
                        Web3Wrapper.toBaseUnitAmount(new BigNumber(100), decimals),
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
                orderWatcher.addOrder(signedOrder);

                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                    expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.OrderFillRoundingError);
                });
                orderWatcher.subscribe(callback);
                await contractWrappers.exchange.cancelOrderAsync(signedOrder);
            })().catch(done);
        });
        it('should emit orderStateInvalid when within rounding error range', (done: DoneCallback) => {
            (async () => {
                const remainingFillableAmountInBaseUnits = new BigNumber(100);
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerAssetData,
                    takerAssetData,
                    makerAddress,
                    takerAddress,
                    fillableAmount,
                );
                const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
                orderWatcher.addOrder(signedOrder);

                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                    expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.OrderFillRoundingError);
                });
                orderWatcher.subscribe(callback);
                await contractWrappers.exchange.fillOrderAsync(
                    signedOrder,
                    fillableAmount.minus(remainingFillableAmountInBaseUnits),
                    takerAddress,
                );
            })().catch(done);
        });
    });
}); // tslint:disable:max-file-line-count
