import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { ZeroEx } from '../0x';
import { ExchangeWrapper } from '../contract_wrappers/exchange_wrapper';
import { ExchangeContractErrs, Order, SignedOrder, TradeSide, TransferType, ZeroExError } from '../types';
import { constants } from '../utils/constants';
import { utils } from '../utils/utils';

import { ExchangeTransferSimulator } from './exchange_transfer_simulator';

export class OrderValidationUtils {
    private _exchangeWrapper: ExchangeWrapper;
    public static validateCancelOrderThrowIfInvalid(
        order: Order,
        cancelTakerTokenAmount: BigNumber,
        unavailableTakerTokenAmount: BigNumber,
    ): void {
        if (cancelTakerTokenAmount.eq(0)) {
            throw new Error(ExchangeContractErrs.OrderCancelAmountZero);
        }
        if (order.takerTokenAmount.eq(unavailableTakerTokenAmount)) {
            throw new Error(ExchangeContractErrs.OrderAlreadyCancelledOrFilled);
        }
        const currentUnixTimestampSec = utils.getCurrentUnixTimestampSec();
        if (order.expirationUnixTimestampSec.lessThan(currentUnixTimestampSec)) {
            throw new Error(ExchangeContractErrs.OrderCancelExpired);
        }
    }
    public static async validateFillOrderBalancesAllowancesThrowIfInvalidAsync(
        exchangeTradeEmulator: ExchangeTransferSimulator,
        signedOrder: SignedOrder,
        fillTakerTokenAmount: BigNumber,
        senderAddress: string,
        zrxTokenAddress: string,
    ): Promise<void> {
        const fillMakerTokenAmount = OrderValidationUtils._getPartialAmount(
            fillTakerTokenAmount,
            signedOrder.takerTokenAmount,
            signedOrder.makerTokenAmount,
        );
        await exchangeTradeEmulator.transferFromAsync(
            signedOrder.makerTokenAddress,
            signedOrder.maker,
            senderAddress,
            fillMakerTokenAmount,
            TradeSide.Maker,
            TransferType.Trade,
        );
        await exchangeTradeEmulator.transferFromAsync(
            signedOrder.takerTokenAddress,
            senderAddress,
            signedOrder.maker,
            fillTakerTokenAmount,
            TradeSide.Taker,
            TransferType.Trade,
        );
        const makerFeeAmount = OrderValidationUtils._getPartialAmount(
            fillTakerTokenAmount,
            signedOrder.takerTokenAmount,
            signedOrder.makerFee,
        );
        await exchangeTradeEmulator.transferFromAsync(
            zrxTokenAddress,
            signedOrder.maker,
            signedOrder.feeRecipient,
            makerFeeAmount,
            TradeSide.Maker,
            TransferType.Fee,
        );
        const takerFeeAmount = OrderValidationUtils._getPartialAmount(
            fillTakerTokenAmount,
            signedOrder.takerTokenAmount,
            signedOrder.takerFee,
        );
        await exchangeTradeEmulator.transferFromAsync(
            zrxTokenAddress,
            senderAddress,
            signedOrder.feeRecipient,
            takerFeeAmount,
            TradeSide.Taker,
            TransferType.Fee,
        );
    }
    private static _validateRemainingFillAmountNotZeroOrThrow(
        takerTokenAmount: BigNumber,
        unavailableTakerTokenAmount: BigNumber,
    ) {
        if (takerTokenAmount.eq(unavailableTakerTokenAmount)) {
            throw new Error(ExchangeContractErrs.OrderRemainingFillAmountZero);
        }
    }
    private static _validateOrderNotExpiredOrThrow(expirationUnixTimestampSec: BigNumber) {
        const currentUnixTimestampSec = utils.getCurrentUnixTimestampSec();
        if (expirationUnixTimestampSec.lessThan(currentUnixTimestampSec)) {
            throw new Error(ExchangeContractErrs.OrderFillExpired);
        }
    }
    private static _getPartialAmount(numerator: BigNumber, denominator: BigNumber, target: BigNumber): BigNumber {
        const fillMakerTokenAmount = numerator
            .mul(target)
            .div(denominator)
            .round(0);
        return fillMakerTokenAmount;
    }
    constructor(exchangeWrapper: ExchangeWrapper) {
        this._exchangeWrapper = exchangeWrapper;
    }
    public async validateOrderFillableOrThrowAsync(
        exchangeTradeEmulator: ExchangeTransferSimulator,
        signedOrder: SignedOrder,
        zrxTokenAddress: string,
        expectedFillTakerTokenAmount?: BigNumber,
    ): Promise<void> {
        const orderHash = utils.getOrderHashHex(signedOrder);
        const unavailableTakerTokenAmount = await this._exchangeWrapper.getUnavailableTakerAmountAsync(orderHash);
        OrderValidationUtils._validateRemainingFillAmountNotZeroOrThrow(
            signedOrder.takerTokenAmount,
            unavailableTakerTokenAmount,
        );
        OrderValidationUtils._validateOrderNotExpiredOrThrow(signedOrder.expirationUnixTimestampSec);
        let fillTakerTokenAmount = signedOrder.takerTokenAmount.minus(unavailableTakerTokenAmount);
        if (!_.isUndefined(expectedFillTakerTokenAmount)) {
            fillTakerTokenAmount = expectedFillTakerTokenAmount;
        }
        const fillMakerTokenAmount = OrderValidationUtils._getPartialAmount(
            fillTakerTokenAmount,
            signedOrder.takerTokenAmount,
            signedOrder.makerTokenAmount,
        );
        await exchangeTradeEmulator.transferFromAsync(
            signedOrder.makerTokenAddress,
            signedOrder.maker,
            signedOrder.taker,
            fillMakerTokenAmount,
            TradeSide.Maker,
            TransferType.Trade,
        );
        const makerFeeAmount = OrderValidationUtils._getPartialAmount(
            fillTakerTokenAmount,
            signedOrder.takerTokenAmount,
            signedOrder.makerFee,
        );
        await exchangeTradeEmulator.transferFromAsync(
            zrxTokenAddress,
            signedOrder.maker,
            signedOrder.feeRecipient,
            makerFeeAmount,
            TradeSide.Maker,
            TransferType.Fee,
        );
    }
    public async validateFillOrderThrowIfInvalidAsync(
        exchangeTradeEmulator: ExchangeTransferSimulator,
        signedOrder: SignedOrder,
        fillTakerTokenAmount: BigNumber,
        takerAddress: string,
        zrxTokenAddress: string,
    ): Promise<BigNumber> {
        if (fillTakerTokenAmount.eq(0)) {
            throw new Error(ExchangeContractErrs.OrderFillAmountZero);
        }
        const orderHash = utils.getOrderHashHex(signedOrder);
        if (!ZeroEx.isValidSignature(orderHash, signedOrder.ecSignature, signedOrder.maker)) {
            throw new Error(ZeroExError.InvalidSignature);
        }
        const unavailableTakerTokenAmount = await this._exchangeWrapper.getUnavailableTakerAmountAsync(orderHash);
        OrderValidationUtils._validateRemainingFillAmountNotZeroOrThrow(
            signedOrder.takerTokenAmount,
            unavailableTakerTokenAmount,
        );
        if (signedOrder.taker !== constants.NULL_ADDRESS && signedOrder.taker !== takerAddress) {
            throw new Error(ExchangeContractErrs.TransactionSenderIsNotFillOrderTaker);
        }
        OrderValidationUtils._validateOrderNotExpiredOrThrow(signedOrder.expirationUnixTimestampSec);
        const remainingTakerTokenAmount = signedOrder.takerTokenAmount.minus(unavailableTakerTokenAmount);
        const filledTakerTokenAmount = remainingTakerTokenAmount.lessThan(fillTakerTokenAmount)
            ? remainingTakerTokenAmount
            : fillTakerTokenAmount;
        await OrderValidationUtils.validateFillOrderBalancesAllowancesThrowIfInvalidAsync(
            exchangeTradeEmulator,
            signedOrder,
            filledTakerTokenAmount,
            takerAddress,
            zrxTokenAddress,
        );

        const wouldRoundingErrorOccur = await this._exchangeWrapper.isRoundingErrorAsync(
            filledTakerTokenAmount,
            signedOrder.takerTokenAmount,
            signedOrder.makerTokenAmount,
        );
        if (wouldRoundingErrorOccur) {
            throw new Error(ExchangeContractErrs.OrderFillRoundingError);
        }
        return filledTakerTokenAmount;
    }
    public async validateFillOrKillOrderThrowIfInvalidAsync(
        exchangeTradeEmulator: ExchangeTransferSimulator,
        signedOrder: SignedOrder,
        fillTakerTokenAmount: BigNumber,
        takerAddress: string,
        zrxTokenAddress: string,
    ): Promise<void> {
        const filledTakerTokenAmount = await this.validateFillOrderThrowIfInvalidAsync(
            exchangeTradeEmulator,
            signedOrder,
            fillTakerTokenAmount,
            takerAddress,
            zrxTokenAddress,
        );
        if (filledTakerTokenAmount !== fillTakerTokenAmount) {
            throw new Error(ExchangeContractErrs.InsufficientRemainingFillAmount);
        }
    }
}
