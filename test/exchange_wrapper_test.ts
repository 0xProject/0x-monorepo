import 'mocha';
import * as chai from 'chai';
import * as Web3 from 'web3';
import * as BigNumber from 'bignumber.js';
import {chaiSetup} from './utils/chai_setup';
import ChaiBigNumber = require('chai-bignumber');
import promisify = require('es6-promisify');
import {web3Factory} from './utils/web3_factory';
import {BlockchainLifecycle} from './utils/blockchain_lifecycle';
import {
    ZeroEx,
    Token,
    SignedOrder,
    SubscriptionOpts,
    ExchangeEvents,
    ContractEvent,
    ExchangeContractErrs,
    OrderCancellationRequest,
    OrderFillRequest,
    LogFillContractEventArgs,
} from '../src';
import {DoneCallback} from '../src/types';
import {FillScenarios} from './utils/fill_scenarios';
import {TokenUtils} from './utils/token_utils';
import {assert} from '../src/utils/assert';
import {TokenTransferProxyWrapper} from '../src/contract_wrappers/token_transfer_proxy_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle();

const NON_EXISTENT_ORDER_HASH = '0x79370342234e7acd6bbeac335bd3bb1d368383294b64b8160a00f4060e4d3777';

describe('ExchangeWrapper', () => {
    let web3: Web3;
    let zeroEx: ZeroEx;
    let tokenUtils: TokenUtils;
    let tokens: Token[];
    let userAddresses: string[];
    let zrxTokenAddress: string;
    let fillScenarios: FillScenarios;
    let exchangeContractAddress: string;
    before(async () => {
        web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3.currentProvider);
        exchangeContractAddress = await zeroEx.exchange.getContractAddressAsync();
        userAddresses = await zeroEx.getAvailableAddressesAsync();
        tokens = await zeroEx.tokenRegistry.getTokensAsync();
        tokenUtils = new TokenUtils(tokens);
        zrxTokenAddress = tokenUtils.getProtocolTokenOrThrow().address;
        fillScenarios = new FillScenarios(zeroEx, userAddresses, tokens, zrxTokenAddress, exchangeContractAddress);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('fillOrKill order(s)', () => {
        let makerTokenAddress: string;
        let takerTokenAddress: string;
        let coinbase: string;
        let makerAddress: string;
        let takerAddress: string;
        let feeRecipient: string;
        const fillTakerAmount = new BigNumber(5);
        before(async () => {
            [coinbase, makerAddress, takerAddress, feeRecipient] = userAddresses;
            tokens = await zeroEx.tokenRegistry.getTokensAsync();
            const [makerToken, takerToken] = tokenUtils.getNonProtocolTokens();
            makerTokenAddress = makerToken.address;
            takerTokenAddress = takerToken.address;
        });
        describe('#batchFillOrKillAsync', () => {
            it('successfuly batch fillOrKill', async () => {
                const fillableAmount = new BigNumber(5);
                const partialFillTakerAmount = new BigNumber(2);
                const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                );
                const anotherSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                );
                const orderFillOrKillRequests = [
                    {
                        signedOrder,
                        fillTakerAmount: partialFillTakerAmount,
                    },
                    {
                        signedOrder: anotherSignedOrder,
                        fillTakerAmount: partialFillTakerAmount,
                    },
                ];
                await zeroEx.exchange.batchFillOrKillAsync(orderFillOrKillRequests, takerAddress);
            });
        });
        describe('#fillOrKillOrderAsync', () => {
            describe('successful fills', () => {
                it('should fill a valid order', async () => {
                    const fillableAmount = new BigNumber(5);
                    const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                    );
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, makerAddress))
                        .to.be.bignumber.equal(fillableAmount);
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, makerAddress))
                        .to.be.bignumber.equal(0);
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, takerAddress))
                        .to.be.bignumber.equal(0);
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, takerAddress))
                        .to.be.bignumber.equal(fillableAmount);
                    await zeroEx.exchange.fillOrKillOrderAsync(signedOrder, fillTakerAmount, takerAddress);
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, makerAddress))
                        .to.be.bignumber.equal(fillableAmount.minus(fillTakerAmount));
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, makerAddress))
                        .to.be.bignumber.equal(fillTakerAmount);
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, takerAddress))
                        .to.be.bignumber.equal(fillTakerAmount);
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, takerAddress))
                        .to.be.bignumber.equal(fillableAmount.minus(fillTakerAmount));
                });
                it('should partially fill a valid order', async () => {
                    const fillableAmount = new BigNumber(5);
                    const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                    );
                    const partialFillAmount = new BigNumber(3);
                    await zeroEx.exchange.fillOrKillOrderAsync(signedOrder, partialFillAmount, takerAddress);
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, makerAddress))
                        .to.be.bignumber.equal(fillableAmount.minus(partialFillAmount));
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, makerAddress))
                        .to.be.bignumber.equal(partialFillAmount);
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, takerAddress))
                        .to.be.bignumber.equal(partialFillAmount);
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, takerAddress))
                        .to.be.bignumber.equal(fillableAmount.minus(partialFillAmount));
                });
            });
        });
    });
    describe('fill order(s)', () => {
        let makerTokenAddress: string;
        let takerTokenAddress: string;
        let coinbase: string;
        let makerAddress: string;
        let takerAddress: string;
        let feeRecipient: string;
        const fillableAmount = new BigNumber(5);
        const fillTakerAmount = new BigNumber(5);
        const shouldThrowOnInsufficientBalanceOrAllowance = true;
        before(async () => {
            [coinbase, makerAddress, takerAddress, feeRecipient] = userAddresses;
            tokens = await zeroEx.tokenRegistry.getTokensAsync();
            const [makerToken, takerToken] = tokenUtils.getNonProtocolTokens();
            makerTokenAddress = makerToken.address;
            takerTokenAddress = takerToken.address;
        });
        describe('#fillOrderAsync', () => {
            describe('successful fills', () => {
                it('should fill a valid order', async () => {
                    const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                    );
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, makerAddress))
                        .to.be.bignumber.equal(fillableAmount);
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, makerAddress))
                        .to.be.bignumber.equal(0);
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, takerAddress))
                        .to.be.bignumber.equal(0);
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, takerAddress))
                        .to.be.bignumber.equal(fillableAmount);
                    await zeroEx.exchange.fillOrderAsync(
                        signedOrder, fillTakerAmount, shouldThrowOnInsufficientBalanceOrAllowance, takerAddress);
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, makerAddress))
                        .to.be.bignumber.equal(fillableAmount.minus(fillTakerAmount));
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, makerAddress))
                        .to.be.bignumber.equal(fillTakerAmount);
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, takerAddress))
                        .to.be.bignumber.equal(fillTakerAmount);
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, takerAddress))
                        .to.be.bignumber.equal(fillableAmount.minus(fillTakerAmount));
                });
                it('should partially fill the valid order', async () => {
                    const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                    );
                    const partialFillAmount = new BigNumber(3);
                    await zeroEx.exchange.fillOrderAsync(
                        signedOrder, partialFillAmount, shouldThrowOnInsufficientBalanceOrAllowance, takerAddress);
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, makerAddress))
                        .to.be.bignumber.equal(fillableAmount.minus(partialFillAmount));
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, makerAddress))
                        .to.be.bignumber.equal(partialFillAmount);
                    expect(await zeroEx.token.getBalanceAsync(makerTokenAddress, takerAddress))
                        .to.be.bignumber.equal(partialFillAmount);
                    expect(await zeroEx.token.getBalanceAsync(takerTokenAddress, takerAddress))
                        .to.be.bignumber.equal(fillableAmount.minus(partialFillAmount));
                });
                it('should fill the valid orders with fees', async () => {
                    const makerFee = new BigNumber(1);
                    const takerFee = new BigNumber(2);
                    const signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                        makerTokenAddress, takerTokenAddress, makerFee, takerFee,
                        makerAddress, takerAddress, fillableAmount, feeRecipient,
                    );
                    const txHash = await zeroEx.exchange.fillOrderAsync(
                        signedOrder, fillTakerAmount, shouldThrowOnInsufficientBalanceOrAllowance, takerAddress);
                    await zeroEx.awaitTransactionMinedAsync(txHash);
                    expect(await zeroEx.token.getBalanceAsync(zrxTokenAddress, feeRecipient))
                        .to.be.bignumber.equal(makerFee.plus(takerFee));
                });
            });
        });
        describe('#batchFillOrdersAsync', () => {
            let signedOrder: SignedOrder;
            let signedOrderHashHex: string;
            let anotherSignedOrder: SignedOrder;
            let anotherOrderHashHex: string;
            let orderFillBatch: OrderFillRequest[];
            beforeEach(async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                );
                signedOrderHashHex = ZeroEx.getOrderHashHex(signedOrder);
                anotherSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                );
                anotherOrderHashHex = ZeroEx.getOrderHashHex(anotherSignedOrder);
                orderFillBatch = [
                    {
                        signedOrder,
                        takerTokenFillAmount: fillTakerAmount,
                    },
                    {
                        signedOrder: anotherSignedOrder,
                        takerTokenFillAmount: fillTakerAmount,
                    },
                ];
            });
            describe('successful batch fills', () => {
                it('should throw if a batch is empty', async () => {
                    return expect(zeroEx.exchange.batchFillOrdersAsync(
                        [], shouldThrowOnInsufficientBalanceOrAllowance, takerAddress),
                    ).to.be.rejectedWith(ExchangeContractErrs.BatchOrdersMustHaveAtLeastOneItem);
                });
                it('should successfully fill multiple orders', async () => {
                    const txHash = await zeroEx.exchange.batchFillOrdersAsync(
                        orderFillBatch, shouldThrowOnInsufficientBalanceOrAllowance, takerAddress);
                    await zeroEx.awaitTransactionMinedAsync(txHash);
                    const filledAmount = await zeroEx.exchange.getFilledTakerAmountAsync(signedOrderHashHex);
                    const anotherFilledAmount = await zeroEx.exchange.getFilledTakerAmountAsync(anotherOrderHashHex);
                    expect(filledAmount).to.be.bignumber.equal(fillTakerAmount);
                    expect(anotherFilledAmount).to.be.bignumber.equal(fillTakerAmount);
                });
            });
        });
        describe('#fillOrdersUpTo', () => {
            let signedOrder: SignedOrder;
            let signedOrderHashHex: string;
            let anotherSignedOrder: SignedOrder;
            let anotherOrderHashHex: string;
            let signedOrders: SignedOrder[];
            const fillUpToAmount = fillableAmount.plus(fillableAmount).minus(1);
            beforeEach(async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                );
                signedOrderHashHex = ZeroEx.getOrderHashHex(signedOrder);
                anotherSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                );
                anotherOrderHashHex = ZeroEx.getOrderHashHex(anotherSignedOrder);
                signedOrders = [signedOrder, anotherSignedOrder];
            });
            describe('successful batch fills', () => {
                it('should throw if a batch is empty', async () => {
                    return expect(zeroEx.exchange.fillOrdersUpToAsync(
                        [], fillUpToAmount, shouldThrowOnInsufficientBalanceOrAllowance, takerAddress),
                    ).to.be.rejectedWith(ExchangeContractErrs.BatchOrdersMustHaveAtLeastOneItem);
                });
                it('should successfully fill up to specified amount', async () => {
                    const txHash = await zeroEx.exchange.fillOrdersUpToAsync(
                        signedOrders, fillUpToAmount, shouldThrowOnInsufficientBalanceOrAllowance, takerAddress,
                    );
                    await zeroEx.awaitTransactionMinedAsync(txHash);
                    const filledAmount = await zeroEx.exchange.getFilledTakerAmountAsync(signedOrderHashHex);
                    const anotherFilledAmount = await zeroEx.exchange.getFilledTakerAmountAsync(anotherOrderHashHex);
                    expect(filledAmount).to.be.bignumber.equal(fillableAmount);
                    const remainingFillAmount = fillableAmount.minus(1);
                    expect(anotherFilledAmount).to.be.bignumber.equal(remainingFillAmount);
                });
            });
        });
    });
    describe('cancel order(s)', () => {
        let makerTokenAddress: string;
        let takerTokenAddress: string;
        let coinbase: string;
        let makerAddress: string;
        let takerAddress: string;
        const fillableAmount = new BigNumber(5);
        let signedOrder: SignedOrder;
        let orderHashHex: string;
        const cancelAmount = new BigNumber(3);
        beforeEach(async () => {
            [coinbase, makerAddress, takerAddress] = userAddresses;
            const [makerToken, takerToken] = tokenUtils.getNonProtocolTokens();
            makerTokenAddress = makerToken.address;
            takerTokenAddress = takerToken.address;
            signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
            );
            orderHashHex = ZeroEx.getOrderHashHex(signedOrder);
        });
        describe('#cancelOrderAsync', () => {
            describe('successful cancels', () => {
                it('should cancel an order', async () => {
                    const txHash = await zeroEx.exchange.cancelOrderAsync(signedOrder, cancelAmount);
                    await zeroEx.awaitTransactionMinedAsync(txHash);
                    const cancelledAmount = await zeroEx.exchange.getCanceledTakerAmountAsync(orderHashHex);
                    expect(cancelledAmount).to.be.bignumber.equal(cancelAmount);
                });
            });
        });
        describe('#batchCancelOrdersAsync', () => {
            let anotherSignedOrder: SignedOrder;
            let anotherOrderHashHex: string;
            let cancelBatch: OrderCancellationRequest[];
            beforeEach(async () => {
                anotherSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                );
                anotherOrderHashHex = ZeroEx.getOrderHashHex(anotherSignedOrder);
                cancelBatch = [
                    {
                        order: signedOrder,
                        takerTokenCancelAmount: cancelAmount,
                    },
                    {
                        order: anotherSignedOrder,
                        takerTokenCancelAmount: cancelAmount,
                    },
                ];
            });
            describe('failed batch cancels', () => {
                it('should throw when orders have different makers', async () => {
                    const signedOrderWithDifferentMaker = await fillScenarios.createFillableSignedOrderAsync(
                        makerTokenAddress, takerTokenAddress, takerAddress, takerAddress, fillableAmount,
                    );
                    return expect(zeroEx.exchange.batchCancelOrdersAsync([
                        cancelBatch[0],
                        {
                            order: signedOrderWithDifferentMaker,
                            takerTokenCancelAmount: cancelAmount,
                        },
                    ])).to.be.rejectedWith(ExchangeContractErrs.MultipleMakersInSingleCancelBatchDisallowed);
                });
            });
            describe('successful batch cancels', () => {
                it('should cancel a batch of orders', async () => {
                    await zeroEx.exchange.batchCancelOrdersAsync(cancelBatch);
                    const cancelledAmount = await zeroEx.exchange.getCanceledTakerAmountAsync(orderHashHex);
                    const anotherCancelledAmount = await zeroEx.exchange.getCanceledTakerAmountAsync(
                        anotherOrderHashHex,
                    );
                    expect(cancelledAmount).to.be.bignumber.equal(cancelAmount);
                    expect(anotherCancelledAmount).to.be.bignumber.equal(cancelAmount);
                });
            });
        });
    });
    describe('tests that require partially filled order', () => {
        let makerTokenAddress: string;
        let takerTokenAddress: string;
        let takerAddress: string;
        let fillableAmount: BigNumber.BigNumber;
        let partialFillAmount: BigNumber.BigNumber;
        let signedOrder: SignedOrder;
        let orderHash: string;
        before(() => {
            takerAddress = userAddresses[1];
            const [makerToken, takerToken] = tokens;
            makerTokenAddress = makerToken.address;
            takerTokenAddress = takerToken.address;
        });
        beforeEach(async () => {
            fillableAmount = new BigNumber(5);
            partialFillAmount = new BigNumber(2);
            signedOrder = await fillScenarios.createPartiallyFilledSignedOrderAsync(
                makerTokenAddress, takerTokenAddress, takerAddress, fillableAmount, partialFillAmount,
            );
            orderHash = ZeroEx.getOrderHashHex(signedOrder);
        });
        describe('#getUnavailableTakerAmountAsync', () => {
            it('should throw if passed an invalid orderHash', async () => {
                const invalidOrderHashHex = '0x123';
                return expect(zeroEx.exchange.getUnavailableTakerAmountAsync(invalidOrderHashHex)).to.be.rejected();
            });
            it('should return zero if passed a valid but non-existent orderHash', async () => {
                const unavailableValueT = await zeroEx.exchange.getUnavailableTakerAmountAsync(NON_EXISTENT_ORDER_HASH);
                expect(unavailableValueT).to.be.bignumber.equal(0);
            });
            it('should return the unavailableValueT for a valid and partially filled orderHash', async () => {
                const unavailableValueT = await zeroEx.exchange.getUnavailableTakerAmountAsync(orderHash);
                expect(unavailableValueT).to.be.bignumber.equal(partialFillAmount);
            });
        });
        describe('#getFilledTakerAmountAsync', () => {
            it('should throw if passed an invalid orderHash', async () => {
                const invalidOrderHashHex = '0x123';
                return expect(zeroEx.exchange.getFilledTakerAmountAsync(invalidOrderHashHex)).to.be.rejected();
            });
            it('should return zero if passed a valid but non-existent orderHash', async () => {
                const filledValueT = await zeroEx.exchange.getFilledTakerAmountAsync(NON_EXISTENT_ORDER_HASH,
                );
                expect(filledValueT).to.be.bignumber.equal(0);
            });
            it('should return the filledValueT for a valid and partially filled orderHash', async () => {
                const filledValueT = await zeroEx.exchange.getFilledTakerAmountAsync(orderHash);
                expect(filledValueT).to.be.bignumber.equal(partialFillAmount);
            });
        });
        describe('#getCanceledTakerAmountAsync', () => {
            it('should throw if passed an invalid orderHash', async () => {
                const invalidOrderHashHex = '0x123';
                return expect(zeroEx.exchange.getCanceledTakerAmountAsync(invalidOrderHashHex)).to.be.rejected();
            });
            it('should return zero if passed a valid but non-existent orderHash', async () => {
                const cancelledValueT = await zeroEx.exchange.getCanceledTakerAmountAsync(NON_EXISTENT_ORDER_HASH);
                expect(cancelledValueT).to.be.bignumber.equal(0);
            });
            it('should return the cancelledValueT for a valid and partially filled orderHash', async () => {
                const cancelledValueT = await zeroEx.exchange.getCanceledTakerAmountAsync(orderHash);
                expect(cancelledValueT).to.be.bignumber.equal(0);
            });
            it('should return the cancelledValueT for a valid and cancelled orderHash', async () => {
                const cancelAmount = fillableAmount.minus(partialFillAmount);
                await zeroEx.exchange.cancelOrderAsync(signedOrder, cancelAmount);
                const cancelledValueT = await zeroEx.exchange.getCanceledTakerAmountAsync(orderHash);
                expect(cancelledValueT).to.be.bignumber.equal(cancelAmount);
            });
        });
    });
    describe('#subscribeAsync', () => {
        const indexFilterValues = {};
        const shouldThrowOnInsufficientBalanceOrAllowance = true;
        let makerTokenAddress: string;
        let takerTokenAddress: string;
        let coinbase: string;
        let takerAddress: string;
        let makerAddress: string;
        let fillableAmount: BigNumber.BigNumber;
        let signedOrder: SignedOrder;
        const subscriptionOpts: SubscriptionOpts = {
            fromBlock: 0,
            toBlock: 'latest',
        };
        const fillTakerAmountInBaseUnits = new BigNumber(1);
        const cancelTakerAmountInBaseUnits = new BigNumber(1);
        before(() => {
            [coinbase, makerAddress, takerAddress] = userAddresses;
            const [makerToken, takerToken] = tokens;
            makerTokenAddress = makerToken.address;
            takerTokenAddress = takerToken.address;
        });
        beforeEach(async () => {
            fillableAmount = new BigNumber(5);
            signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
            );
        });
        afterEach(async () => {
            await zeroEx.exchange.stopWatchingAllEventsAsync();
        });
        // Hack: Mocha does not allow a test to be both async and have a `done` callback
        // Since we need to await the receipt of the event in the `subscribeAsync` callback,
        // we do need both. A hack is to make the top-level a sync fn w/ a done callback and then
        // wrap the rest of the test in an async block
        // Source: https://github.com/mochajs/mocha/issues/2407
        it('Should receive the LogFill event when an order is filled', (done: DoneCallback) => {
            (async () => {
                const zeroExEvent = await zeroEx.exchange.subscribeAsync(
                    ExchangeEvents.LogFill, subscriptionOpts, indexFilterValues, exchangeContractAddress,
                );
                zeroExEvent.watch((err: Error, event: ContractEvent) => {
                    expect(err).to.be.null();
                    expect(event).to.not.be.undefined();
                    expect(event.event).to.be.equal('LogFill');
                    done();
                });
                await zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillTakerAmountInBaseUnits, shouldThrowOnInsufficientBalanceOrAllowance, takerAddress,
                );
            })().catch(done);
        });
        it('Should receive the LogCancel event when an order is cancelled', (done: DoneCallback) => {
            (async () => {
                const zeroExEvent = await zeroEx.exchange.subscribeAsync(
                    ExchangeEvents.LogCancel, subscriptionOpts, indexFilterValues, exchangeContractAddress,
                );
                zeroExEvent.watch((err: Error, event: ContractEvent) => {
                        expect(err).to.be.null();
                        expect(event).to.not.be.undefined();
                        expect(event.event).to.be.equal('LogCancel');
                        done();
                });
                await zeroEx.exchange.cancelOrderAsync(signedOrder, cancelTakerAmountInBaseUnits);
            })().catch(done);
        });
        it('Outstanding subscriptions are cancelled when zeroEx.setProviderAsync called', (done: DoneCallback) => {
            (async () => {
                const eventSubscriptionToBeCancelled = await zeroEx.exchange.subscribeAsync(
                    ExchangeEvents.LogFill, subscriptionOpts, indexFilterValues, exchangeContractAddress,
                );
                eventSubscriptionToBeCancelled.watch((err: Error, event: ContractEvent) => {
                    done(new Error('Expected this subscription to have been cancelled'));
                });

                const newProvider = web3Factory.getRpcProvider();
                await zeroEx.setProviderAsync(newProvider);

                const eventSubscriptionToStay = await zeroEx.exchange.subscribeAsync(
                    ExchangeEvents.LogFill, subscriptionOpts, indexFilterValues, exchangeContractAddress,
                );
                eventSubscriptionToStay.watch((err: Error, event: ContractEvent) => {
                    expect(err).to.be.null();
                    expect(event).to.not.be.undefined();
                    expect(event.event).to.be.equal('LogFill');
                    done();
                });
                await zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillTakerAmountInBaseUnits, shouldThrowOnInsufficientBalanceOrAllowance, takerAddress,
                );
            })().catch(done);
        });
        it('Should stop watch for events when stopWatchingAsync called on the eventEmitter', (done: DoneCallback) => {
            (async () => {
                const eventSubscriptionToBeStopped = await zeroEx.exchange.subscribeAsync(
                    ExchangeEvents.LogFill, subscriptionOpts, indexFilterValues, exchangeContractAddress,
                );
                eventSubscriptionToBeStopped.watch((err: Error, event: ContractEvent) => {
                    done(new Error('Expected this subscription to have been stopped'));
                });
                await eventSubscriptionToBeStopped.stopWatchingAsync();
                await zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillTakerAmountInBaseUnits, shouldThrowOnInsufficientBalanceOrAllowance, takerAddress,
                );
                done();
            })().catch(done);
        });
        it('Should wrap all event args BigNumber instances in a newer version of BigNumber', (done: DoneCallback) => {
            (async () => {
                const zeroExEvent = await zeroEx.exchange.subscribeAsync(
                    ExchangeEvents.LogFill, subscriptionOpts, indexFilterValues, exchangeContractAddress,
                );
                zeroExEvent.watch((err: Error, event: ContractEvent) => {
                    const args = event.args as LogFillContractEventArgs;
                    expect(args.filledMakerTokenAmount.isBigNumber).to.be.true();
                    expect(args.filledTakerTokenAmount.isBigNumber).to.be.true();
                    expect(args.paidMakerFee.isBigNumber).to.be.true();
                    expect(args.paidTakerFee.isBigNumber).to.be.true();
                    done();
                });
                await zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillTakerAmountInBaseUnits, shouldThrowOnInsufficientBalanceOrAllowance, takerAddress,
                );
            })().catch(done);
        });
    });
    describe('#getOrderHashHexUsingContractCallAsync', () => {
        let makerTokenAddress: string;
        let takerTokenAddress: string;
        let makerAddress: string;
        let takerAddress: string;
        const fillableAmount = new BigNumber(5);
        before(async () => {
            [, makerAddress, takerAddress] = userAddresses;
            const [makerToken, takerToken] = tokenUtils.getNonProtocolTokens();
            makerTokenAddress = makerToken.address;
            takerTokenAddress = takerToken.address;
        });
        it('get\'s the same hash as the local function', async () => {
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
            );
            const orderHash = ZeroEx.getOrderHashHex(signedOrder);
            const orderHashFromContract = await (zeroEx.exchange as any)
                ._getOrderHashHexUsingContractCallAsync(signedOrder);
            expect(orderHash).to.equal(orderHashFromContract);
        });
    });
});
