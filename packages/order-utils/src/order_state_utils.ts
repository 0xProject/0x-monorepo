import {
    ExchangeContractErrs,
    OrderRelevantState,
    OrderState,
    OrderStateInvalid,
    OrderStateValid,
    SignedOrder,
} from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

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
        const unavailableTakerTokenAmount = orderRelevantState.cancelledTakerTokenAmount.add(
            orderRelevantState.filledTakerTokenAmount,
        );
        const availableTakerTokenAmount = signedOrder.takerAssetAmount.minus(unavailableTakerTokenAmount);
        if (availableTakerTokenAmount.eq(0)) {
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
        const minFillableTakerTokenAmountWithinNoRoundingErrorRange = signedOrder.takerAssetAmount
            .dividedBy(ACCEPTABLE_RELATIVE_ROUNDING_ERROR)
            .dividedBy(signedOrder.makerAssetAmount);
        if (
            orderRelevantState.remainingFillableTakerTokenAmount.lessThan(
                minFillableTakerTokenAmountWithinNoRoundingErrorRange,
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
        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        const makerBalance = await this._balanceAndProxyAllowanceFetcher.getBalanceAsync(
            signedOrder.makerAssetData,
            signedOrder.makerAddress,
        );
        const makerProxyAllowance = await this._balanceAndProxyAllowanceFetcher.getProxyAllowanceAsync(
            signedOrder.makerAssetData,
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
        const filledTakerTokenAmount = await this._orderFilledCancelledFetcher.getFilledTakerAmountAsync(orderHash);
        const cancelledTakerTokenAmount = await this._orderFilledCancelledFetcher.getCancelledTakerAmountAsync(
            orderHash,
        );
        const unavailableTakerTokenAmount = await this._orderFilledCancelledFetcher.getUnavailableTakerAmountAsync(
            orderHash,
        );
        const totalMakerTokenAmount = signedOrder.makerAssetAmount;
        const totalTakerTokenAmount = signedOrder.takerAssetAmount;
        const remainingTakerTokenAmount = totalTakerTokenAmount.minus(unavailableTakerTokenAmount);
        const remainingMakerTokenAmount = remainingTakerTokenAmount
            .times(totalMakerTokenAmount)
            .dividedToIntegerBy(totalTakerTokenAmount);
        const transferrableMakerTokenAmount = BigNumber.min([makerProxyAllowance, makerBalance]);
        const transferrableFeeTokenAmount = BigNumber.min([makerFeeProxyAllowance, makerFeeBalance]);

        const zrxAssetData = assetProxyUtils.encodeERC20ProxyData(zrxTokenAddress);
        const isMakerTokenZRX = signedOrder.makerAssetData === zrxAssetData;
        const remainingFillableCalculator = new RemainingFillableCalculator(
            signedOrder,
            isMakerTokenZRX,
            transferrableMakerTokenAmount,
            transferrableFeeTokenAmount,
            remainingMakerTokenAmount,
        );
        const remainingFillableMakerTokenAmount = remainingFillableCalculator.computeRemainingMakerFillable();
        const remainingFillableTakerTokenAmount = remainingFillableCalculator.computeRemainingTakerFillable();
        const orderRelevantState = {
            makerBalance,
            makerProxyAllowance,
            makerFeeBalance,
            makerFeeProxyAllowance,
            filledTakerTokenAmount,
            cancelledTakerTokenAmount,
            remainingFillableMakerTokenAmount,
            remainingFillableTakerTokenAmount,
        };
        return orderRelevantState;
    }
}
