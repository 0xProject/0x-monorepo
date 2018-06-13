import { ExchangeContractErrs, Order, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Provider } from 'ethereum-types';
import * as _ from 'lodash';

import { OrderError, TradeSide, TransferType } from './types';

import { AbstractOrderFilledCancelledFetcher } from './abstract/abstract_order_filled_cancelled_fetcher';
import { constants } from './constants';
import { ExchangeTransferSimulator } from './exchange_transfer_simulator';
import { orderHashUtils } from './order_hash';
import { isValidSignatureAsync } from './signature_utils';
import { utils } from './utils';

export class OrderValidationUtils {
    private _orderFilledCancelledFetcher: AbstractOrderFilledCancelledFetcher;
    public static isRoundingError(numerator: BigNumber, denominator: BigNumber, target: BigNumber): boolean {
        // Solidity's mulmod() in JS
        // Source: https://solidity.readthedocs.io/en/latest/units-and-global-variables.html#mathematical-and-cryptographic-functions
        if (denominator.eq(0)) {
            throw new Error('denominator cannot be 0');
        }
        const remainder = target.mul(numerator).mod(denominator);
        if (remainder.eq(0)) {
            return false; // no rounding error
        }

        // tslint:disable-next-line:custom-no-magic-numbers
        const errPercentageTimes1000000 = remainder.mul(1000000).div(numerator.mul(target));
        // tslint:disable-next-line:custom-no-magic-numbers
        const isError = errPercentageTimes1000000.gt(1000);
        return isError;
    }
    public static validateCancelOrderThrowIfInvalid(
        order: Order,
        cancelTakerTokenAmount: BigNumber,
        filledTakerTokenAmount: BigNumber,
    ): void {
        if (cancelTakerTokenAmount.eq(0)) {
            throw new Error(ExchangeContractErrs.OrderCancelAmountZero);
        }
        if (order.takerAssetAmount.eq(filledTakerTokenAmount)) {
            throw new Error(ExchangeContractErrs.OrderAlreadyCancelledOrFilled);
        }
        const currentUnixTimestampSec = utils.getCurrentUnixTimestampSec();
        if (order.expirationTimeSeconds.lessThan(currentUnixTimestampSec)) {
            throw new Error(ExchangeContractErrs.OrderCancelExpired);
        }
    }
    public static async validateFillOrderBalancesAllowancesThrowIfInvalidAsync(
        exchangeTradeEmulator: ExchangeTransferSimulator,
        signedOrder: SignedOrder,
        fillTakerAssetAmount: BigNumber,
        senderAddress: string,
        zrxAssetData: string,
    ): Promise<void> {
        const fillMakerTokenAmount = OrderValidationUtils._getPartialAmount(
            fillTakerAssetAmount,
            signedOrder.takerAssetAmount,
            signedOrder.makerAssetAmount,
        );
        await exchangeTradeEmulator.transferFromAsync(
            signedOrder.makerAssetData,
            signedOrder.makerAddress,
            senderAddress,
            fillMakerTokenAmount,
            TradeSide.Maker,
            TransferType.Trade,
        );
        await exchangeTradeEmulator.transferFromAsync(
            signedOrder.takerAssetData,
            senderAddress,
            signedOrder.makerAddress,
            fillTakerAssetAmount,
            TradeSide.Taker,
            TransferType.Trade,
        );
        const makerFeeAmount = OrderValidationUtils._getPartialAmount(
            fillTakerAssetAmount,
            signedOrder.takerAssetAmount,
            signedOrder.makerFee,
        );
        await exchangeTradeEmulator.transferFromAsync(
            zrxAssetData,
            signedOrder.makerAddress,
            signedOrder.feeRecipientAddress,
            makerFeeAmount,
            TradeSide.Maker,
            TransferType.Fee,
        );
        const takerFeeAmount = OrderValidationUtils._getPartialAmount(
            fillTakerAssetAmount,
            signedOrder.takerAssetAmount,
            signedOrder.takerFee,
        );
        await exchangeTradeEmulator.transferFromAsync(
            zrxAssetData,
            senderAddress,
            signedOrder.feeRecipientAddress,
            takerFeeAmount,
            TradeSide.Taker,
            TransferType.Fee,
        );
    }
    private static _validateRemainingFillAmountNotZeroOrThrow(
        takerAssetAmount: BigNumber,
        filledTakerTokenAmount: BigNumber,
    ): void {
        if (takerAssetAmount.eq(filledTakerTokenAmount)) {
            throw new Error(ExchangeContractErrs.OrderRemainingFillAmountZero);
        }
    }
    private static _validateOrderNotExpiredOrThrow(expirationTimeSeconds: BigNumber): void {
        const currentUnixTimestampSec = utils.getCurrentUnixTimestampSec();
        if (expirationTimeSeconds.lessThan(currentUnixTimestampSec)) {
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
    constructor(orderFilledCancelledFetcher: AbstractOrderFilledCancelledFetcher) {
        this._orderFilledCancelledFetcher = orderFilledCancelledFetcher;
    }
    public async validateOrderFillableOrThrowAsync(
        exchangeTradeEmulator: ExchangeTransferSimulator,
        signedOrder: SignedOrder,
        zrxAssetData: string,
        expectedFillTakerTokenAmount?: BigNumber,
    ): Promise<void> {
        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        const filledTakerTokenAmount = await this._orderFilledCancelledFetcher.getFilledTakerAmountAsync(orderHash);
        OrderValidationUtils._validateRemainingFillAmountNotZeroOrThrow(
            signedOrder.takerAssetAmount,
            filledTakerTokenAmount,
        );
        OrderValidationUtils._validateOrderNotExpiredOrThrow(signedOrder.expirationTimeSeconds);
        let fillTakerAssetAmount = signedOrder.takerAssetAmount.minus(filledTakerTokenAmount);
        if (!_.isUndefined(expectedFillTakerTokenAmount)) {
            fillTakerAssetAmount = expectedFillTakerTokenAmount;
        }
        await OrderValidationUtils.validateFillOrderBalancesAllowancesThrowIfInvalidAsync(
            exchangeTradeEmulator,
            signedOrder,
            fillTakerAssetAmount,
            signedOrder.takerAddress,
            zrxAssetData,
        );
    }
    public async validateFillOrderThrowIfInvalidAsync(
        exchangeTradeEmulator: ExchangeTransferSimulator,
        provider: Provider,
        signedOrder: SignedOrder,
        fillTakerAssetAmount: BigNumber,
        takerAddress: string,
        zrxAssetData: string,
    ): Promise<BigNumber> {
        if (fillTakerAssetAmount.eq(0)) {
            throw new Error(ExchangeContractErrs.OrderFillAmountZero);
        }
        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        const isValid = await isValidSignatureAsync(
            provider,
            orderHash,
            signedOrder.signature,
            signedOrder.makerAddress,
        );
        if (!isValid) {
            throw new Error(OrderError.InvalidSignature);
        }
        const filledTakerTokenAmount = await this._orderFilledCancelledFetcher.getFilledTakerAmountAsync(orderHash);
        OrderValidationUtils._validateRemainingFillAmountNotZeroOrThrow(
            signedOrder.takerAssetAmount,
            filledTakerTokenAmount,
        );
        if (signedOrder.takerAddress !== constants.NULL_ADDRESS && signedOrder.takerAddress !== takerAddress) {
            throw new Error(ExchangeContractErrs.TransactionSenderIsNotFillOrderTaker);
        }
        OrderValidationUtils._validateOrderNotExpiredOrThrow(signedOrder.expirationTimeSeconds);
        const remainingTakerTokenAmount = signedOrder.takerAssetAmount.minus(filledTakerTokenAmount);
        const desiredFillTakerTokenAmount = remainingTakerTokenAmount.lessThan(fillTakerAssetAmount)
            ? remainingTakerTokenAmount
            : fillTakerAssetAmount;
        await OrderValidationUtils.validateFillOrderBalancesAllowancesThrowIfInvalidAsync(
            exchangeTradeEmulator,
            signedOrder,
            desiredFillTakerTokenAmount,
            takerAddress,
            zrxAssetData,
        );

        const wouldRoundingErrorOccur = OrderValidationUtils.isRoundingError(
            desiredFillTakerTokenAmount,
            signedOrder.takerAssetAmount,
            signedOrder.makerAssetAmount,
        );
        if (wouldRoundingErrorOccur) {
            throw new Error(ExchangeContractErrs.OrderFillRoundingError);
        }
        return filledTakerTokenAmount;
    }
    public async validateFillOrKillOrderThrowIfInvalidAsync(
        exchangeTradeEmulator: ExchangeTransferSimulator,
        provider: Provider,
        signedOrder: SignedOrder,
        fillTakerAssetAmount: BigNumber,
        takerAddress: string,
        zrxAssetData: string,
    ): Promise<void> {
        const filledTakerTokenAmount = await this.validateFillOrderThrowIfInvalidAsync(
            exchangeTradeEmulator,
            provider,
            signedOrder,
            fillTakerAssetAmount,
            takerAddress,
            zrxAssetData,
        );
        if (filledTakerTokenAmount !== fillTakerAssetAmount) {
            throw new Error(ExchangeContractErrs.InsufficientRemainingFillAmount);
        }
    }
}
