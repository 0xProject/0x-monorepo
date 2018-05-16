import { ContractWrappers } from '@0xproject/contract-wrappers';
import { BlockchainLifecycle, callbackErrorReporter, devConstants } from '@0xproject/dev-utils';
import { FillScenarios } from '@0xproject/fill-scenarios';
import { getOrderHashHex } from '@0xproject/order-utils';
import {
    DoneCallback,
    ExchangeContractErrs,
    OrderState,
    OrderStateInvalid,
    OrderStateValid,
    SignedOrder,
    Token,
} from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';

import { OrderWatcher } from '../src/order_watcher/order_watcher';
import { OrderWatcherError } from '../src/types';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { TokenUtils } from './utils/token_utils';
import { provider, web3Wrapper } from './utils/web3_wrapper';

const TIMEOUT_MS = 150;

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('OrderWatcher', () => {
    let contractWrappers: ContractWrappers;
    let tokens: Token[];
    let tokenUtils: TokenUtils;
    let fillScenarios: FillScenarios;
    let userAddresses: string[];
    let zrxTokenAddress: string;
    let exchangeContractAddress: string;
    let makerToken: Token;
    let takerToken: Token;
    let maker: string;
    let taker: string;
    let signedOrder: SignedOrder;
    let orderWatcher: OrderWatcher;
    const config = {
        networkId: constants.TESTRPC_NETWORK_ID,
    };
    const decimals = constants.ZRX_DECIMALS;
    const fillableAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(5), decimals);
    before(async () => {
        contractWrappers = new ContractWrappers(provider, config);
        const networkId = await web3Wrapper.getNetworkIdAsync();
        orderWatcher = new OrderWatcher(provider, constants.TESTRPC_NETWORK_ID);
        exchangeContractAddress = contractWrappers.exchange.getContractAddress();
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        [, maker, taker] = userAddresses;
        tokens = await contractWrappers.tokenRegistry.getTokensAsync();
        tokenUtils = new TokenUtils(tokens);
        zrxTokenAddress = tokenUtils.getProtocolTokenOrThrow().address;
        fillScenarios = new FillScenarios(provider, userAddresses, tokens, zrxTokenAddress, exchangeContractAddress);
        await fillScenarios.initTokenBalancesAsync();
        [makerToken, takerToken] = tokenUtils.getDummyTokens();
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
                makerToken.address,
                takerToken.address,
                maker,
                taker,
                fillableAmount,
            );
            const orderHash = getOrderHashHex(signedOrder);
            orderWatcher.addOrder(signedOrder);
            expect((orderWatcher as any)._orderByOrderHash).to.include({
                [orderHash]: signedOrder,
            });
            let dependentOrderHashes = (orderWatcher as any)._dependentOrderHashes;
            expect(dependentOrderHashes[signedOrder.maker][signedOrder.makerTokenAddress]).to.have.keys(orderHash);
            orderWatcher.removeOrder(orderHash);
            expect((orderWatcher as any)._orderByOrderHash).to.not.include({
                [orderHash]: signedOrder,
            });
            dependentOrderHashes = (orderWatcher as any)._dependentOrderHashes;
            expect(dependentOrderHashes[signedOrder.maker]).to.be.undefined();
        });
        it('should no-op when removing a non-existing order', async () => {
            signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerToken.address,
                takerToken.address,
                maker,
                taker,
                fillableAmount,
            );
            const orderHash = getOrderHashHex(signedOrder);
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
            const orderHash = getOrderHashHex(signedOrder);
            orderWatcher.removeOrder(orderHash);
        });
        it('should emit orderStateInvalid when maker allowance set to 0 for watched order', (done: DoneCallback) => {
            (async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerToken.address,
                    takerToken.address,
                    maker,
                    taker,
                    fillableAmount,
                );
                const orderHash = getOrderHashHex(signedOrder);
                orderWatcher.addOrder(signedOrder);
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                    expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.InsufficientMakerAllowance);
                });
                orderWatcher.subscribe(callback);
                await contractWrappers.token.setProxyAllowanceAsync(makerToken.address, maker, new BigNumber(0));
            })().catch(done);
        });
        it('should not emit an orderState event when irrelevant Transfer event received', (done: DoneCallback) => {
            (async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerToken.address,
                    takerToken.address,
                    maker,
                    taker,
                    fillableAmount,
                );
                orderWatcher.addOrder(signedOrder);
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                    throw new Error('OrderState callback fired for irrelevant order');
                });
                orderWatcher.subscribe(callback);
                const notTheMaker = userAddresses[0];
                const anyRecipient = taker;
                const transferAmount = new BigNumber(2);
                await contractWrappers.token.transferAsync(
                    makerToken.address,
                    notTheMaker,
                    anyRecipient,
                    transferAmount,
                );
                setTimeout(() => {
                    done();
                }, TIMEOUT_MS);
            })().catch(done);
        });
        it('should emit orderStateInvalid when maker moves balance backing watched order', (done: DoneCallback) => {
            (async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerToken.address,
                    takerToken.address,
                    maker,
                    taker,
                    fillableAmount,
                );
                const orderHash = getOrderHashHex(signedOrder);
                orderWatcher.addOrder(signedOrder);
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                    expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.InsufficientMakerBalance);
                });
                orderWatcher.subscribe(callback);
                const anyRecipient = taker;
                const makerBalance = await contractWrappers.token.getBalanceAsync(makerToken.address, maker);
                await contractWrappers.token.transferAsync(makerToken.address, maker, anyRecipient, makerBalance);
            })().catch(done);
        });
        it('should emit orderStateInvalid when watched order fully filled', (done: DoneCallback) => {
            (async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerToken.address,
                    takerToken.address,
                    maker,
                    taker,
                    fillableAmount,
                );
                const orderHash = getOrderHashHex(signedOrder);
                orderWatcher.addOrder(signedOrder);

                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                    expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.OrderRemainingFillAmountZero);
                });
                orderWatcher.subscribe(callback);

                const shouldThrowOnInsufficientBalanceOrAllowance = true;
                await contractWrappers.exchange.fillOrderAsync(
                    signedOrder,
                    fillableAmount,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    taker,
                );
            })().catch(done);
        });
        it('should emit orderStateValid when watched order partially filled', (done: DoneCallback) => {
            (async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerToken.address,
                    takerToken.address,
                    maker,
                    taker,
                    fillableAmount,
                );

                const makerBalance = await contractWrappers.token.getBalanceAsync(makerToken.address, maker);
                const fillAmountInBaseUnits = new BigNumber(2);
                const orderHash = getOrderHashHex(signedOrder);
                orderWatcher.addOrder(signedOrder);

                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.true();
                    const validOrderState = orderState as OrderStateValid;
                    expect(validOrderState.orderHash).to.be.equal(orderHash);
                    const orderRelevantState = validOrderState.orderRelevantState;
                    const remainingMakerBalance = makerBalance.sub(fillAmountInBaseUnits);
                    const remainingFillable = fillableAmount.minus(fillAmountInBaseUnits);
                    expect(orderRelevantState.remainingFillableMakerTokenAmount).to.be.bignumber.equal(
                        remainingFillable,
                    );
                    expect(orderRelevantState.remainingFillableTakerTokenAmount).to.be.bignumber.equal(
                        remainingFillable,
                    );
                    expect(orderRelevantState.makerBalance).to.be.bignumber.equal(remainingMakerBalance);
                });
                orderWatcher.subscribe(callback);
                const shouldThrowOnInsufficientBalanceOrAllowance = true;
                await contractWrappers.exchange.fillOrderAsync(
                    signedOrder,
                    fillAmountInBaseUnits,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    taker,
                );
            })().catch(done);
        });
        it('should trigger the callback when orders backing ZRX allowance changes', (done: DoneCallback) => {
            (async () => {
                const makerFee = Web3Wrapper.toBaseUnitAmount(new BigNumber(2), decimals);
                const takerFee = Web3Wrapper.toBaseUnitAmount(new BigNumber(0), decimals);
                signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                    makerToken.address,
                    takerToken.address,
                    makerFee,
                    takerFee,
                    maker,
                    taker,
                    fillableAmount,
                    taker,
                );
                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)();
                orderWatcher.addOrder(signedOrder);
                orderWatcher.subscribe(callback);
                await contractWrappers.token.setProxyAllowanceAsync(zrxTokenAddress, maker, new BigNumber(0));
            })().catch(done);
        });
        describe('remainingFillable(M|T)akerTokenAmount', () => {
            it('should calculate correct remaining fillable', (done: DoneCallback) => {
                (async () => {
                    const takerFillableAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(10), decimals);
                    const makerFillableAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(20), decimals);
                    signedOrder = await fillScenarios.createAsymmetricFillableSignedOrderAsync(
                        makerToken.address,
                        takerToken.address,
                        maker,
                        taker,
                        makerFillableAmount,
                        takerFillableAmount,
                    );
                    const fillAmountInBaseUnits = Web3Wrapper.toBaseUnitAmount(new BigNumber(2), decimals);
                    const orderHash = getOrderHashHex(signedOrder);
                    orderWatcher.addOrder(signedOrder);
                    const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                        expect(orderState.isValid).to.be.true();
                        const validOrderState = orderState as OrderStateValid;
                        expect(validOrderState.orderHash).to.be.equal(orderHash);
                        const orderRelevantState = validOrderState.orderRelevantState;
                        expect(orderRelevantState.remainingFillableMakerTokenAmount).to.be.bignumber.equal(
                            Web3Wrapper.toBaseUnitAmount(new BigNumber(16), decimals),
                        );
                        expect(orderRelevantState.remainingFillableTakerTokenAmount).to.be.bignumber.equal(
                            Web3Wrapper.toBaseUnitAmount(new BigNumber(8), decimals),
                        );
                    });
                    orderWatcher.subscribe(callback);
                    const shouldThrowOnInsufficientBalanceOrAllowance = true;
                    await contractWrappers.exchange.fillOrderAsync(
                        signedOrder,
                        fillAmountInBaseUnits,
                        shouldThrowOnInsufficientBalanceOrAllowance,
                        taker,
                    );
                })().catch(done);
            });
            it('should equal approved amount when approved amount is lowest', (done: DoneCallback) => {
                (async () => {
                    signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerToken.address,
                        takerToken.address,
                        maker,
                        taker,
                        fillableAmount,
                    );

                    const changedMakerApprovalAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(3), decimals);
                    orderWatcher.addOrder(signedOrder);

                    const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                        const validOrderState = orderState as OrderStateValid;
                        const orderRelevantState = validOrderState.orderRelevantState;
                        expect(orderRelevantState.remainingFillableMakerTokenAmount).to.be.bignumber.equal(
                            changedMakerApprovalAmount,
                        );
                        expect(orderRelevantState.remainingFillableTakerTokenAmount).to.be.bignumber.equal(
                            changedMakerApprovalAmount,
                        );
                    });
                    orderWatcher.subscribe(callback);
                    await contractWrappers.token.setProxyAllowanceAsync(
                        makerToken.address,
                        maker,
                        changedMakerApprovalAmount,
                    );
                })().catch(done);
            });
            it('should equal balance amount when balance amount is lowest', (done: DoneCallback) => {
                (async () => {
                    signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerToken.address,
                        takerToken.address,
                        maker,
                        taker,
                        fillableAmount,
                    );

                    const makerBalance = await contractWrappers.token.getBalanceAsync(makerToken.address, maker);

                    const remainingAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(1), decimals);
                    const transferAmount = makerBalance.sub(remainingAmount);
                    orderWatcher.addOrder(signedOrder);

                    const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                        expect(orderState.isValid).to.be.true();
                        const validOrderState = orderState as OrderStateValid;
                        const orderRelevantState = validOrderState.orderRelevantState;
                        expect(orderRelevantState.remainingFillableMakerTokenAmount).to.be.bignumber.equal(
                            remainingAmount,
                        );
                        expect(orderRelevantState.remainingFillableTakerTokenAmount).to.be.bignumber.equal(
                            remainingAmount,
                        );
                    });
                    orderWatcher.subscribe(callback);
                    await contractWrappers.token.transferAsync(
                        makerToken.address,
                        maker,
                        constants.NULL_ADDRESS,
                        transferAmount,
                    );
                })().catch(done);
            });
            it('should equal remaining amount when partially cancelled and order has fees', (done: DoneCallback) => {
                (async () => {
                    const takerFee = Web3Wrapper.toBaseUnitAmount(new BigNumber(0), decimals);
                    const makerFee = Web3Wrapper.toBaseUnitAmount(new BigNumber(5), decimals);
                    const feeRecipient = taker;
                    signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                        makerToken.address,
                        takerToken.address,
                        makerFee,
                        takerFee,
                        maker,
                        taker,
                        fillableAmount,
                        feeRecipient,
                    );

                    const remainingTokenAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(4), decimals);
                    const transferTokenAmount = makerFee.sub(remainingTokenAmount);
                    orderWatcher.addOrder(signedOrder);

                    const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                        expect(orderState.isValid).to.be.true();
                        const validOrderState = orderState as OrderStateValid;
                        const orderRelevantState = validOrderState.orderRelevantState;
                        expect(orderRelevantState.remainingFillableMakerTokenAmount).to.be.bignumber.equal(
                            remainingTokenAmount,
                        );
                    });
                    orderWatcher.subscribe(callback);
                    await contractWrappers.exchange.cancelOrderAsync(signedOrder, transferTokenAmount);
                })().catch(done);
            });
            it('should equal ratio amount when fee balance is lowered', (done: DoneCallback) => {
                (async () => {
                    const takerFee = Web3Wrapper.toBaseUnitAmount(new BigNumber(0), decimals);
                    const makerFee = Web3Wrapper.toBaseUnitAmount(new BigNumber(5), decimals);
                    const feeRecipient = taker;
                    signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                        makerToken.address,
                        takerToken.address,
                        makerFee,
                        takerFee,
                        maker,
                        taker,
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
                        expect(orderRelevantState.remainingFillableMakerTokenAmount).to.be.bignumber.equal(
                            remainingFeeAmount,
                        );
                    });
                    orderWatcher.subscribe(callback);
                    await contractWrappers.token.setProxyAllowanceAsync(zrxTokenAddress, maker, remainingFeeAmount);
                    await contractWrappers.token.transferAsync(
                        makerToken.address,
                        maker,
                        constants.NULL_ADDRESS,
                        transferTokenAmount,
                    );
                })().catch(done);
            });
            it('should calculate full amount when all available and non-divisible', (done: DoneCallback) => {
                (async () => {
                    const takerFee = Web3Wrapper.toBaseUnitAmount(new BigNumber(0), decimals);
                    const makerFee = Web3Wrapper.toBaseUnitAmount(new BigNumber(2), decimals);
                    const feeRecipient = taker;
                    signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                        makerToken.address,
                        takerToken.address,
                        makerFee,
                        takerFee,
                        maker,
                        taker,
                        fillableAmount,
                        feeRecipient,
                    );

                    orderWatcher.addOrder(signedOrder);

                    const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                        const validOrderState = orderState as OrderStateValid;
                        const orderRelevantState = validOrderState.orderRelevantState;
                        expect(orderRelevantState.remainingFillableMakerTokenAmount).to.be.bignumber.equal(
                            fillableAmount,
                        );
                    });
                    orderWatcher.subscribe(callback);
                    await contractWrappers.token.setProxyAllowanceAsync(
                        makerToken.address,
                        maker,
                        Web3Wrapper.toBaseUnitAmount(new BigNumber(100), decimals),
                    );
                })().catch(done);
            });
        });
        it('should emit orderStateInvalid when watched order cancelled', (done: DoneCallback) => {
            (async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerToken.address,
                    takerToken.address,
                    maker,
                    taker,
                    fillableAmount,
                );
                const orderHash = getOrderHashHex(signedOrder);
                orderWatcher.addOrder(signedOrder);

                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                    expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.OrderRemainingFillAmountZero);
                });
                orderWatcher.subscribe(callback);

                await contractWrappers.exchange.cancelOrderAsync(signedOrder, fillableAmount);
            })().catch(done);
        });
        it('should emit orderStateInvalid when within rounding error range', (done: DoneCallback) => {
            (async () => {
                const remainingFillableAmountInBaseUnits = new BigNumber(100);
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerToken.address,
                    takerToken.address,
                    maker,
                    taker,
                    fillableAmount,
                );
                const orderHash = getOrderHashHex(signedOrder);
                orderWatcher.addOrder(signedOrder);

                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                    expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.OrderFillRoundingError);
                });
                orderWatcher.subscribe(callback);
                await contractWrappers.exchange.cancelOrderAsync(
                    signedOrder,
                    fillableAmount.minus(remainingFillableAmountInBaseUnits),
                );
            })().catch(done);
        });
        it('should emit orderStateValid when watched order partially cancelled', (done: DoneCallback) => {
            (async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerToken.address,
                    takerToken.address,
                    maker,
                    taker,
                    fillableAmount,
                );

                const cancelAmountInBaseUnits = new BigNumber(2);
                const orderHash = getOrderHashHex(signedOrder);
                orderWatcher.addOrder(signedOrder);

                const callback = callbackErrorReporter.reportNodeCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.true();
                    const validOrderState = orderState as OrderStateValid;
                    expect(validOrderState.orderHash).to.be.equal(orderHash);
                    const orderRelevantState = validOrderState.orderRelevantState;
                    expect(orderRelevantState.cancelledTakerTokenAmount).to.be.bignumber.equal(cancelAmountInBaseUnits);
                });
                orderWatcher.subscribe(callback);
                await contractWrappers.exchange.cancelOrderAsync(signedOrder, cancelAmountInBaseUnits);
            })().catch(done);
        });
    });
}); // tslint:disable:max-file-line-count
