import 'mocha';
import * as chai from 'chai';
import * as _ from 'lodash';
import * as Web3 from 'web3';
import BigNumber from 'bignumber.js';
import {chaiSetup} from './utils/chai_setup';
import {web3Factory} from './utils/web3_factory';
import {Web3Wrapper} from '../src/web3_wrapper';
import {OrderStateWatcher} from '../src/order_watcher/order_state_watcher';
import {
    Token,
    ZeroEx,
    LogEvent,
    DecodedLogEvent,
    ZeroExConfig,
    OrderState,
    SignedOrder,
    ZeroExError,
    OrderStateValid,
    OrderStateInvalid,
    ExchangeContractErrs,
} from '../src';
import {TokenUtils} from './utils/token_utils';
import {FillScenarios} from './utils/fill_scenarios';
import {DoneCallback} from '../src/types';
import {BlockchainLifecycle} from './utils/blockchain_lifecycle';
import {reportCallbackErrors} from './utils/report_callback_errors';
import {constants as constants} from './utils/constants';

const TIMEOUT_MS = 150;

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle();

describe('OrderStateWatcher', () => {
    let web3: Web3;
    let zeroEx: ZeroEx;
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
    let web3Wrapper: Web3Wrapper;
    let signedOrder: SignedOrder;
    const decimals = constants.ZRX_DECIMALS;
    const fillableAmount = ZeroEx.toBaseUnitAmount(new BigNumber(5), decimals);
    before(async () => {
        web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3.currentProvider);
        exchangeContractAddress = await zeroEx.exchange.getContractAddressAsync();
        userAddresses = await zeroEx.getAvailableAddressesAsync();
        [, maker, taker] = userAddresses;
        tokens = await zeroEx.tokenRegistry.getTokensAsync();
        tokenUtils = new TokenUtils(tokens);
        zrxTokenAddress = tokenUtils.getProtocolTokenOrThrow().address;
        fillScenarios = new FillScenarios(zeroEx, userAddresses, tokens, zrxTokenAddress, exchangeContractAddress);
        [makerToken, takerToken] = tokenUtils.getNonProtocolTokens();
        web3Wrapper = (zeroEx as any)._web3Wrapper;
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
                makerToken.address, takerToken.address, maker, taker, fillableAmount,
            );
            const orderHash = ZeroEx.getOrderHashHex(signedOrder);
            await zeroEx.orderStateWatcher.addOrderAsync(signedOrder);
            expect((zeroEx.orderStateWatcher as any)._orderByOrderHash).to.include({
                [orderHash]: signedOrder,
            });
            let dependentOrderHashes = (zeroEx.orderStateWatcher as any)._dependentOrderHashes;
            expect(dependentOrderHashes[signedOrder.maker][signedOrder.makerTokenAddress]).to.have.keys(orderHash);
            await zeroEx.orderStateWatcher.removeOrderAsync(orderHash);
            expect((zeroEx.orderStateWatcher as any)._orderByOrderHash).to.not.include({
                [orderHash]: signedOrder,
            });
            dependentOrderHashes = (zeroEx.orderStateWatcher as any)._dependentOrderHashes;
            expect(dependentOrderHashes[signedOrder.maker]).to.be.undefined();
        });
        it('should no-op when removing a non-existing order', async () => {
            signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerToken.address, takerToken.address, maker, taker, fillableAmount,
            );
            const orderHash = ZeroEx.getOrderHashHex(signedOrder);
            const nonExistentOrderHash = `0x${orderHash.substr(2).split('').reverse().join('')}`;
            await zeroEx.orderStateWatcher.removeOrderAsync(nonExistentOrderHash);
        });
    });
    describe('#subscribe', async () => {
        afterEach(async () => {
            zeroEx.orderStateWatcher.unsubscribe();
        });
        it('should fail when trying to subscribe twice', async () => {
            zeroEx.orderStateWatcher.subscribe(_.noop);
            expect(() => zeroEx.orderStateWatcher.subscribe(_.noop))
                .to.throw(ZeroExError.SubscriptionAlreadyPresent);
        });
    });
    describe('tests with cleanup', async () => {
        afterEach(async () => {
            zeroEx.orderStateWatcher.unsubscribe();
            const orderHash = ZeroEx.getOrderHashHex(signedOrder);
            await zeroEx.orderStateWatcher.removeOrderAsync(orderHash);
        });
        it('should emit orderStateInvalid when maker allowance set to 0 for watched order', (done: DoneCallback) => {
            (async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerToken.address, takerToken.address, maker, taker, fillableAmount,
                );
                const orderHash = ZeroEx.getOrderHashHex(signedOrder);
                await zeroEx.orderStateWatcher.addOrderAsync(signedOrder);
                const callback = reportCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                    expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.InsufficientMakerAllowance);
                    done();
                });
                zeroEx.orderStateWatcher.subscribe(callback);
                await zeroEx.token.setProxyAllowanceAsync(makerToken.address, maker, new BigNumber(0));
            })().catch(done);
        });
        it('should not emit an orderState event when irrelevant Transfer event received', (done: DoneCallback) => {
            (async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerToken.address, takerToken.address, maker, taker, fillableAmount,
                );
                const orderHash = ZeroEx.getOrderHashHex(signedOrder);
                await zeroEx.orderStateWatcher.addOrderAsync(signedOrder);
                const callback = reportCallbackErrors(done)((orderState: OrderState) => {
                    throw new Error('OrderState callback fired for irrelevant order');
                });
                zeroEx.orderStateWatcher.subscribe(callback);
                const notTheMaker = userAddresses[0];
                const anyRecipient = taker;
                const transferAmount = new BigNumber(2);
                const notTheMakerBalance = await zeroEx.token.getBalanceAsync(makerToken.address, notTheMaker);
                await zeroEx.token.transferAsync(makerToken.address, notTheMaker, anyRecipient, transferAmount);
                setTimeout(() => {
                    done();
                }, TIMEOUT_MS);
            })().catch(done);
        });
        it('should emit orderStateInvalid when maker moves balance backing watched order', (done: DoneCallback) => {
            (async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerToken.address, takerToken.address, maker, taker, fillableAmount,
                );
                const orderHash = ZeroEx.getOrderHashHex(signedOrder);
                await zeroEx.orderStateWatcher.addOrderAsync(signedOrder);
                const callback = reportCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                    expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.InsufficientMakerBalance);
                    done();
                });
                zeroEx.orderStateWatcher.subscribe(callback);
                const anyRecipient = taker;
                const makerBalance = await zeroEx.token.getBalanceAsync(makerToken.address, maker);
                await zeroEx.token.transferAsync(makerToken.address, maker, anyRecipient, makerBalance);
            })().catch(done);
        });
        it('should emit orderStateInvalid when watched order fully filled', (done: DoneCallback) => {
            (async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerToken.address, takerToken.address, maker, taker, fillableAmount,
                );
                const orderHash = ZeroEx.getOrderHashHex(signedOrder);
                await zeroEx.orderStateWatcher.addOrderAsync(signedOrder);

                let eventCount = 0;
                const callback = reportCallbackErrors(done)((orderState: OrderState) => {
                    eventCount++;
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                    expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.OrderRemainingFillAmountZero);
                    if (eventCount === 2) {
                        done();
                    }
                });
                zeroEx.orderStateWatcher.subscribe(callback);

                const shouldThrowOnInsufficientBalanceOrAllowance = true;
                await zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillableAmount, shouldThrowOnInsufficientBalanceOrAllowance, taker,
                );
            })().catch(done);
        });
        it('should emit orderStateValid when watched order partially filled', (done: DoneCallback) => {
            (async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerToken.address, takerToken.address, maker, taker, fillableAmount,
                );

                const makerBalance = await zeroEx.token.getBalanceAsync(makerToken.address, maker);
                const takerBalance = await zeroEx.token.getBalanceAsync(makerToken.address, taker);

                const fillAmountInBaseUnits = new BigNumber(2);
                const orderHash = ZeroEx.getOrderHashHex(signedOrder);
                await zeroEx.orderStateWatcher.addOrderAsync(signedOrder);

                let eventCount = 0;
                const callback = reportCallbackErrors(done)((orderState: OrderState) => {
                    eventCount++;
                    expect(orderState.isValid).to.be.true();
                    const validOrderState = orderState as OrderStateValid;
                    expect(validOrderState.orderHash).to.be.equal(orderHash);
                    const orderRelevantState = validOrderState.orderRelevantState;
                    const remainingMakerBalance = makerBalance.sub(fillAmountInBaseUnits);
                    const remainingFillable = fillableAmount.minus(fillAmountInBaseUnits);
                    expect(orderRelevantState.remainingFillableMakerTokenAmount).to.be.bignumber.equal(
                        remainingFillable);
                    expect(orderRelevantState.remainingFillableTakerTokenAmount).to.be.bignumber.equal(
                        remainingFillable);
                    expect(orderRelevantState.makerBalance).to.be.bignumber.equal(remainingMakerBalance);
                    if (eventCount === 2) {
                        done();
                    }
                });
                zeroEx.orderStateWatcher.subscribe(callback);
                const shouldThrowOnInsufficientBalanceOrAllowance = true;
                await zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillAmountInBaseUnits, shouldThrowOnInsufficientBalanceOrAllowance, taker,
                );
            })().catch(done);
        });
        it('should trigger the callback when orders backing ZRX allowance changes', (done: DoneCallback) => {
            (async () => {
                const makerFee = ZeroEx.toBaseUnitAmount(new BigNumber(2), 18);
                const takerFee = ZeroEx.toBaseUnitAmount(new BigNumber(0), 18);
                signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                    makerToken.address, takerToken.address, makerFee, takerFee, maker, taker, fillableAmount,
                    taker);
                const orderHash = ZeroEx.getOrderHashHex(signedOrder);
                await zeroEx.orderStateWatcher.addOrderAsync(signedOrder);
                const callback = reportCallbackErrors(done)((orderState: OrderState) => {
                    done();
                });
                zeroEx.orderStateWatcher.subscribe(callback);
                await zeroEx.token.setProxyAllowanceAsync(zrxTokenAddress, maker, new BigNumber(0));
            })().catch(done);
        });
        describe('remainingFillable(M|T)akerTokenAmount', () => {
            it('should calculate correct remaining fillable', (done: DoneCallback) => {
                (async () => {
                    const takerFillableAmount = ZeroEx.toBaseUnitAmount(new BigNumber(10), decimals);
                    const makerFillableAmount = ZeroEx.toBaseUnitAmount(new BigNumber(20), decimals);
                    signedOrder = await fillScenarios.createAsymmetricFillableSignedOrderAsync(
                        makerToken.address, takerToken.address, maker, taker, makerFillableAmount,
                        takerFillableAmount,
                    );
                    const makerBalance = await zeroEx.token.getBalanceAsync(makerToken.address, maker);
                    const takerBalance = await zeroEx.token.getBalanceAsync(makerToken.address, taker);
                    const fillAmountInBaseUnits = ZeroEx.toBaseUnitAmount(new BigNumber(2), decimals);
                    const orderHash = ZeroEx.getOrderHashHex(signedOrder);
                    await zeroEx.orderStateWatcher.addOrderAsync(signedOrder);
                    let eventCount = 0;
                    const callback = reportCallbackErrors(done)((orderState: OrderState) => {
                        eventCount++;
                        expect(orderState.isValid).to.be.true();
                        const validOrderState = orderState as OrderStateValid;
                        expect(validOrderState.orderHash).to.be.equal(orderHash);
                        const orderRelevantState = validOrderState.orderRelevantState;
                        expect(orderRelevantState.remainingFillableMakerTokenAmount).to.be.bignumber.equal(
                            ZeroEx.toBaseUnitAmount(new BigNumber(16), decimals));
                        expect(orderRelevantState.remainingFillableTakerTokenAmount).to.be.bignumber.equal(
                            ZeroEx.toBaseUnitAmount(new BigNumber(8), decimals));
                        if (eventCount === 2) {
                            done();
                        }
                    });
                    zeroEx.orderStateWatcher.subscribe(callback);
                    const shouldThrowOnInsufficientBalanceOrAllowance = true;
                    await zeroEx.exchange.fillOrderAsync(
                        signedOrder, fillAmountInBaseUnits, shouldThrowOnInsufficientBalanceOrAllowance, taker,
                    );
                })().catch(done);
            });
            it('should equal approved amount when approved amount is lowest', (done: DoneCallback) => {
                (async () => {
                    signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerToken.address, takerToken.address, maker, taker, fillableAmount,
                    );

                    const makerBalance = await zeroEx.token.getBalanceAsync(makerToken.address, maker);

                    const changedMakerApprovalAmount = ZeroEx.toBaseUnitAmount(new BigNumber(3), decimals);
                    await zeroEx.orderStateWatcher.addOrderAsync(signedOrder);

                    const callback = reportCallbackErrors(done)((orderState: OrderState) => {
                        const validOrderState = orderState as OrderStateValid;
                        const orderRelevantState = validOrderState.orderRelevantState;
                        expect(orderRelevantState.remainingFillableMakerTokenAmount).to.be.bignumber.equal(
                            changedMakerApprovalAmount);
                        expect(orderRelevantState.remainingFillableTakerTokenAmount).to.be.bignumber.equal(
                            changedMakerApprovalAmount);
                        done();
                    });
                    zeroEx.orderStateWatcher.subscribe(callback);
                    await zeroEx.token.setProxyAllowanceAsync(makerToken.address, maker, changedMakerApprovalAmount);
                })().catch(done);
            });
            it('should equal balance amount when balance amount is lowest', (done: DoneCallback) => {
                (async () => {
                    signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerToken.address, takerToken.address, maker, taker, fillableAmount,
                    );

                    const makerBalance = await zeroEx.token.getBalanceAsync(makerToken.address, maker);

                    const remainingAmount = ZeroEx.toBaseUnitAmount(new BigNumber(1), decimals);
                    const transferAmount = makerBalance.sub(remainingAmount);
                    await zeroEx.orderStateWatcher.addOrderAsync(signedOrder);

                    const callback = reportCallbackErrors(done)((orderState: OrderState) => {
                        const validOrderState = orderState as OrderStateValid;
                        const orderRelevantState = validOrderState.orderRelevantState;
                        expect(orderRelevantState.remainingFillableMakerTokenAmount).to.be.bignumber.equal(
                            remainingAmount);
                        expect(orderRelevantState.remainingFillableTakerTokenAmount).to.be.bignumber.equal(
                            remainingAmount);
                        done();
                    });
                    zeroEx.orderStateWatcher.subscribe(callback);
                    await zeroEx.token.transferAsync(
                        makerToken.address, maker, ZeroEx.NULL_ADDRESS, transferAmount);
                })().catch(done);
            });
            it('should equal remaining amount when partially cancelled and order has fees', (done: DoneCallback) => {
                (async () => {
                    const takerFee = ZeroEx.toBaseUnitAmount(new BigNumber(0), decimals);
                    const makerFee = ZeroEx.toBaseUnitAmount(new BigNumber(5), decimals);
                    const feeRecipient = taker;
                    signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                        makerToken.address, takerToken.address, makerFee, takerFee, maker,
                        taker, fillableAmount, feeRecipient);

                    const makerBalance = await zeroEx.token.getBalanceAsync(makerToken.address, maker);

                    const remainingTokenAmount = ZeroEx.toBaseUnitAmount(new BigNumber(4), decimals);
                    const transferTokenAmount = makerFee.sub(remainingTokenAmount);
                    zeroEx.orderStateWatcher.addOrder(signedOrder);

                    const callback = reportCallbackErrors(done)((orderState: OrderState) => {
                        expect(orderState.isValid).to.be.true();
                        const validOrderState = orderState as OrderStateValid;
                        const orderRelevantState = validOrderState.orderRelevantState;
                        expect(orderRelevantState.remainingFillableMakerTokenAmount).to.be.bignumber.equal(
                            remainingTokenAmount);
                        done();
                    });
                    zeroEx.orderStateWatcher.subscribe(callback);
                    await zeroEx.exchange.cancelOrderAsync(signedOrder, transferTokenAmount);
                })().catch(done);
            });
            it('should equal ratio amount when fee balance is lowered', (done: DoneCallback) => {
                (async () => {
                    const takerFee = ZeroEx.toBaseUnitAmount(new BigNumber(0), decimals);
                    const makerFee = ZeroEx.toBaseUnitAmount(new BigNumber(5), decimals);
                    const feeRecipient = taker;
                    signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                        makerToken.address, takerToken.address, makerFee, takerFee, maker,
                        taker, fillableAmount, feeRecipient);

                    const makerBalance = await zeroEx.token.getBalanceAsync(makerToken.address, maker);

                    const remainingFeeAmount = ZeroEx.toBaseUnitAmount(new BigNumber(3), decimals);
                    const transferFeeAmount = makerFee.sub(remainingFeeAmount);

                    const remainingTokenAmount = ZeroEx.toBaseUnitAmount(new BigNumber(4), decimals);
                    const transferTokenAmount = makerFee.sub(remainingTokenAmount);
                    zeroEx.orderStateWatcher.addOrder(signedOrder);

                    const callback = reportCallbackErrors(done)((orderState: OrderState) => {
                        const validOrderState = orderState as OrderStateValid;
                        const orderRelevantState = validOrderState.orderRelevantState;
                        expect(orderRelevantState.remainingFillableMakerTokenAmount).to.be.bignumber.equal(
                            remainingFeeAmount);
                        done();
                    });
                    zeroEx.orderStateWatcher.subscribe(callback);
                    await zeroEx.token.setProxyAllowanceAsync(zrxTokenAddress, maker, remainingFeeAmount);
                    await zeroEx.token.transferAsync(
                        makerToken.address, maker, ZeroEx.NULL_ADDRESS, transferTokenAmount);
                })().catch(done);
            });
            it('should calculate full amount when all available and non-divisible', (done: DoneCallback) => {
                (async () => {
                    const takerFee = ZeroEx.toBaseUnitAmount(new BigNumber(0), decimals);
                    const makerFee = ZeroEx.toBaseUnitAmount(new BigNumber(2), decimals);
                    const feeRecipient = taker;
                    signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                        makerToken.address, takerToken.address, makerFee, takerFee, maker,
                        taker, fillableAmount, feeRecipient);

                    const makerBalance = await zeroEx.token.getBalanceAsync(makerToken.address, maker);
                    zeroEx.orderStateWatcher.addOrder(signedOrder);

                    const callback = reportCallbackErrors(done)((orderState: OrderState) => {
                        const validOrderState = orderState as OrderStateValid;
                        const orderRelevantState = validOrderState.orderRelevantState;
                        expect(orderRelevantState.remainingFillableMakerTokenAmount).to.be.bignumber.equal(
                            fillableAmount);
                        done();
                    });
                    zeroEx.orderStateWatcher.subscribe(callback);
                    await zeroEx.token.setProxyAllowanceAsync(
                        makerToken.address, maker, ZeroEx.toBaseUnitAmount(new BigNumber(100), decimals));
                })().catch(done);
            });
        });
        it('should emit orderStateInvalid when watched order cancelled', (done: DoneCallback) => {
            (async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerToken.address, takerToken.address, maker, taker, fillableAmount,
                );
                const orderHash = ZeroEx.getOrderHashHex(signedOrder);
                await zeroEx.orderStateWatcher.addOrderAsync(signedOrder);

                const callback = reportCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                    expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.OrderRemainingFillAmountZero);
                    done();
                });
                zeroEx.orderStateWatcher.subscribe(callback);

                const shouldThrowOnInsufficientBalanceOrAllowance = true;
                await zeroEx.exchange.cancelOrderAsync(signedOrder, fillableAmount);
            })().catch(done);
        });
        it('should emit orderStateInvalid when within rounding error range', (done: DoneCallback) => {
            (async () => {
                const remainingFillableAmountInBaseUnits = new BigNumber(100);
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerToken.address, takerToken.address, maker, taker, fillableAmount,
                );
                const orderHash = ZeroEx.getOrderHashHex(signedOrder);
                await zeroEx.orderStateWatcher.addOrderAsync(signedOrder);

                const callback = reportCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                    expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.OrderFillRoundingError);
                    done();
                });
                zeroEx.orderStateWatcher.subscribe(callback);
                await zeroEx.exchange.cancelOrderAsync(
                    signedOrder, fillableAmount.minus(remainingFillableAmountInBaseUnits),
                );
            })().catch(done);
        });
        it('should emit orderStateValid when watched order partially cancelled', (done: DoneCallback) => {
            (async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerToken.address, takerToken.address, maker, taker, fillableAmount,
                );

                const makerBalance = await zeroEx.token.getBalanceAsync(makerToken.address, maker);
                const takerBalance = await zeroEx.token.getBalanceAsync(makerToken.address, taker);

                const cancelAmountInBaseUnits = new BigNumber(2);
                const orderHash = ZeroEx.getOrderHashHex(signedOrder);
                await zeroEx.orderStateWatcher.addOrderAsync(signedOrder);

                const callback = reportCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.true();
                    const validOrderState = orderState as OrderStateValid;
                    expect(validOrderState.orderHash).to.be.equal(orderHash);
                    const orderRelevantState = validOrderState.orderRelevantState;
                    expect(orderRelevantState.cancelledTakerTokenAmount).to.be.bignumber.equal(cancelAmountInBaseUnits);
                    done();
                });
                zeroEx.orderStateWatcher.subscribe(callback);
                await zeroEx.exchange.cancelOrderAsync(signedOrder, cancelAmountInBaseUnits);
            })().catch(done);
        });
    });
});
