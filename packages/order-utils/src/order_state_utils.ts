import {
    ExchangeContractErrs,
    OrderRelevantState,
    OrderState,
    OrderStateInvalid,
    OrderStateValid,
    SignedOrder,
} from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';

import { AbstractBalanceAndProxyAllowanceFetcher } from './abstract/abstract_balance_and_proxy_allowance_fetcher';
import { AbstractOrderFilledCancelledFetcher } from './abstract/abstract_order_filled_cancelled_fetcher';
import { assetProxyUtils } from './asset_proxy_utils';
import { orderHashUtils } from './order_hash';
import { RemainingFillableCalculator } from './remaining_fillable_calculator';

const ACCEPTABLE_RELATIVE_ROUNDING_ERROR = 0.0001;

export class OrderStateUtils {
    private _balanceAndProxyAllowanceFetcher: AbstractBalanceAndProxyAllowanceFetcher;
    private _orderFilledCancelledFetcher: AbstractOrderFilledCancelledFetcher;
    private static _validateIfOrderIsValid(signedOrder: SignedOrder, orderRelevantState: OrderRelevantState): void {
        const availableTakerAssetAmount = signedOrder.takerAssetAmount.minus(orderRelevantState.filledTakerAssetAmount);
        if (availableTakerAssetAmount.eq(0)) {
            throw new Error(ExchangeContractErrs.OrderRemainingFillAmountZero);
        }

        if (orderRelevantState.makerBalance.eq(0)) {
            throw new Error(ExchangeContractErrs.InsufficientMakerBalance);
        }
        if (orderRelevantState.makerProxyAllowance.eq(0)) {
            throw new Error(ExchangeContractErrs.InsufficientMakerAllowance);
        }
        if (!signedOrder.makerFee.eq(0)) {
            if (orderRelevantState.makerFeeBalance.eq(0)) {
                throw new Error(ExchangeContractErrs.InsufficientMakerFeeBalance);
            }
            if (orderRelevantState.makerFeeProxyAllowance.eq(0)) {
                throw new Error(ExchangeContractErrs.InsufficientMakerFeeAllowance);
            }
        }
        const minFillableTakerAssetAmountWithinNoRoundingErrorRange = signedOrder.takerAssetAmount
            .dividedBy(ACCEPTABLE_RELATIVE_ROUNDING_ERROR)
            .dividedBy(signedOrder.makerAssetAmount);
        if (
            orderRelevantState.remainingFillableTakerAssetAmount.lessThan(
                minFillableTakerAssetAmountWithinNoRoundingErrorRange,
            )
        ) {
            throw new Error(ExchangeContractErrs.OrderFillRoundingError);
        }
    }
    constructor(
        balanceAndProxyAllowanceFetcher: AbstractBalanceAndProxyAllowanceFetcher,
        orderFilledCancelledFetcher: AbstractOrderFilledCancelledFetcher,
    ) {
        this._balanceAndProxyAllowanceFetcher = balanceAndProxyAllowanceFetcher;
        this._orderFilledCancelledFetcher = orderFilledCancelledFetcher;
    }
    public async getOrderStateAsync(signedOrder: SignedOrder): Promise<OrderState> {
        const orderRelevantState = await this.getOrderRelevantStateAsync(signedOrder);
        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        try {
            OrderStateUtils._validateIfOrderIsValid(signedOrder, orderRelevantState);
            const orderState: OrderStateValid = {
                isValid: true,
                orderHash,
                orderRelevantState,
            };
            return orderState;
        } catch (err) {
            const orderState: OrderStateInvalid = {
                isValid: false,
                orderHash,
                error: err.message,
            };
            return orderState;
        }
    }
    public async getOrderRelevantStateAsync(signedOrder: SignedOrder): Promise<OrderRelevantState> {
        const zrxTokenAddress = this._orderFilledCancelledFetcher.getZRXTokenAddress();
        const makerProxyData = assetProxyUtils.decodeERC20AssetData(signedOrder.makerAssetData);
        const makerAssetAddress = makerProxyData.tokenAddress;
        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        const makerBalance = await this._balanceAndProxyAllowanceFetcher.getBalanceAsync(
            makerAssetAddress,
            signedOrder.makerAddress,
        );
        const makerProxyAllowance = await this._balanceAndProxyAllowanceFetcher.getProxyAllowanceAsync(
            makerAssetAddress,
            signedOrder.makerAddress,
        );
        const makerFeeBalance = await this._balanceAndProxyAllowanceFetcher.getBalanceAsync(
            zrxTokenAddress,
            signedOrder.makerAddress,
        );
        const makerFeeProxyAllowance = await this._balanceAndProxyAllowanceFetcher.getProxyAllowanceAsync(
            zrxTokenAddress,
            signedOrder.makerAddress,
        );
        const filledTakerAssetAmount = await this._orderFilledCancelledFetcher.getFilledTakerAmountAsync(orderHash);
        const isOrderCancelled = await this._orderFilledCancelledFetcher.isOrderCancelledAsync(orderHash);
        const totalMakerAssetAmount = signedOrder.makerAssetAmount;
        const totalTakerAssetAmount = signedOrder.takerAssetAmount;
        const remainingTakerAssetAmount = isOrderCancelled
            ? new BigNumber(0)
            : totalTakerAssetAmount.minus(filledTakerAssetAmount);
        const remainingMakerAssetAmount = remainingTakerAssetAmount
            .times(totalMakerAssetAmount)
            .dividedToIntegerBy(totalTakerAssetAmount);
        const transferrableMakerAssetAmount = BigNumber.min([makerProxyAllowance, makerBalance]);
        const transferrableFeeAssetAmount = BigNumber.min([makerFeeProxyAllowance, makerFeeBalance]);

        const zrxAssetData = assetProxyUtils.encodeERC20AssetData(zrxTokenAddress);
        const isMakerAssetZRX = signedOrder.makerAssetData === zrxAssetData;
        const remainingFillableCalculator = new RemainingFillableCalculator(
            signedOrder.makerFee,
            signedOrder.makerAssetAmount,
            isMakerAssetZRX,
            transferrableMakerAssetAmount,
            transferrableFeeAssetAmount,
            remainingMakerAssetAmount,
        );
        const remainingFillableMakerAssetAmount = remainingFillableCalculator.computeRemainingFillable();
        const remainingFillableTakerAssetAmount = remainingFillableMakerAssetAmount
            .times(signedOrder.takerAssetAmount)
            .dividedToIntegerBy(signedOrder.makerAssetAmount);
        const orderRelevantState = {
            makerBalance,
            makerProxyAllowance,
            makerFeeBalance,
            makerFeeProxyAllowance,
            filledTakerAssetAmount,
            remainingFillableMakerAssetAmount,
            remainingFillableTakerAssetAmount,
        };
        return orderRelevantState;
    }
}
