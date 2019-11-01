import { ExchangeContractErrs, RevertReason, SignedOrder } from '@0x/types';
import { BigNumber, providerUtils } from '@0x/utils';
import { SupportedProvider, ZeroExProvider } from 'ethereum-types';
import * as _ from 'lodash';

import { AbstractOrderFilledCancelledFetcher } from './abstract/abstract_order_filled_cancelled_fetcher';
import { constants } from './constants';
import { ExchangeTransferSimulator } from './exchange_transfer_simulator';
import { orderHashUtils } from './order_hash';
import { signatureUtils } from './signature_utils';
import { TradeSide, TransferType, TypedDataError } from './types';
import { utils } from './utils';

/**
 * A utility class for validating orders
 */
export class OrderValidationUtils {
    private readonly _orderFilledCancelledFetcher: AbstractOrderFilledCancelledFetcher;
    private readonly _provider: ZeroExProvider;
    /**
     * A TypeScript implementation mirroring the implementation of isRoundingError in the
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
        const makerFeeAmount = utils.getPartialAmountFloor(
            fillTakerAssetAmount,
            signedOrder.takerAssetAmount,
            signedOrder.makerFee,
        );
        const takerFeeAmount = utils.getPartialAmountFloor(
            fillTakerAssetAmount,
            signedOrder.takerAssetAmount,
            signedOrder.takerFee,
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
        await exchangeTradeEmulator.transferFromAsync(
            signedOrder.makerFeeAssetData,
            signedOrder.makerAddress,
            signedOrder.feeRecipientAddress,
            makerFeeAmount,
            TradeSide.Maker,
            TransferType.Fee,
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
        OrderValidationUtils._validateOrderNotExpiredOrThrow(signedOrder.expirationTimeSeconds);
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
            throw new Error(TypedDataError.InvalidSignature);
        }
        const filledTakerTokenAmount = await this._orderFilledCancelledFetcher.getFilledTakerAmountAsync(orderHash);
        if (signedOrder.takerAssetAmount.eq(filledTakerTokenAmount)) {
            throw new Error(RevertReason.OrderUnfillable);
        }
        if (signedOrder.takerAddress !== constants.NULL_ADDRESS && signedOrder.takerAddress !== takerAddress) {
            throw new Error(RevertReason.InvalidTaker);
        }
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
