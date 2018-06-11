import { ExchangeContractErrs, Order, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { OrderError, TradeSide, TransferType } from './types';

import { constants } from './constants';
import { ExchangeTransferSimulator } from './exchange_transfer_simulator';
import { ExchangeContract } from './generated_contract_wrappers/exchange';
import { orderHashUtils } from './order_hash';
import { isValidECSignature, parseECSignature } from './signature_utils';
import { utils } from './utils';

export class OrderValidationUtils {
    private _exchangeContract: ExchangeContract;
    // TODO: Write some tests for the function
    // const numerator = new BigNumber(20);
    // const denominator = new BigNumber(999);
    // const target = new BigNumber(50);
    // rounding error = ((20*50/999) - floor(20*50/999)) / (20*50/999) = 0.1%
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
        fillTakerTokenAmount: BigNumber,
        senderAddress: string,
        zrxTokenAddress: string,
    ): Promise<void> {
        const fillMakerTokenAmount = OrderValidationUtils._getPartialAmount(
            fillTakerTokenAmount,
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
            fillTakerTokenAmount,
            TradeSide.Taker,
            TransferType.Trade,
        );
        const makerFeeAmount = OrderValidationUtils._getPartialAmount(
            fillTakerTokenAmount,
            signedOrder.takerAssetAmount,
            signedOrder.makerFee,
        );
        await exchangeTradeEmulator.transferFromAsync(
            zrxTokenAddress,
            signedOrder.makerAddress,
            signedOrder.feeRecipientAddress,
            makerFeeAmount,
            TradeSide.Maker,
            TransferType.Fee,
        );
        const takerFeeAmount = OrderValidationUtils._getPartialAmount(
            fillTakerTokenAmount,
            signedOrder.takerAssetAmount,
            signedOrder.takerFee,
        );
        await exchangeTradeEmulator.transferFromAsync(
            zrxTokenAddress,
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
    constructor(exchangeContract: ExchangeContract) {
        this._exchangeContract = exchangeContract;
    }
    public async validateOrderFillableOrThrowAsync(
        exchangeTradeEmulator: ExchangeTransferSimulator,
        signedOrder: SignedOrder,
        zrxTokenAddress: string,
        expectedFillTakerTokenAmount?: BigNumber,
    ): Promise<void> {
        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        const filledTakerTokenAmount = await this._exchangeContract.filled.callAsync(orderHash);
        OrderValidationUtils._validateRemainingFillAmountNotZeroOrThrow(
            signedOrder.takerAssetAmount,
            filledTakerTokenAmount,
        );
        OrderValidationUtils._validateOrderNotExpiredOrThrow(signedOrder.expirationTimeSeconds);
        let fillTakerTokenAmount = signedOrder.takerAssetAmount.minus(filledTakerTokenAmount);
        if (!_.isUndefined(expectedFillTakerTokenAmount)) {
            fillTakerTokenAmount = expectedFillTakerTokenAmount;
        }
        await OrderValidationUtils.validateFillOrderBalancesAllowancesThrowIfInvalidAsync(
            exchangeTradeEmulator,
            signedOrder,
            fillTakerTokenAmount,
            signedOrder.takerAddress,
            zrxTokenAddress,
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
        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        // TODO: Verify all signature types! To do this, we need access to a Provider...
        const ecSignature = parseECSignature(signedOrder.signature);
        if (!isValidECSignature(orderHash, ecSignature, signedOrder.makerAddress)) {
            throw new Error(OrderError.InvalidSignature);
        }
        const filledTakerTokenAmount = await this._exchangeContract.filled.callAsync(orderHash);
        OrderValidationUtils._validateRemainingFillAmountNotZeroOrThrow(
            signedOrder.takerAssetAmount,
            filledTakerTokenAmount,
        );
        if (signedOrder.takerAddress !== constants.NULL_ADDRESS && signedOrder.takerAddress !== takerAddress) {
            throw new Error(ExchangeContractErrs.TransactionSenderIsNotFillOrderTaker);
        }
        OrderValidationUtils._validateOrderNotExpiredOrThrow(signedOrder.expirationTimeSeconds);
        const remainingTakerTokenAmount = signedOrder.takerAssetAmount.minus(filledTakerTokenAmount);
        const desiredFillTakerTokenAmount = remainingTakerTokenAmount.lessThan(fillTakerTokenAmount)
            ? remainingTakerTokenAmount
            : fillTakerTokenAmount;
        await OrderValidationUtils.validateFillOrderBalancesAllowancesThrowIfInvalidAsync(
            exchangeTradeEmulator,
            signedOrder,
            desiredFillTakerTokenAmount,
            takerAddress,
            zrxTokenAddress,
        );

        const wouldRoundingErrorOccur = OrderValidationUtils.isRoundingError(
            filledTakerTokenAmount,
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
