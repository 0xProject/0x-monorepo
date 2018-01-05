import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';
import * as Web3 from 'web3';

import {
    ExchangeContractErrs,
    OrderState,
    OrderStateInvalid,
    OrderStateValid,
    SignedOrder,
    Token,
    ZeroEx,
    ZeroExError,
} from '../src';
import { DoneCallback } from '../src/types';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { FillScenarios } from './utils/fill_scenarios';
import { reportNoErrorCallbackErrors } from './utils/report_callback_errors';
import { TokenUtils } from './utils/token_utils';
import { web3Factory } from './utils/web3_factory';

const TIMEOUT_MS = 150;

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(constants.RPC_URL);

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
    let signedOrder: SignedOrder;
    const config = {
        networkId: constants.TESTRPC_NETWORK_ID,
    };
    const decimals = constants.ZRX_DECIMALS;
    const fillableAmount = ZeroEx.toBaseUnitAmount(new BigNumber(5), decimals);
    before(async () => {
        web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3.currentProvider, config);
        exchangeContractAddress = zeroEx.exchange.getContractAddress();
        userAddresses = await zeroEx.getAvailableAddressesAsync();
        [, maker, taker] = userAddresses;
        tokens = await zeroEx.tokenRegistry.getTokensAsync();
        tokenUtils = new TokenUtils(tokens);
        zrxTokenAddress = tokenUtils.getProtocolTokenOrThrow().address;
        fillScenarios = new FillScenarios(zeroEx, userAddresses, tokens, zrxTokenAddress, exchangeContractAddress);
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
            const orderHash = ZeroEx.getOrderHashHex(signedOrder);
            zeroEx.orderStateWatcher.addOrder(signedOrder);
            expect((zeroEx.orderStateWatcher as any)._orderByOrderHash).to.include({
                [orderHash]: signedOrder,
            });
            let dependentOrderHashes = (zeroEx.orderStateWatcher as any)._dependentOrderHashes;
            expect(dependentOrderHashes[signedOrder.maker][signedOrder.makerTokenAddress]).to.have.keys(orderHash);
            zeroEx.orderStateWatcher.removeOrder(orderHash);
            expect((zeroEx.orderStateWatcher as any)._orderByOrderHash).to.not.include({
                [orderHash]: signedOrder,
            });
            dependentOrderHashes = (zeroEx.orderStateWatcher as any)._dependentOrderHashes;
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
            const orderHash = ZeroEx.getOrderHashHex(signedOrder);
            const nonExistentOrderHash = `0x${orderHash
                .substr(2)
                .split('')
                .reverse()
                .join('')}`;
            zeroEx.orderStateWatcher.removeOrder(nonExistentOrderHash);
        });
    });
    describe('#subscribe', async () => {
        afterEach(async () => {
            zeroEx.orderStateWatcher.unsubscribe();
        });
        it('should fail when trying to subscribe twice', async () => {
            zeroEx.orderStateWatcher.subscribe(_.noop);
            expect(() => zeroEx.orderStateWatcher.subscribe(_.noop)).to.throw(ZeroExError.SubscriptionAlreadyPresent);
        });
    });
    describe('tests with cleanup', async () => {
        afterEach(async () => {
            zeroEx.orderStateWatcher.unsubscribe();
            const orderHash = ZeroEx.getOrderHashHex(signedOrder);
            zeroEx.orderStateWatcher.removeOrder(orderHash);
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
                const orderHash = ZeroEx.getOrderHashHex(signedOrder);
                zeroEx.orderStateWatcher.addOrder(signedOrder);
                const callback = reportNoErrorCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                    expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.InsufficientMakerAllowance);
                });
                zeroEx.orderStateWatcher.subscribe(callback);
                await zeroEx.token.setProxyAllowanceAsync(makerToken.address, maker, new BigNumber(0));
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
                zeroEx.orderStateWatcher.addOrder(signedOrder);
                const callback = reportNoErrorCallbackErrors(done)((orderState: OrderState) => {
                    throw new Error('OrderState callback fired for irrelevant order');
                });
                zeroEx.orderStateWatcher.subscribe(callback);
                const notTheMaker = userAddresses[0];
                const anyRecipient = taker;
                const transferAmount = new BigNumber(2);
                await zeroEx.token.transferAsync(makerToken.address, notTheMaker, anyRecipient, transferAmount);
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
                const orderHash = ZeroEx.getOrderHashHex(signedOrder);
                zeroEx.orderStateWatcher.addOrder(signedOrder);
                const callback = reportNoErrorCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                    expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.InsufficientMakerBalance);
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
                    makerToken.address,
                    takerToken.address,
                    maker,
                    taker,
                    fillableAmount,
                );
                const orderHash = ZeroEx.getOrderHashHex(signedOrder);
                zeroEx.orderStateWatcher.addOrder(signedOrder);

                const callback = reportNoErrorCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                    expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.OrderRemainingFillAmountZero);
                });
                zeroEx.orderStateWatcher.subscribe(callback);

                const shouldThrowOnInsufficientBalanceOrAllowance = true;
                await zeroEx.exchange.fillOrderAsync(
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

                const makerBalance = await zeroEx.token.getBalanceAsync(makerToken.address, maker);
                const fillAmountInBaseUnits = new BigNumber(2);
                const orderHash = ZeroEx.getOrderHashHex(signedOrder);
                zeroEx.orderStateWatcher.addOrder(signedOrder);

                const callback = reportNoErrorCallbackErrors(done)((orderState: OrderState) => {
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
                zeroEx.orderStateWatcher.subscribe(callback);
                const shouldThrowOnInsufficientBalanceOrAllowance = true;
                await zeroEx.exchange.fillOrderAsync(
                    signedOrder,
                    fillAmountInBaseUnits,
                    shouldThrowOnInsufficientBalanceOrAllowance,
                    taker,
                );
            })().catch(done);
        });
        it('should trigger the callback when orders backing ZRX allowance changes', (done: DoneCallback) => {
            (async () => {
                const makerFee = ZeroEx.toBaseUnitAmount(new BigNumber(2), 18);
                const takerFee = ZeroEx.toBaseUnitAmount(new BigNumber(0), 18);
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
                const callback = reportNoErrorCallbackErrors(done)();
                zeroEx.orderStateWatcher.addOrder(signedOrder);
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
                        makerToken.address,
                        takerToken.address,
                        maker,
                        taker,
                        makerFillableAmount,
                        takerFillableAmount,
                    );
                    const fillAmountInBaseUnits = ZeroEx.toBaseUnitAmount(new BigNumber(2), decimals);
                    const orderHash = ZeroEx.getOrderHashHex(signedOrder);
                    zeroEx.orderStateWatcher.addOrder(signedOrder);
                    const callback = reportNoErrorCallbackErrors(done)((orderState: OrderState) => {
                        expect(orderState.isValid).to.be.true();
                        const validOrderState = orderState as OrderStateValid;
                        expect(validOrderState.orderHash).to.be.equal(orderHash);
                        const orderRelevantState = validOrderState.orderRelevantState;
                        expect(orderRelevantState.remainingFillableMakerTokenAmount).to.be.bignumber.equal(
                            ZeroEx.toBaseUnitAmount(new BigNumber(16), decimals),
                        );
                        expect(orderRelevantState.remainingFillableTakerTokenAmount).to.be.bignumber.equal(
                            ZeroEx.toBaseUnitAmount(new BigNumber(8), decimals),
                        );
                    });
                    zeroEx.orderStateWatcher.subscribe(callback);
                    const shouldThrowOnInsufficientBalanceOrAllowance = true;
                    await zeroEx.exchange.fillOrderAsync(
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

                    const changedMakerApprovalAmount = ZeroEx.toBaseUnitAmount(new BigNumber(3), decimals);
                    zeroEx.orderStateWatcher.addOrder(signedOrder);

                    const callback = reportNoErrorCallbackErrors(done)((orderState: OrderState) => {
                        const validOrderState = orderState as OrderStateValid;
                        const orderRelevantState = validOrderState.orderRelevantState;
                        expect(orderRelevantState.remainingFillableMakerTokenAmount).to.be.bignumber.equal(
                            changedMakerApprovalAmount,
                        );
                        expect(orderRelevantState.remainingFillableTakerTokenAmount).to.be.bignumber.equal(
                            changedMakerApprovalAmount,
                        );
                    });
                    zeroEx.orderStateWatcher.subscribe(callback);
                    await zeroEx.token.setProxyAllowanceAsync(makerToken.address, maker, changedMakerApprovalAmount);
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

                    const makerBalance = await zeroEx.token.getBalanceAsync(makerToken.address, maker);

                    const remainingAmount = ZeroEx.toBaseUnitAmount(new BigNumber(1), decimals);
                    const transferAmount = makerBalance.sub(remainingAmount);
                    zeroEx.orderStateWatcher.addOrder(signedOrder);

                    const callback = reportNoErrorCallbackErrors(done)((orderState: OrderState) => {
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
                    zeroEx.orderStateWatcher.subscribe(callback);
                    await zeroEx.token.transferAsync(makerToken.address, maker, ZeroEx.NULL_ADDRESS, transferAmount);
                })().catch(done);
            });
            it('should equal remaining amount when partially cancelled and order has fees', (done: DoneCallback) => {
                (async () => {
                    const takerFee = ZeroEx.toBaseUnitAmount(new BigNumber(0), decimals);
                    const makerFee = ZeroEx.toBaseUnitAmount(new BigNumber(5), decimals);
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

                    const remainingTokenAmount = ZeroEx.toBaseUnitAmount(new BigNumber(4), decimals);
                    const transferTokenAmount = makerFee.sub(remainingTokenAmount);
                    zeroEx.orderStateWatcher.addOrder(signedOrder);

                    const callback = reportNoErrorCallbackErrors(done)((orderState: OrderState) => {
                        expect(orderState.isValid).to.be.true();
                        const validOrderState = orderState as OrderStateValid;
                        const orderRelevantState = validOrderState.orderRelevantState;
                        expect(orderRelevantState.remainingFillableMakerTokenAmount).to.be.bignumber.equal(
                            remainingTokenAmount,
                        );
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
                        makerToken.address,
                        takerToken.address,
                        makerFee,
                        takerFee,
                        maker,
                        taker,
                        fillableAmount,
                        feeRecipient,
                    );

                    const remainingFeeAmount = ZeroEx.toBaseUnitAmount(new BigNumber(3), decimals);

                    const remainingTokenAmount = ZeroEx.toBaseUnitAmount(new BigNumber(4), decimals);
                    const transferTokenAmount = makerFee.sub(remainingTokenAmount);
                    zeroEx.orderStateWatcher.addOrder(signedOrder);

                    const callback = reportNoErrorCallbackErrors(done)((orderState: OrderState) => {
                        const validOrderState = orderState as OrderStateValid;
                        const orderRelevantState = validOrderState.orderRelevantState;
                        expect(orderRelevantState.remainingFillableMakerTokenAmount).to.be.bignumber.equal(
                            remainingFeeAmount,
                        );
                    });
                    zeroEx.orderStateWatcher.subscribe(callback);
                    await zeroEx.token.setProxyAllowanceAsync(zrxTokenAddress, maker, remainingFeeAmount);
                    await zeroEx.token.transferAsync(
                        makerToken.address,
                        maker,
                        ZeroEx.NULL_ADDRESS,
                        transferTokenAmount,
                    );
                })().catch(done);
            });
            it('should calculate full amount when all available and non-divisible', (done: DoneCallback) => {
                (async () => {
                    const takerFee = ZeroEx.toBaseUnitAmount(new BigNumber(0), decimals);
                    const makerFee = ZeroEx.toBaseUnitAmount(new BigNumber(2), decimals);
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

                    zeroEx.orderStateWatcher.addOrder(signedOrder);

                    const callback = reportNoErrorCallbackErrors(done)((orderState: OrderState) => {
                        const validOrderState = orderState as OrderStateValid;
                        const orderRelevantState = validOrderState.orderRelevantState;
                        expect(orderRelevantState.remainingFillableMakerTokenAmount).to.be.bignumber.equal(
                            fillableAmount,
                        );
                    });
                    zeroEx.orderStateWatcher.subscribe(callback);
                    await zeroEx.token.setProxyAllowanceAsync(
                        makerToken.address,
                        maker,
                        ZeroEx.toBaseUnitAmount(new BigNumber(100), decimals),
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
                const orderHash = ZeroEx.getOrderHashHex(signedOrder);
                zeroEx.orderStateWatcher.addOrder(signedOrder);

                const callback = reportNoErrorCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                    expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.OrderRemainingFillAmountZero);
                });
                zeroEx.orderStateWatcher.subscribe(callback);

                await zeroEx.exchange.cancelOrderAsync(signedOrder, fillableAmount);
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
                const orderHash = ZeroEx.getOrderHashHex(signedOrder);
                zeroEx.orderStateWatcher.addOrder(signedOrder);

                const callback = reportNoErrorCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.false();
                    const invalidOrderState = orderState as OrderStateInvalid;
                    expect(invalidOrderState.orderHash).to.be.equal(orderHash);
                    expect(invalidOrderState.error).to.be.equal(ExchangeContractErrs.OrderFillRoundingError);
                });
                zeroEx.orderStateWatcher.subscribe(callback);
                await zeroEx.exchange.cancelOrderAsync(
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
                const orderHash = ZeroEx.getOrderHashHex(signedOrder);
                zeroEx.orderStateWatcher.addOrder(signedOrder);

                const callback = reportNoErrorCallbackErrors(done)((orderState: OrderState) => {
                    expect(orderState.isValid).to.be.true();
                    const validOrderState = orderState as OrderStateValid;
                    expect(validOrderState.orderHash).to.be.equal(orderHash);
                    const orderRelevantState = validOrderState.orderRelevantState;
                    expect(orderRelevantState.cancelledTakerTokenAmount).to.be.bignumber.equal(cancelAmountInBaseUnits);
                });
                zeroEx.orderStateWatcher.subscribe(callback);
                await zeroEx.exchange.cancelOrderAsync(signedOrder, cancelAmountInBaseUnits);
            })().catch(done);
        });
    });
}); // tslint:disable:max-file-line-count
