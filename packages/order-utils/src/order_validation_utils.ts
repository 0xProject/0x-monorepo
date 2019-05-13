import { ExchangeContractErrs, RevertReason, SignedOrder } from '@0x/types';
import { BigNumber, providerUtils } from '@0x/utils';
import { SupportedProvider, ZeroExProvider } from 'ethereum-types';
import * as _ from 'lodash';

import { OrderError, TradeSide, TransferType } from './types';

import { AbstractOrderFilledCancelledFetcher } from './abstract/abstract_order_filled_cancelled_fetcher';
import { constants } from './constants';
import { ExchangeTransferSimulator } from './exchange_transfer_simulator';
import { orderHashUtils } from './order_hash';
import { signatureUtils } from './signature_utils';
import { utils } from './utils';

/**
 * A utility class for validating orders
 */
export class OrderValidationUtils {
    private readonly _orderFilledCancelledFetcher: AbstractOrderFilledCancelledFetcher;
    private readonly _provider: ZeroExProvider;
    /**
     * A Typescript implementation mirroring the implementation of isRoundingError in the
     * Exchange smart contract
     * @param numerator Numerator value. When used to check an order, pass in `takerAssetFilledAmount`
     * @param denominator Denominator value.  When used to check an order, pass in `order.takerAssetAmount`
     * @param target Target value. When used to check an order, pass in `order.makerAssetAmount`
     */
    public static isRoundingErrorFloor(numerator: BigNumber, denominator: BigNumber, target: BigNumber): boolean {
        // Solidity's mulmod() in JS
        // Source: https://solidity.readthedocs.io/en/latest/units-and-global-variables.html#mathematical-and-cryptographic-functions
        if (denominator.eq(0)) {
            throw new Error('denominator cannot be 0');
        }
        const remainder = target.multipliedBy(numerator).mod(denominator);
        if (remainder.eq(0)) {
            return false; // no rounding error
        }

        // tslint:disable-next-line:custom-no-magic-numbers
        const errPercentageTimes1000000 = remainder.multipliedBy(1000000).div(numerator.multipliedBy(target));
        // tslint:disable-next-line:custom-no-magic-numbers
        const isError = errPercentageTimes1000000.gt(1000);
        return isError;
    }
    /**
     * Validate that the maker & taker have sufficient balances/allowances
     * to fill the supplied order to the fillTakerAssetAmount amount
     * @param exchangeTradeEmulator ExchangeTradeEmulator to use
     * @param signedOrder SignedOrder to test
     * @param fillTakerAssetAmount Amount of takerAsset to fill the signedOrder
     * @param senderAddress Sender of the fillOrder tx
     */
    public static async validateFillOrderBalancesAllowancesThrowIfInvalidAsync(
        exchangeTradeEmulator: ExchangeTransferSimulator,
        signedOrder: SignedOrder,
        fillTakerAssetAmount: BigNumber,
        senderAddress: string,
    ): Promise<void> {
        const fillMakerTokenAmount = utils.getPartialAmountFloor(
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
        const makerFeeAmount = utils.getPartialAmountFloor(
            fillTakerAssetAmount,
            signedOrder.takerAssetAmount,
            signedOrder.makerFee,
        );
        await exchangeTradeEmulator.transferFromAsync(
            signedOrder.makerFeeAssetData,
            signedOrder.makerAddress,
            signedOrder.feeRecipientAddress,
            makerFeeAmount,
            TradeSide.Maker,
            TransferType.Fee,
        );
        const takerFeeAmount = utils.getPartialAmountFloor(
            fillTakerAssetAmount,
            signedOrder.takerAssetAmount,
            signedOrder.takerFee,
        );
        await exchangeTradeEmulator.transferFromAsync(
            signedOrder.takerFeeAssetData,
            senderAddress,
            signedOrder.feeRecipientAddress,
            takerFeeAmount,
            TradeSide.Taker,
            TransferType.Fee,
        );
    }
    private static _validateOrderNotExpiredOrThrow(expirationTimeSeconds: BigNumber): void {
        const currentUnixTimestampSec = utils.getCurrentUnixTimestampSec();
        if (expirationTimeSeconds.isLessThan(currentUnixTimestampSec)) {
            throw new Error(RevertReason.OrderUnfillable);
        }
    }
    /**
     * Instantiate OrderValidationUtils
     * @param orderFilledCancelledFetcher A module that implements the AbstractOrderFilledCancelledFetcher
     * @param supportedProvider Web3 provider to use for JSON RPC calls
     * @return An instance of OrderValidationUtils
     */
    constructor(
        orderFilledCancelledFetcher: AbstractOrderFilledCancelledFetcher,
        supportedProvider: SupportedProvider,
    ) {
        this._orderFilledCancelledFetcher = orderFilledCancelledFetcher;
        this._provider = providerUtils.standardizeOrThrow(supportedProvider);
    }
    // TODO(fabio): remove this method once the smart contracts have been refactored
    // to return helpful revert reasons instead of ORDER_UNFILLABLE. Instruct devs
    // to make "calls" to validate order fillability + getOrderInfo for fillable amount.
    /**
     * Validate if the supplied order is fillable, and throw if it isn't
     * @param exchangeTradeEmulator ExchangeTradeEmulator instance
     * @param signedOrder SignedOrder of interest
     * @param expectedFillTakerTokenAmount If supplied, this call will make sure this amount is fillable.
     * If it isn't supplied, we check if the order is fillable for a non-zero amount
     */
    public async validateOrderFillableOrThrowAsync(
        exchangeTradeEmulator: ExchangeTransferSimulator,
        signedOrder: SignedOrder,
        expectedFillTakerTokenAmount?: BigNumber,
    ): Promise<void> {
        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        const isValidSignature = await signatureUtils.isValidSignatureAsync(
            this._provider,
            orderHash,
            signedOrder.signature,
            signedOrder.makerAddress,
        );
        if (!isValidSignature) {
            throw new Error(RevertReason.InvalidOrderSignature);
        }

        const isCancelled = await this._orderFilledCancelledFetcher.isOrderCancelledAsync(signedOrder);
        if (isCancelled) {
            throw new Error('CANCELLED');
        }
        const filledTakerTokenAmount = await this._orderFilledCancelledFetcher.getFilledTakerAmountAsync(orderHash);
        if (signedOrder.takerAssetAmount.eq(filledTakerTokenAmount)) {
            throw new Error('FULLY_FILLED');
        }
        try {
            OrderValidationUtils._validateOrderNotExpiredOrThrow(signedOrder.expirationTimeSeconds);
        } catch (err) {
            throw new Error('EXPIRED');
        }
        let fillTakerAssetAmount = signedOrder.takerAssetAmount.minus(filledTakerTokenAmount);
        if (expectedFillTakerTokenAmount !== undefined) {
            fillTakerAssetAmount = expectedFillTakerTokenAmount;
        }
        await OrderValidationUtils.validateFillOrderBalancesAllowancesThrowIfInvalidAsync(
            exchangeTradeEmulator,
            signedOrder,
            fillTakerAssetAmount,
            signedOrder.takerAddress,
        );
    }
    /**
     * Validate a call to FillOrder and throw if it wouldn't succeed
     * @param exchangeTradeEmulator ExchangeTradeEmulator to use
     * @param signedOrder SignedOrder of interest
     * @param fillTakerAssetAmount Amount we'd like to fill the order for
     * @param takerAddress The taker of the order
     */
    public async validateFillOrderThrowIfInvalidAsync(
        exchangeTradeEmulator: ExchangeTransferSimulator,
        signedOrder: SignedOrder,
        fillTakerAssetAmount: BigNumber,
        takerAddress: string,
    ): Promise<BigNumber> {
        if (signedOrder.makerAssetAmount.eq(0) || signedOrder.takerAssetAmount.eq(0)) {
            throw new Error(RevertReason.OrderUnfillable);
        }
        if (fillTakerAssetAmount.eq(0)) {
            throw new Error(RevertReason.InvalidTakerAmount);
        }

        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        const isValid = await signatureUtils.isValidSignatureAsync(
            this._provider,
            orderHash,
            signedOrder.signature,
            signedOrder.makerAddress,
        );
        if (!isValid) {
            throw new Error(OrderError.InvalidSignature);
        }
        const filledTakerTokenAmount = await this._orderFilledCancelledFetcher.getFilledTakerAmountAsync(orderHash);
        if (signedOrder.takerAssetAmount.eq(filledTakerTokenAmount)) {
            throw new Error(RevertReason.OrderUnfillable);
        }
        if (signedOrder.takerAddress !== constants.NULL_ADDRESS && signedOrder.takerAddress !== takerAddress) {
            throw new Error(RevertReason.InvalidTaker);
        }
        OrderValidationUtils._validateOrderNotExpiredOrThrow(signedOrder.expirationTimeSeconds);
        const remainingTakerTokenAmount = signedOrder.takerAssetAmount.minus(filledTakerTokenAmount);
        const desiredFillTakerTokenAmount = remainingTakerTokenAmount.isLessThan(fillTakerAssetAmount)
            ? remainingTakerTokenAmount
            : fillTakerAssetAmount;
        try {
            await OrderValidationUtils.validateFillOrderBalancesAllowancesThrowIfInvalidAsync(
                exchangeTradeEmulator,
                signedOrder,
                desiredFillTakerTokenAmount,
                takerAddress,
            );
        } catch (err) {
            const transferFailedErrorMessages = [
                ExchangeContractErrs.InsufficientMakerBalance,
                ExchangeContractErrs.InsufficientMakerFeeBalance,
                ExchangeContractErrs.InsufficientTakerBalance,
                ExchangeContractErrs.InsufficientTakerFeeBalance,
                ExchangeContractErrs.InsufficientMakerAllowance,
                ExchangeContractErrs.InsufficientMakerFeeAllowance,
                ExchangeContractErrs.InsufficientTakerAllowance,
                ExchangeContractErrs.InsufficientTakerFeeAllowance,
            ];
            if (_.includes(transferFailedErrorMessages, err.message)) {
                throw new Error(RevertReason.TransferFailed);
            }
            throw err;
        }

        const wouldRoundingErrorOccur = OrderValidationUtils.isRoundingErrorFloor(
            desiredFillTakerTokenAmount,
            signedOrder.takerAssetAmount,
            signedOrder.makerAssetAmount,
        );
        if (wouldRoundingErrorOccur) {
            throw new Error(RevertReason.RoundingError);
        }
        return filledTakerTokenAmount;
    }
}
