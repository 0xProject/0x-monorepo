import { BlockchainLifecycle, devConstants } from '@0xproject/dev-utils';
import { FillScenarios } from '@0xproject/fill-scenarios';
import { OrderError } from '@0xproject/order-utils';
import { BlockParamLiteral } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import 'make-promises-safe';
import * as Sinon from 'sinon';

import { ContractWrappers, ContractWrappersError, ExchangeContractErrs, SignedOrder, Token } from '../src';
import { TradeSide, TransferType } from '../src/types';
import { ExchangeTransferSimulator } from '../src/utils/exchange_transfer_simulator';
import { OrderValidationUtils } from '../src/utils/order_validation_utils';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';
import { TokenUtils } from './utils/token_utils';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('OrderValidation', () => {
    let contractWrappers: ContractWrappers;
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
    const fillableAmount = new BigNumber(5);
    const fillTakerAmount = new BigNumber(5);
    const config = {
        networkId: constants.TESTRPC_NETWORK_ID,
    };
    before(async () => {
        contractWrappers = new ContractWrappers(provider, config);
        exchangeContractAddress = contractWrappers.exchange.getContractAddress();
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        [coinbase, makerAddress, takerAddress, feeRecipient] = userAddresses;
        tokens = await contractWrappers.tokenRegistry.getTokensAsync();
        tokenUtils = new TokenUtils(tokens);
        zrxTokenAddress = tokenUtils.getProtocolTokenOrThrow().address;
        fillScenarios = new FillScenarios(provider, userAddresses, tokens, zrxTokenAddress, exchangeContractAddress);
        const [makerToken, takerToken] = tokenUtils.getDummyTokens();
        makerTokenAddress = makerToken.address;
        takerTokenAddress = takerToken.address;
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
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
            );
            await contractWrappers.exchange.validateOrderFillableOrThrowAsync(signedOrder);
        });
        it('should succeed if the maker is buying ZRX and has no ZRX balance', async () => {
            const makerFee = new BigNumber(2);
            const takerFee = new BigNumber(2);
            const signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                makerTokenAddress,
                zrxTokenAddress,
                makerFee,
                takerFee,
                makerAddress,
                takerAddress,
                fillableAmount,
                feeRecipient,
            );
            const zrxMakerBalance = await contractWrappers.token.getBalanceAsync(zrxTokenAddress, makerAddress);
            await contractWrappers.token.transferAsync(zrxTokenAddress, makerAddress, takerAddress, zrxMakerBalance);
            await contractWrappers.exchange.validateOrderFillableOrThrowAsync(signedOrder);
        });
        it('should succeed if the maker is buying ZRX and has no ZRX balance and there is no specified taker', async () => {
            const makerFee = new BigNumber(2);
            const takerFee = new BigNumber(2);
            const signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                makerTokenAddress,
                zrxTokenAddress,
                makerFee,
                takerFee,
                makerAddress,
                constants.NULL_ADDRESS,
                fillableAmount,
                feeRecipient,
            );
            const zrxMakerBalance = await contractWrappers.token.getBalanceAsync(zrxTokenAddress, makerAddress);
            await contractWrappers.token.transferAsync(zrxTokenAddress, makerAddress, takerAddress, zrxMakerBalance);
            await contractWrappers.exchange.validateOrderFillableOrThrowAsync(signedOrder);
        });
        it('should succeed if the order is asymmetric and fillable', async () => {
            const makerFillableAmount = fillableAmount;
            const takerFillableAmount = fillableAmount.minus(4);
            const signedOrder = await fillScenarios.createAsymmetricFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                makerFillableAmount,
                takerFillableAmount,
            );
            await contractWrappers.exchange.validateOrderFillableOrThrowAsync(signedOrder);
        });
        it('should throw when the order is fully filled or cancelled', async () => {
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
            );
            await contractWrappers.exchange.cancelOrderAsync(signedOrder, fillableAmount);
            return expect(contractWrappers.exchange.validateOrderFillableOrThrowAsync(signedOrder)).to.be.rejectedWith(
                ExchangeContractErrs.OrderRemainingFillAmountZero,
            );
        });
        it('should throw when order is expired', async () => {
            const expirationInPast = new BigNumber(1496826058); // 7th Jun 2017
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
                expirationInPast,
            );
            return expect(contractWrappers.exchange.validateOrderFillableOrThrowAsync(signedOrder)).to.be.rejectedWith(
                ExchangeContractErrs.OrderFillExpired,
            );
        });
    });
    describe('validateFillOrderAndThrowIfInvalidAsync', () => {
        it('should throw when the fill amount is zero', async () => {
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
            );
            const zeroFillAmount = new BigNumber(0);
            return expect(
                contractWrappers.exchange.validateFillOrderThrowIfInvalidAsync(
                    signedOrder,
                    zeroFillAmount,
                    takerAddress,
                ),
            ).to.be.rejectedWith(ExchangeContractErrs.OrderFillAmountZero);
        });
        it('should throw when the signature is invalid', async () => {
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
            );
            // 27 <--> 28
            signedOrder.ecSignature.v = 28 - signedOrder.ecSignature.v + 27;
            return expect(
                contractWrappers.exchange.validateFillOrderThrowIfInvalidAsync(
                    signedOrder,
                    fillableAmount,
                    takerAddress,
                ),
            ).to.be.rejectedWith(OrderError.InvalidSignature);
        });
        it('should throw when the order is fully filled or cancelled', async () => {
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
            );
            await contractWrappers.exchange.cancelOrderAsync(signedOrder, fillableAmount);
            return expect(
                contractWrappers.exchange.validateFillOrderThrowIfInvalidAsync(
                    signedOrder,
                    fillableAmount,
                    takerAddress,
                ),
            ).to.be.rejectedWith(ExchangeContractErrs.OrderRemainingFillAmountZero);
        });
        it('should throw when sender is not a taker', async () => {
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
            );
            const nonTakerAddress = userAddresses[6];
            return expect(
                contractWrappers.exchange.validateFillOrderThrowIfInvalidAsync(
                    signedOrder,
                    fillTakerAmount,
                    nonTakerAddress,
                ),
            ).to.be.rejectedWith(ExchangeContractErrs.TransactionSenderIsNotFillOrderTaker);
        });
        it('should throw when order is expired', async () => {
            const expirationInPast = new BigNumber(1496826058); // 7th Jun 2017
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
                expirationInPast,
            );
            return expect(
                contractWrappers.exchange.validateFillOrderThrowIfInvalidAsync(
                    signedOrder,
                    fillTakerAmount,
                    takerAddress,
                ),
            ).to.be.rejectedWith(ExchangeContractErrs.OrderFillExpired);
        });
        it('should throw when there a rounding error would have occurred', async () => {
            const makerAmount = new BigNumber(3);
            const takerAmount = new BigNumber(5);
            const signedOrder = await fillScenarios.createAsymmetricFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                makerAmount,
                takerAmount,
            );
            const fillTakerAmountThatCausesRoundingError = new BigNumber(3);
            return expect(
                contractWrappers.exchange.validateFillOrderThrowIfInvalidAsync(
                    signedOrder,
                    fillTakerAmountThatCausesRoundingError,
                    takerAddress,
                ),
            ).to.be.rejectedWith(ExchangeContractErrs.OrderFillRoundingError);
        });
    });
    describe('#validateFillOrKillOrderAndThrowIfInvalidAsync', () => {
        it('should throw if remaining fillAmount is less then the desired fillAmount', async () => {
            const signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
            );
            const tooLargeFillAmount = new BigNumber(7);
            const fillAmountDifference = tooLargeFillAmount.minus(fillableAmount);
            await contractWrappers.token.transferAsync(takerTokenAddress, coinbase, takerAddress, fillAmountDifference);
            await contractWrappers.token.setProxyAllowanceAsync(takerTokenAddress, takerAddress, tooLargeFillAmount);
            await contractWrappers.token.transferAsync(makerTokenAddress, coinbase, makerAddress, fillAmountDifference);
            await contractWrappers.token.setProxyAllowanceAsync(makerTokenAddress, makerAddress, tooLargeFillAmount);

            return expect(
                contractWrappers.exchange.validateFillOrKillOrderThrowIfInvalidAsync(
                    signedOrder,
                    tooLargeFillAmount,
                    takerAddress,
                ),
            ).to.be.rejectedWith(ExchangeContractErrs.InsufficientRemainingFillAmount);
        });
    });
    describe('validateCancelOrderAndThrowIfInvalidAsync', () => {
        let signedOrder: SignedOrder;
        const cancelAmount = new BigNumber(3);
        beforeEach(async () => {
            [coinbase, makerAddress, takerAddress] = userAddresses;
            const [makerToken, takerToken] = tokenUtils.getDummyTokens();
            makerTokenAddress = makerToken.address;
            takerTokenAddress = takerToken.address;
            signedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
            );
        });
        it('should throw when cancel amount is zero', async () => {
            const zeroCancelAmount = new BigNumber(0);
            return expect(
                contractWrappers.exchange.validateCancelOrderThrowIfInvalidAsync(signedOrder, zeroCancelAmount),
            ).to.be.rejectedWith(ExchangeContractErrs.OrderCancelAmountZero);
        });
        it('should throw when order is expired', async () => {
            const expirationInPast = new BigNumber(1496826058); // 7th Jun 2017
            const expiredSignedOrder = await fillScenarios.createFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                fillableAmount,
                expirationInPast,
            );
            return expect(
                contractWrappers.exchange.validateCancelOrderThrowIfInvalidAsync(expiredSignedOrder, cancelAmount),
            ).to.be.rejectedWith(ExchangeContractErrs.OrderCancelExpired);
        });
        it('should throw when order is already cancelled or filled', async () => {
            await contractWrappers.exchange.cancelOrderAsync(signedOrder, fillableAmount);
            return expect(
                contractWrappers.exchange.validateCancelOrderThrowIfInvalidAsync(signedOrder, fillableAmount),
            ).to.be.rejectedWith(ExchangeContractErrs.OrderAlreadyCancelledOrFilled);
        });
    });
    describe('#validateFillOrderBalancesAllowancesThrowIfInvalidAsync', () => {
        let exchangeTransferSimulator: ExchangeTransferSimulator;
        let transferFromAsync: Sinon.SinonSpy;
        const bigNumberMatch = (expected: BigNumber) => {
            return Sinon.match((value: BigNumber) => value.eq(expected));
        };
        beforeEach('create exchangeTransferSimulator', async () => {
            exchangeTransferSimulator = new ExchangeTransferSimulator(contractWrappers.token, BlockParamLiteral.Latest);
            transferFromAsync = Sinon.spy();
            exchangeTransferSimulator.transferFromAsync = transferFromAsync as any;
        });
        it('should call exchangeTransferSimulator.transferFrom in a correct order', async () => {
            const makerFee = new BigNumber(2);
            const takerFee = new BigNumber(2);
            const signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerFee,
                takerFee,
                makerAddress,
                takerAddress,
                fillableAmount,
                feeRecipient,
            );
            await OrderValidationUtils.validateFillOrderBalancesAllowancesThrowIfInvalidAsync(
                exchangeTransferSimulator,
                signedOrder,
                fillableAmount,
                takerAddress,
                zrxTokenAddress,
            );
            expect(transferFromAsync.callCount).to.be.equal(4);
            expect(
                transferFromAsync
                    .getCall(0)
                    .calledWith(
                        makerTokenAddress,
                        makerAddress,
                        takerAddress,
                        bigNumberMatch(fillableAmount),
                        TradeSide.Maker,
                        TransferType.Trade,
                    ),
            ).to.be.true();
            expect(
                transferFromAsync
                    .getCall(1)
                    .calledWith(
                        takerTokenAddress,
                        takerAddress,
                        makerAddress,
                        bigNumberMatch(fillableAmount),
                        TradeSide.Taker,
                        TransferType.Trade,
                    ),
            ).to.be.true();
            expect(
                transferFromAsync
                    .getCall(2)
                    .calledWith(
                        zrxTokenAddress,
                        makerAddress,
                        feeRecipient,
                        bigNumberMatch(makerFee),
                        TradeSide.Maker,
                        TransferType.Fee,
                    ),
            ).to.be.true();
            expect(
                transferFromAsync
                    .getCall(3)
                    .calledWith(
                        zrxTokenAddress,
                        takerAddress,
                        feeRecipient,
                        bigNumberMatch(takerFee),
                        TradeSide.Taker,
                        TransferType.Fee,
                    ),
            ).to.be.true();
        });
        it('should call exchangeTransferSimulator.transferFrom with correct values for an open order', async () => {
            const makerFee = new BigNumber(2);
            const takerFee = new BigNumber(2);
            const signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerFee,
                takerFee,
                makerAddress,
                constants.NULL_ADDRESS,
                fillableAmount,
                feeRecipient,
            );
            await OrderValidationUtils.validateFillOrderBalancesAllowancesThrowIfInvalidAsync(
                exchangeTransferSimulator,
                signedOrder,
                fillableAmount,
                takerAddress,
                zrxTokenAddress,
            );
            expect(transferFromAsync.callCount).to.be.equal(4);
            expect(
                transferFromAsync
                    .getCall(0)
                    .calledWith(
                        makerTokenAddress,
                        makerAddress,
                        takerAddress,
                        bigNumberMatch(fillableAmount),
                        TradeSide.Maker,
                        TransferType.Trade,
                    ),
            ).to.be.true();
            expect(
                transferFromAsync
                    .getCall(1)
                    .calledWith(
                        takerTokenAddress,
                        takerAddress,
                        makerAddress,
                        bigNumberMatch(fillableAmount),
                        TradeSide.Taker,
                        TransferType.Trade,
                    ),
            ).to.be.true();
            expect(
                transferFromAsync
                    .getCall(2)
                    .calledWith(
                        zrxTokenAddress,
                        makerAddress,
                        feeRecipient,
                        bigNumberMatch(makerFee),
                        TradeSide.Maker,
                        TransferType.Fee,
                    ),
            ).to.be.true();
            expect(
                transferFromAsync
                    .getCall(3)
                    .calledWith(
                        zrxTokenAddress,
                        takerAddress,
                        feeRecipient,
                        bigNumberMatch(takerFee),
                        TradeSide.Taker,
                        TransferType.Fee,
                    ),
            ).to.be.true();
        });
        it('should correctly round the fillMakerTokenAmount', async () => {
            const makerTokenAmount = new BigNumber(3);
            const takerTokenAmount = new BigNumber(1);
            const signedOrder = await fillScenarios.createAsymmetricFillableSignedOrderAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerAddress,
                takerAddress,
                makerTokenAmount,
                takerTokenAmount,
            );
            await OrderValidationUtils.validateFillOrderBalancesAllowancesThrowIfInvalidAsync(
                exchangeTransferSimulator,
                signedOrder,
                takerTokenAmount,
                takerAddress,
                zrxTokenAddress,
            );
            expect(transferFromAsync.callCount).to.be.equal(4);
            const makerFillAmount = transferFromAsync.getCall(0).args[3];
            expect(makerFillAmount).to.be.bignumber.equal(makerTokenAmount);
        });
        it('should correctly round the makerFeeAmount', async () => {
            const makerFee = new BigNumber(2);
            const takerFee = new BigNumber(4);
            const signedOrder = await fillScenarios.createFillableSignedOrderWithFeesAsync(
                makerTokenAddress,
                takerTokenAddress,
                makerFee,
                takerFee,
                makerAddress,
                takerAddress,
                fillableAmount,
                constants.NULL_ADDRESS,
            );
            const fillTakerTokenAmount = fillableAmount.div(2).round(0);
            await OrderValidationUtils.validateFillOrderBalancesAllowancesThrowIfInvalidAsync(
                exchangeTransferSimulator,
                signedOrder,
                fillTakerTokenAmount,
                takerAddress,
                zrxTokenAddress,
            );
            const makerPartialFee = makerFee.div(2);
            const takerPartialFee = takerFee.div(2);
            expect(transferFromAsync.callCount).to.be.equal(4);
            const partialMakerFee = transferFromAsync.getCall(2).args[3];
            expect(partialMakerFee).to.be.bignumber.equal(makerPartialFee);
            const partialTakerFee = transferFromAsync.getCall(3).args[3];
            expect(partialTakerFee).to.be.bignumber.equal(takerPartialFee);
        });
    });
}); // tslint:disable-line:max-file-line-count
