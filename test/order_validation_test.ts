import * as chai from 'chai';
import * as Web3 from 'web3';
import * as BigNumber from 'bignumber.js';
import * as Sinon from 'sinon';
import {chaiSetup} from './utils/chai_setup';
import {web3Factory} from './utils/web3_factory';
import {ZeroEx, SignedOrder, Token, ExchangeContractErrs, ZeroExError} from '../src';
import {TradeSide, TransferType} from '../src/types';
import {TokenUtils} from './utils/token_utils';
import {BlockchainLifecycle} from './utils/blockchain_lifecycle';
import {FillScenarios} from './utils/fill_scenarios';
import {OrderValidationUtils} from '../src/utils/order_validation_utils';
import {ExchangeTransferSimulator} from '../src/utils/exchange_transfer_simulator';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle();

describe('OrderValidation', () => {
    let web3: Web3;
    let zeroEx: ZeroEx;
    let userAddresses: string[];
    let tokens: Token[];
    let tokenUtils: TokenUtils;
    let exchangeContractAddress: string;
    let zrxTokenAddress: string;
    let fillScenarios: FillScenarios;
    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let coinbase: string;
    let makerAddress: string;
    let takerAddress: string;
    let feeRecipient: string;
    let orderValidationUtils: OrderValidationUtils;
    const fillableAmount = new BigNumber(5);
    const fillTakerAmount = new BigNumber(5);
    before(async () => {
        web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3.currentProvider);
        exchangeContractAddress = await zeroEx.exchange.getContractAddressAsync();
        userAddresses = await zeroEx.getAvailableAddressesAsync();
        [coinbase, makerAddress, takerAddress, feeRecipient] = userAddresses;
        tokens = await zeroEx.tokenRegistry.getTokensAsync();
        tokenUtils = new TokenUtils(tokens);
        zrxTokenAddress = tokenUtils.getProtocolTokenOrThrow().address;
        fillScenarios = new FillScenarios(zeroEx, userAddresses, tokens, zrxTokenAddress, exchangeContractAddress);
        const [makerToken, takerToken] = tokenUtils.getNonProtocolTokens();
        makerTokenAddress = makerToken.address;
        takerTokenAddress = takerToken.address;
        orderValidationUtils = new OrderValidationUtils(zeroEx.token, zeroEx.exchange);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('validateOrderFillableOrThrowAsync', () => {
        it('should succeed if the order is fillable', async () => {
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
            );
            await zeroEx.exchange.validateOrderFillableOrThrowAsync(
                signedOrder,
            );
        });
        it('should succeed if the order is asymmetric and fillable', async () => {
            const makerFillableAmount = fillableAmount;
            const takerFillableAmount = fillableAmount.minus(4);
            const signedOrder = await fillScenarios.createAsymmetricFillableSignedOrderAsync(
                makerTokenAddress, takerTokenAddress, makerAddress, takerAddress,
                makerFillableAmount, takerFillableAmount,
            );
            await zeroEx.exchange.validateOrderFillableOrThrowAsync(
                signedOrder,
            );
        });
        it('should throw when the order is fully filled or cancelled', async () => {
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
            );
            await zeroEx.exchange.cancelOrderAsync(signedOrder, fillableAmount);
            return expect(zeroEx.exchange.validateOrderFillableOrThrowAsync(
                signedOrder,
            )).to.be.rejectedWith(ExchangeContractErrs.OrderRemainingFillAmountZero);
        });
        it('should throw when order is expired', async () => {
            const expirationInPast = new BigNumber(1496826058); // 7th Jun 2017
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress, takerTokenAddress, makerAddress, takerAddress,
                fillableAmount, expirationInPast,
            );
            return expect(zeroEx.exchange.validateOrderFillableOrThrowAsync(
                signedOrder,
            )).to.be.rejectedWith(ExchangeContractErrs.OrderFillExpired);
        });
    });
    describe('validateFillOrderAndThrowIfInvalidAsync', () => {
        it('should throw when the fill amount is zero', async () => {
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
            );
            const zeroFillAmount = new BigNumber(0);
            return expect(zeroEx.exchange.validateFillOrderThrowIfInvalidAsync(
                signedOrder, zeroFillAmount, takerAddress,
            )).to.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
        });
        it('should throw when the signature is invalid', async () => {
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
            );
            // 27 <--> 28
            signedOrder.ecSignature.v = 27 + (28 - signedOrder.ecSignature.v);
            return expect(zeroEx.exchange.validateFillOrderThrowIfInvalidAsync(
                signedOrder, fillableAmount, takerAddress,
            )).to.be.rejectedWith(ZeroExError.InvalidSignature);
        });
        it('should throw when the order is fully filled or cancelled', async () => {
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
            );
            await zeroEx.exchange.cancelOrderAsync(signedOrder, fillableAmount);
            return expect(zeroEx.exchange.validateFillOrderThrowIfInvalidAsync(
                signedOrder, fillableAmount, takerAddress,
            )).to.be.rejectedWith(ExchangeContractErrs.OrderRemainingFillAmountZero);
        });
        it('should throw when sender is not a taker', async () => {
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
            );
            const nonTakerAddress = userAddresses[6];
            return expect(zeroEx.exchange.validateFillOrderThrowIfInvalidAsync(
                signedOrder, fillTakerAmount, nonTakerAddress,
            )).to.be.rejectedWith(ExchangeContractErrs.TransactionSenderIsNotFillOrderTaker);
        });
        it('should throw when order is expired', async () => {
            const expirationInPast = new BigNumber(1496826058); // 7th Jun 2017
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress, takerTokenAddress, makerAddress, takerAddress,
                fillableAmount, expirationInPast,
            );
            return expect(zeroEx.exchange.validateFillOrderThrowIfInvalidAsync(
                signedOrder, fillTakerAmount, takerAddress,
            )).to.be.rejectedWith(ExchangeContractErrs.OrderFillExpired);
        });
        it('should throw when there a rounding error would have occurred', async () => {
            const makerAmount = new BigNumber(3);
            const takerAmount = new BigNumber(5);
            const signedOrder = await fillScenarios.createAsymmetricFillableSignedOrderAsync(
                makerTokenAddress, takerTokenAddress, makerAddress, takerAddress,
                makerAmount, takerAmount,
            );
            const fillTakerAmountThatCausesRoundingError = new BigNumber(3);
            return expect(zeroEx.exchange.validateFillOrderThrowIfInvalidAsync(
                signedOrder, fillTakerAmountThatCausesRoundingError, takerAddress,
            )).to.be.rejectedWith(ExchangeContractErrs.OrderFillRoundingError);
        });
    });
    describe('#validateFillOrKillOrderAndThrowIfInvalidAsync', () => {
        it('should throw if remaining fillAmount is less then the desired fillAmount', async () => {
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress, takerTokenAddress, makerAddress, takerAddress, fillableAmount,
            );
            const tooLargeFillAmount = new BigNumber(7);
            const fillAmountDifference = tooLargeFillAmount.minus(fillableAmount);
            await zeroEx.token.transferAsync(takerTokenAddress, coinbase, takerAddress, fillAmountDifference);
            await zeroEx.token.setProxyAllowanceAsync(takerTokenAddress, takerAddress, tooLargeFillAmount);
            await zeroEx.token.transferAsync(makerTokenAddress, coinbase, makerAddress, fillAmountDifference);
            await zeroEx.token.setProxyAllowanceAsync(makerTokenAddress, makerAddress, tooLargeFillAmount);

            return expect(zeroEx.exchange.validateFillOrKillOrderThrowIfInvalidAsync(
                signedOrder, tooLargeFillAmount, takerAddress,
            )).to.be.rejectedWith(ExchangeContractErrs.InsufficientRemainingFillAmount);
        });
    });
    describe('validateCancelOrderAndThrowIfInvalidAsync', () => {
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
        it('should throw when cancel amount is zero', async () => {
            const zeroCancelAmount = new BigNumber(0);
            return expect(zeroEx.exchange.validateCancelOrderThrowIfInvalidAsync(signedOrder, zeroCancelAmount))
                .to.be.rejectedWith(ExchangeContractErrs.OrderCancelAmountZero);
        });
        it('should throw when order is expired', async () => {
            const expirationInPast = new BigNumber(1496826058); // 7th Jun 2017
            const expiredSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress, takerTokenAddress, makerAddress, takerAddress,
                fillableAmount, expirationInPast,
            );
            orderHashHex = ZeroEx.getOrderHashHex(expiredSignedOrder);
            return expect(zeroEx.exchange.validateCancelOrderThrowIfInvalidAsync(expiredSignedOrder, cancelAmount))
                .to.be.rejectedWith(ExchangeContractErrs.OrderCancelExpired);
        });
        it('should throw when order is already cancelled or filled', async () => {
            await zeroEx.exchange.cancelOrderAsync(signedOrder, fillableAmount);
            return expect(zeroEx.exchange.validateCancelOrderThrowIfInvalidAsync(signedOrder, fillableAmount))
                .to.be.rejectedWith(ExchangeContractErrs.OrderAlreadyCancelledOrFilled);
        });
    });
    describe('#validateFillOrderBalancesAllowancesThrowIfInvalidAsync', () => {
        let exchangeTransferSimulator: ExchangeTransferSimulator;
        let transferFromAsync: any;
        const bigNumberMatch = (expected: BigNumber.BigNumber) => {
            return Sinon.match((value: BigNumber.BigNumber) => value.eq(expected));
        };
        beforeEach('create exchangeTransferSimulator', async () => {
            exchangeTransferSimulator = new ExchangeTransferSimulator(zeroEx.token);
            transferFromAsync = Sinon.spy();
            exchangeTransferSimulator.transferFromAsync = transferFromAsync;
        });
        it('should call exchangeTransferSimulator.transferFrom in a correct order', async () => {
            const makerFee = new BigNumber(2);
            const takerFee = new BigNumber(2);
            const signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                makerTokenAddress, takerTokenAddress, makerFee, takerFee,
                makerAddress, takerAddress, fillableAmount, feeRecipient,
            );
            await orderValidationUtils.validateFillOrderBalancesAllowancesThrowIfInvalidAsync(
                exchangeTransferSimulator, signedOrder, fillableAmount, takerAddress, zrxTokenAddress,
            );
            expect(transferFromAsync.callCount).to.be.equal(4);
            expect(
                transferFromAsync.getCall(0).calledWith(
                    makerTokenAddress, makerAddress, takerAddress, bigNumberMatch(fillableAmount),
                    TradeSide.Maker, TransferType.Trade,
                ),
            ).to.be.true();
            expect(
                transferFromAsync.getCall(1).calledWith(
                    takerTokenAddress, takerAddress, makerAddress, bigNumberMatch(fillableAmount),
                    TradeSide.Taker, TransferType.Trade,
                ),
            ).to.be.true();
            expect(
                transferFromAsync.getCall(2).calledWith(
                    zrxTokenAddress, makerAddress, feeRecipient, bigNumberMatch(makerFee),
                    TradeSide.Maker, TransferType.Fee,
                ),
            ).to.be.true();
            expect(
                transferFromAsync.getCall(3).calledWith(
                    zrxTokenAddress, takerAddress, feeRecipient, bigNumberMatch(takerFee),
                    TradeSide.Taker, TransferType.Fee,
                ),
            ).to.be.true();
        });
        it('should call exchangeTransferSimulator.transferFrom with correct values for an open order', async () => {
            const makerFee = new BigNumber(2);
            const takerFee = new BigNumber(2);
            const signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                makerTokenAddress, takerTokenAddress, makerFee, takerFee,
                makerAddress, ZeroEx.NULL_ADDRESS, fillableAmount, feeRecipient,
            );
            await orderValidationUtils.validateFillOrderBalancesAllowancesThrowIfInvalidAsync(
                exchangeTransferSimulator, signedOrder, fillableAmount, takerAddress, zrxTokenAddress,
            );
            expect(transferFromAsync.callCount).to.be.equal(4);
            expect(
                transferFromAsync.getCall(0).calledWith(
                    makerTokenAddress, makerAddress, takerAddress, bigNumberMatch(fillableAmount),
                    TradeSide.Maker, TransferType.Trade,
                ),
            ).to.be.true();
            expect(
                transferFromAsync.getCall(1).calledWith(
                    takerTokenAddress, takerAddress, makerAddress, bigNumberMatch(fillableAmount),
                    TradeSide.Taker, TransferType.Trade,
                ),
            ).to.be.true();
            expect(
                transferFromAsync.getCall(2).calledWith(
                    zrxTokenAddress, makerAddress, feeRecipient, bigNumberMatch(makerFee),
                    TradeSide.Maker, TransferType.Fee,
                ),
            ).to.be.true();
            expect(
                transferFromAsync.getCall(3).calledWith(
                    zrxTokenAddress, takerAddress, feeRecipient, bigNumberMatch(takerFee),
                    TradeSide.Taker, TransferType.Fee,
                ),
            ).to.be.true();
        });
    });
});
