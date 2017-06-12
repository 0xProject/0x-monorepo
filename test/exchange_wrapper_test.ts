import 'mocha';
import * as chai from 'chai';
import * as Web3 from 'web3';
import * as BigNumber from 'bignumber.js';
import {chaiSetup} from './utils/chai_setup';
import ChaiBigNumber = require('chai-bignumber');
import promisify = require('es6-promisify');
import {web3Factory} from './utils/web3_factory';
import {ZeroEx} from '../src/0x';
import {BlockchainLifecycle} from './utils/blockchain_lifecycle';
import {
    Token,
    Order,
    SignedOrder,
    SubscriptionOpts,
    ExchangeEvents,
    ContractEvent,
    DoneCallback,
    ExchangeContractErrs,
    OrderCancellationRequest,
    OrderFillRequest,
} from '../src/types';
import {FillScenarios} from './utils/fill_scenarios';
import {TokenUtils} from './utils/token_utils';

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
    before(async () => {
        web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3);
        userAddresses = await promisify(web3.eth.getAccounts)();
        tokens = await zeroEx.tokenRegistry.getTokensAsync();
        tokenUtils = new TokenUtils(tokens);
        zrxTokenAddress = tokenUtils.getProtocolTokenOrThrow().address;
        fillScenarios = new FillScenarios(zeroEx, userAddresses, tokens, zrxTokenAddress);
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
            describe('failed fillOrKill', () => {
                it('should throw if remaining fillAmount is less then the desired fillAmount', async () => {
                    const fillableAmount = new BigNumber(5);
                    const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                    );
                    const tooLargeFillAmount = new BigNumber(7);
                    const fillAmountDifference = tooLargeFillAmount.minus(fillableAmount);
                    await zeroEx.token.transferAsync(takerTokenAddress, coinbase, takerAddress, fillAmountDifference);
                    await zeroEx.token.setProxyAllowanceAsync(takerTokenAddress, takerAddress, tooLargeFillAmount);
                    await zeroEx.token.transferAsync(makerTokenAddress, coinbase, makerAddress, fillAmountDifference);
                    await zeroEx.token.setProxyAllowanceAsync(makerTokenAddress, makerAddress, tooLargeFillAmount);

                    return expect(zeroEx.exchange.fillOrKillOrderAsync(
                        signedOrder, tooLargeFillAmount, takerAddress,
                    )).to.be.rejectedWith(ExchangeContractErrs.INSUFFICIENT_REMAINING_FILL_AMOUNT);
                });
            });
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
        const shouldCheckTransfer = false;
        before(async () => {
            [coinbase, makerAddress, takerAddress, feeRecipient] = userAddresses;
            tokens = await zeroEx.tokenRegistry.getTokensAsync();
            const [makerToken, takerToken] = tokenUtils.getNonProtocolTokens();
            makerTokenAddress = makerToken.address;
            takerTokenAddress = takerToken.address;
        });
        describe('#fillOrderAsync', () => {
            describe('failed fills', () => {
                it('should throw when the fill amount is zero', async () => {
                    const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                    );
                    const zeroFillAmount = new BigNumber(0);
                    return expect(zeroEx.exchange.fillOrderAsync(
                        signedOrder, zeroFillAmount, shouldCheckTransfer, takerAddress,
                    )).to.be.rejectedWith(ExchangeContractErrs.ORDER_REMAINING_FILL_AMOUNT_ZERO);
                });
                it('should throw when sender is not a taker', async () => {
                    const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                    );
                    const nonTakerAddress = userAddresses[6];
                    return expect(zeroEx.exchange.fillOrderAsync(
                        signedOrder, fillTakerAmount, shouldCheckTransfer, nonTakerAddress,
                    )).to.be.rejectedWith(ExchangeContractErrs.TRANSACTION_SENDER_IS_NOT_FILL_ORDER_TAKER);
                });
                it('should throw when order is expired', async () => {
                    const expirationInPast = new BigNumber(1496826058); // 7th Jun 2017
                    const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerTokenAddress, takerTokenAddress, makerAddress, takerAddress,
                        fillableAmount, expirationInPast,
                    );
                    return expect(zeroEx.exchange.fillOrderAsync(
                        signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress,
                    )).to.be.rejectedWith(ExchangeContractErrs.ORDER_FILL_EXPIRED);
                });
                describe('should throw when not enough balance or allowance to fulfill the order', () => {
                    const balanceToSubtractFromMaker = new BigNumber(3);
                    const lackingAllowance = new BigNumber(3);
                    let signedOrder: SignedOrder;
                    beforeEach('create fillable signed order', async () => {
                        signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                            makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                        );
                    });
                    it('should throw when taker balance is less than fill amount', async () => {
                        await zeroEx.token.transferAsync(
                            takerTokenAddress, takerAddress, coinbase, balanceToSubtractFromMaker,
                        );
                        return expect(zeroEx.exchange.fillOrderAsync(
                            signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress,
                        )).to.be.rejectedWith(ExchangeContractErrs.INSUFFICIENT_TAKER_BALANCE);
                    });
                    it('should throw when taker allowance is less than fill amount', async () => {
                        const newAllowanceWhichIsLessThanFillAmount = fillTakerAmount.minus(lackingAllowance);
                        await zeroEx.token.setProxyAllowanceAsync(takerTokenAddress, takerAddress,
                            newAllowanceWhichIsLessThanFillAmount);
                        return expect(zeroEx.exchange.fillOrderAsync(
                            signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress,
                        )).to.be.rejectedWith(ExchangeContractErrs.INSUFFICIENT_TAKER_ALLOWANCE);
                    });
                    it('should throw when maker balance is less than maker fill amount', async () => {
                        await zeroEx.token.transferAsync(
                            makerTokenAddress, makerAddress, coinbase, balanceToSubtractFromMaker,
                        );
                        return expect(zeroEx.exchange.fillOrderAsync(
                            signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress,
                        )).to.be.rejectedWith(ExchangeContractErrs.INSUFFICIENT_MAKER_BALANCE);
                    });
                    it('should throw when maker allowance is less than maker fill amount', async () => {
                        const newAllowanceWhichIsLessThanFillAmount = fillTakerAmount.minus(lackingAllowance);
                        await zeroEx.token.setProxyAllowanceAsync(makerTokenAddress, makerAddress,
                            newAllowanceWhichIsLessThanFillAmount);
                        return expect(zeroEx.exchange.fillOrderAsync(
                            signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress,
                        )).to.be.rejectedWith(ExchangeContractErrs.INSUFFICIENT_MAKER_ALLOWANCE);
                    });
                });
                it('should throw when there a rounding error would have occurred', async () => {
                    const makerAmount = new BigNumber(3);
                    const takerAmount = new BigNumber(5);
                    const signedOrder = await fillScenarios.createAsymmetricFillableSignedOrderAsync(
                        makerTokenAddress, takerTokenAddress, makerAddress, takerAddress,
                        makerAmount, takerAmount,
                    );
                    const fillTakerAmountThatCausesRoundingError = new BigNumber(3);
                    return expect(zeroEx.exchange.fillOrderAsync(
                        signedOrder, fillTakerAmountThatCausesRoundingError, shouldCheckTransfer, takerAddress,
                    )).to.be.rejectedWith(ExchangeContractErrs.ORDER_FILL_ROUNDING_ERROR);
                });
                describe('should throw when not enough balance or allowance to pay fees', () => {
                    const makerFee = new BigNumber(2);
                    const takerFee = new BigNumber(2);
                    let signedOrder: SignedOrder;
                    beforeEach('setup', async () => {
                        signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                            makerTokenAddress, takerTokenAddress, makerFee, takerFee,
                            makerAddress, takerAddress, fillableAmount, feeRecipient,
                        );
                    });
                    it('should throw when maker doesn\'t have enough balance to pay fees', async () => {
                        const balanceToSubtractFromMaker = new BigNumber(1);
                        await zeroEx.token.transferAsync(
                            zrxTokenAddress, makerAddress, coinbase, balanceToSubtractFromMaker,
                        );
                        return expect(zeroEx.exchange.fillOrderAsync(
                            signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress,
                        )).to.be.rejectedWith(ExchangeContractErrs.INSUFFICIENT_MAKER_FEE_BALANCE);
                    });
                    it('should throw when maker doesn\'t have enough allowance to pay fees', async () => {
                        const newAllowanceWhichIsLessThanFees = makerFee.minus(1);
                        await zeroEx.token.setProxyAllowanceAsync(zrxTokenAddress, makerAddress,
                            newAllowanceWhichIsLessThanFees);
                        return expect(zeroEx.exchange.fillOrderAsync(
                            signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress,
                        )).to.be.rejectedWith(ExchangeContractErrs.INSUFFICIENT_MAKER_FEE_ALLOWANCE);
                    });
                    it('should throw when taker doesn\'t have enough balance to pay fees', async () => {
                        const balanceToSubtractFromTaker = new BigNumber(1);
                        await zeroEx.token.transferAsync(
                            zrxTokenAddress, takerAddress, coinbase, balanceToSubtractFromTaker,
                        );
                        return expect(zeroEx.exchange.fillOrderAsync(
                            signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress,
                        )).to.be.rejectedWith(ExchangeContractErrs.INSUFFICIENT_TAKER_FEE_BALANCE);
                    });
                    it('should throw when taker doesn\'t have enough allowance to pay fees', async () => {
                        const newAllowanceWhichIsLessThanFees = makerFee.minus(1);
                        await zeroEx.token.setProxyAllowanceAsync(zrxTokenAddress, takerAddress,
                            newAllowanceWhichIsLessThanFees);
                        return expect(zeroEx.exchange.fillOrderAsync(
                            signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress,
                        )).to.be.rejectedWith(ExchangeContractErrs.INSUFFICIENT_TAKER_FEE_ALLOWANCE);
                    });
                });
            });
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
                        signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress);
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
                        signedOrder, partialFillAmount, shouldCheckTransfer, takerAddress);
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
                    await zeroEx.exchange.fillOrderAsync(
                        signedOrder, fillTakerAmount, shouldCheckTransfer, takerAddress);
                    expect(await zeroEx.token.getBalanceAsync(zrxTokenAddress, feeRecipient))
                        .to.be.bignumber.equal(makerFee.plus(takerFee));
                });
            });
        });
        describe('#batchFillOrderAsync', () => {
            let signedOrder: SignedOrder;
            let signedOrderHashHex: string;
            let anotherSignedOrder: SignedOrder;
            let anotherOrderHashHex: string;
            let orderFillBatch: OrderFillRequest[];
            beforeEach(async () => {
                signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                );
                signedOrderHashHex = await zeroEx.getOrderHashHexAsync(signedOrder);
                anotherSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                );
                anotherOrderHashHex = await zeroEx.getOrderHashHexAsync(anotherSignedOrder);
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
                it('should no-op for an empty batch', async () => {
                    await zeroEx.exchange.batchFillOrderAsync([], shouldCheckTransfer, takerAddress);
                });
                it('should successfully fill multiple orders', async () => {
                    await zeroEx.exchange.batchFillOrderAsync(orderFillBatch, shouldCheckTransfer, takerAddress);
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
                signedOrderHashHex = await zeroEx.getOrderHashHexAsync(signedOrder);
                anotherSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                );
                anotherOrderHashHex = await zeroEx.getOrderHashHexAsync(anotherSignedOrder);
                signedOrders = [signedOrder, anotherSignedOrder];
            });
            describe('successful batch fills', () => {
                it('should no-op for an empty batch', async () => {
                    await zeroEx.exchange.fillOrdersUpToAsync([], fillUpToAmount, shouldCheckTransfer, takerAddress);
                });
                it('should successfully fill up to specified amount', async () => {
                    await zeroEx.exchange.fillOrdersUpToAsync(
                        signedOrders, fillUpToAmount, shouldCheckTransfer, takerAddress,
                    );
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
            orderHashHex = await zeroEx.getOrderHashHexAsync(signedOrder);
        });
        describe('#cancelOrderAsync', () => {
            describe('failed cancels', () => {
                it('should throw when cancel amount is zero', async () => {
                    const zeroCancelAmount = new BigNumber(0);
                    return expect(zeroEx.exchange.cancelOrderAsync(signedOrder, zeroCancelAmount))
                        .to.be.rejectedWith(ExchangeContractErrs.ORDER_CANCEL_AMOUNT_ZERO);
                });
                it('should throw when order is expired', async () => {
                    const expirationInPast = new BigNumber(1496826058); // 7th Jun 2017
                    const expiredSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
                        makerTokenAddress, takerTokenAddress, makerAddress, takerAddress,
                        fillableAmount, expirationInPast,
                    );
                    orderHashHex = await zeroEx.getOrderHashHexAsync(expiredSignedOrder);
                    return expect(zeroEx.exchange.cancelOrderAsync(expiredSignedOrder, cancelAmount))
                        .to.be.rejectedWith(ExchangeContractErrs.ORDER_CANCEL_EXPIRED);
                });
                it('should throw when order is already cancelled or filled', async () => {
                    await zeroEx.exchange.cancelOrderAsync(signedOrder, fillableAmount);
                    return expect(zeroEx.exchange.cancelOrderAsync(signedOrder, fillableAmount))
                        .to.be.rejectedWith(ExchangeContractErrs.ORDER_ALREADY_CANCELLED_OR_FILLED);
                });
            });
            describe('successful cancels', () => {
                it('should cancel an order', async () => {
                    await zeroEx.exchange.cancelOrderAsync(signedOrder, cancelAmount);
                    const cancelledAmount = await zeroEx.exchange.getCanceledTakerAmountAsync(orderHashHex);
                    expect(cancelledAmount).to.be.bignumber.equal(cancelAmount);
                });
            });
        });
        describe('#batchCancelOrderAsync', () => {
            let anotherSignedOrder: SignedOrder;
            let anotherOrderHashHex: string;
            let cancelBatch: OrderCancellationRequest[];
            beforeEach(async () => {
                anotherSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
                    makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
                );
                anotherOrderHashHex = await zeroEx.getOrderHashHexAsync(anotherSignedOrder);
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
                    return expect(zeroEx.exchange.batchCancelOrderAsync([
                        cancelBatch[0],
                        {
                            order: signedOrderWithDifferentMaker,
                            takerTokenCancelAmount: cancelAmount,
                        },
                    ])).to.be.rejectedWith(ExchangeContractErrs.MULTIPLE_MAKERS_IN_SINGLE_CANCEL_BATCH);
                });
            });
            describe('successful batch cancels', () => {
                it('should cancel a batch of orders', async () => {
                    await zeroEx.exchange.batchCancelOrderAsync(cancelBatch);
                    const cancelledAmount = await zeroEx.exchange.getCanceledTakerAmountAsync(orderHashHex);
                    const anotherCancelledAmount = await zeroEx.exchange.getCanceledTakerAmountAsync(
                        anotherOrderHashHex);
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
            orderHash = await zeroEx.getOrderHashHexAsync(signedOrder);
        });
        describe('#getUnavailableTakerAmountAsync', () => {
            it ('should throw if passed an invalid orderHash', async () => {
                const invalidOrderHashHex = '0x123';
                return expect(zeroEx.exchange.getUnavailableTakerAmountAsync(invalidOrderHashHex)).to.be.rejected();
            });
            it ('should return zero if passed a valid but non-existent orderHash', async () => {
                const unavailableValueT = await zeroEx.exchange.getUnavailableTakerAmountAsync(NON_EXISTENT_ORDER_HASH);
                expect(unavailableValueT).to.be.bignumber.equal(0);
            });
            it ('should return the unavailableValueT for a valid and partially filled orderHash', async () => {
                const unavailableValueT = await zeroEx.exchange.getUnavailableTakerAmountAsync(orderHash);
                expect(unavailableValueT).to.be.bignumber.equal(partialFillAmount);
            });
        });
        describe('#getFilledTakerAmountAsync', () => {
            it ('should throw if passed an invalid orderHash', async () => {
                const invalidOrderHashHex = '0x123';
                return expect(zeroEx.exchange.getFilledTakerAmountAsync(invalidOrderHashHex)).to.be.rejected();
            });
            it ('should return zero if passed a valid but non-existent orderHash', async () => {
                const filledValueT = await zeroEx.exchange.getFilledTakerAmountAsync(NON_EXISTENT_ORDER_HASH);
                expect(filledValueT).to.be.bignumber.equal(0);
            });
            it ('should return the filledValueT for a valid and partially filled orderHash', async () => {
                const filledValueT = await zeroEx.exchange.getFilledTakerAmountAsync(orderHash);
                expect(filledValueT).to.be.bignumber.equal(partialFillAmount);
            });
        });
        describe('#getCanceledTakerAmountAsync', () => {
            it ('should throw if passed an invalid orderHash', async () => {
                const invalidOrderHashHex = '0x123';
                return expect(zeroEx.exchange.getCanceledTakerAmountAsync(invalidOrderHashHex)).to.be.rejected();
            });
            it ('should return zero if passed a valid but non-existent orderHash', async () => {
                const cancelledValueT = await zeroEx.exchange.getCanceledTakerAmountAsync(NON_EXISTENT_ORDER_HASH);
                expect(cancelledValueT).to.be.bignumber.equal(0);
            });
            it ('should return the cancelledValueT for a valid and partially filled orderHash', async () => {
                const cancelledValueT = await zeroEx.exchange.getCanceledTakerAmountAsync(orderHash);
                expect(cancelledValueT).to.be.bignumber.equal(0);
            });
            it ('should return the cancelledValueT for a valid and cancelled orderHash', async () => {
                const cancelAmount = fillableAmount.minus(partialFillAmount);
                await zeroEx.exchange.cancelOrderAsync(signedOrder, cancelAmount);
                const cancelledValueT = await zeroEx.exchange.getCanceledTakerAmountAsync(orderHash);
                expect(cancelledValueT).to.be.bignumber.equal(cancelAmount);
            });
        });
    });
    describe('#subscribeAsync', () => {
        const indexFilterValues = {};
        const shouldCheckTransfer = false;
        let makerTokenAddress: string;
        let takerTokenAddress: string;
        let coinbase: string;
        let takerAddress: string;
        let makerAddress: string;
        let fillableAmount: BigNumber.BigNumber;
        let signedOrder: SignedOrder;
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
            await (zeroEx.exchange as any)._stopWatchingExchangeLogEventsAsync();
        });
        // Hack: Mocha does not allow a test to be both async and have a `done` callback
        // Since we need to await the receipt of the event in the `subscribeAsync` callback,
        // we do need both. A hack is to make the top-level a sync fn w/ a done callback and then
        // wrap the rest of the test in an async block
        // Source: https://github.com/mochajs/mocha/issues/2407
        it('Should receive the LogFill event when an order is filled', (done: DoneCallback) => {
            (async () => {
                const subscriptionOpts: SubscriptionOpts = {
                    fromBlock: 0,
                    toBlock: 'latest',
                };
                await zeroEx.exchange.subscribeAsync(ExchangeEvents.LogFill, subscriptionOpts,
                                                     indexFilterValues, (err: Error, event: ContractEvent) => {
                    expect(err).to.be.null();
                    expect(event).to.not.be.undefined();
                    done();
                });
                const fillTakerAmountInBaseUnits = new BigNumber(1);
                await zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillTakerAmountInBaseUnits, shouldCheckTransfer, takerAddress,
                );
            })();
        });
        it('Should receive the LogCancel event when an order is cancelled', (done: DoneCallback) => {
            (async () => {
                const subscriptionOpts: SubscriptionOpts = {
                    fromBlock: 0,
                    toBlock: 'latest',
                };
                await zeroEx.exchange.subscribeAsync(ExchangeEvents.LogCancel, subscriptionOpts,
                    indexFilterValues, (err: Error, event: ContractEvent) => {
                        expect(err).to.be.null();
                        expect(event).to.not.be.undefined();
                        done();
                    });
                const cancelTakerAmountInBaseUnits = new BigNumber(1);
                await zeroEx.exchange.cancelOrderAsync(signedOrder, cancelTakerAmountInBaseUnits);
            })();
        });
        it('Outstanding subscriptions are cancelled when zeroEx.setProviderAsync called', (done: DoneCallback) => {
            (async () => {
                const subscriptionOpts: SubscriptionOpts = {
                    fromBlock: 0,
                    toBlock: 'latest',
                };
                await zeroEx.exchange.subscribeAsync(ExchangeEvents.LogFill, subscriptionOpts,
                                                     indexFilterValues, (err: Error, event: ContractEvent) => {
                    done(new Error('Expected this subscription to have been cancelled'));
                });

                const newProvider = web3Factory.getRpcProvider();
                await zeroEx.setProviderAsync(newProvider);

                await zeroEx.exchange.subscribeAsync(ExchangeEvents.LogFill, subscriptionOpts,
                                                     indexFilterValues, (err: Error, event: ContractEvent) => {
                    expect(err).to.be.null();
                    expect(event).to.not.be.undefined();
                    done();
                });

                const fillTakerAmountInBaseUnits = new BigNumber(1);
                await zeroEx.exchange.fillOrderAsync(
                    signedOrder, fillTakerAmountInBaseUnits, shouldCheckTransfer, takerAddress,
                );
            })();
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
            const orderHash = await zeroEx.getOrderHashHexAsync(signedOrder);
            const orderHashFromContract = await (zeroEx.exchange as any)
                ._getOrderHashHexUsingContractCallAsync(signedOrder);
            expect(orderHash).to.equal(orderHashFromContract);
        });
    });
});
