import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { ZeroEx } from '../0x';
import { ExchangeWrapper } from '../contract_wrappers/exchange_wrapper';
import { RemainingFillableCalculator } from '../order_watcher/remaining_fillable_calculator';
import { BalanceAndProxyAllowanceLazyStore } from '../stores/balance_proxy_allowance_lazy_store';
import { OrderFilledCancelledLazyStore } from '../stores/order_filled_cancelled_lazy_store';
import {
    ExchangeContractErrs,
    OrderRelevantState,
    OrderState,
    OrderStateInvalid,
    OrderStateValid,
    SignedOrder,
} from '../types';

const ACCEPTABLE_RELATIVE_ROUNDING_ERROR = 0.0001;

export class OrderStateUtils {
    private _balanceAndProxyAllowanceLazyStore: BalanceAndProxyAllowanceLazyStore;
    private _orderFilledCancelledLazyStore: OrderFilledCancelledLazyStore;
    private static _validateIfOrderIsValid(signedOrder: SignedOrder, orderRelevantState: OrderRelevantState): void {
        const unavailableTakerTokenAmount = orderRelevantState.cancelledTakerTokenAmount.add(
            orderRelevantState.filledTakerTokenAmount,
        );
        const availableTakerTokenAmount = signedOrder.takerTokenAmount.minus(unavailableTakerTokenAmount);
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
        const minFillableTakerTokenAmountWithinNoRoundingErrorRange = signedOrder.takerTokenAmount
            .dividedBy(ACCEPTABLE_RELATIVE_ROUNDING_ERROR)
            .dividedBy(signedOrder.makerTokenAmount);
        if (
            orderRelevantState.remainingFillableTakerTokenAmount.lessThan(
                minFillableTakerTokenAmountWithinNoRoundingErrorRange,
            )
        ) {
            throw new Error(ExchangeContractErrs.OrderFillRoundingError);
        }
    }
    constructor(
        balanceAndProxyAllowanceLazyStore: BalanceAndProxyAllowanceLazyStore,
        orderFilledCancelledLazyStore: OrderFilledCancelledLazyStore,
    ) {
        this._balanceAndProxyAllowanceLazyStore = balanceAndProxyAllowanceLazyStore;
        this._orderFilledCancelledLazyStore = orderFilledCancelledLazyStore;
    }
    public async getOrderStateAsync(signedOrder: SignedOrder): Promise<OrderState> {
        const orderRelevantState = await this.getOrderRelevantStateAsync(signedOrder);
        const orderHash = ZeroEx.getOrderHashHex(signedOrder);
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
        // HACK: We access the private property here but otherwise the interface will be less nice.
        // If we pass it from the instantiator - there is no opportunity to get it there
        // because JS doesn't support async constructors.
        // Moreover - it's cached under the hood so it's equivalent to an async constructor.
        const exchange = (this._orderFilledCancelledLazyStore as any)._exchange as ExchangeWrapper;
        const zrxTokenAddress = exchange.getZRXTokenAddress();
        const orderHash = ZeroEx.getOrderHashHex(signedOrder);
        const makerBalance = await this._balanceAndProxyAllowanceLazyStore.getBalanceAsync(
            signedOrder.makerTokenAddress,
            signedOrder.maker,
        );
        const makerProxyAllowance = await this._balanceAndProxyAllowanceLazyStore.getProxyAllowanceAsync(
            signedOrder.makerTokenAddress,
            signedOrder.maker,
        );
        const makerFeeBalance = await this._balanceAndProxyAllowanceLazyStore.getBalanceAsync(
            zrxTokenAddress,
            signedOrder.maker,
        );
        const makerFeeProxyAllowance = await this._balanceAndProxyAllowanceLazyStore.getProxyAllowanceAsync(
            zrxTokenAddress,
            signedOrder.maker,
        );
        const filledTakerTokenAmount = await this._orderFilledCancelledLazyStore.getFilledTakerAmountAsync(orderHash);
        const cancelledTakerTokenAmount = await this._orderFilledCancelledLazyStore.getCancelledTakerAmountAsync(
            orderHash,
        );
        const unavailableTakerTokenAmount = await exchange.getUnavailableTakerAmountAsync(orderHash);
        const totalMakerTokenAmount = signedOrder.makerTokenAmount;
        const totalTakerTokenAmount = signedOrder.takerTokenAmount;
        const remainingTakerTokenAmount = totalTakerTokenAmount.minus(unavailableTakerTokenAmount);
        const remainingMakerTokenAmount = remainingTakerTokenAmount
            .times(totalMakerTokenAmount)
            .dividedToIntegerBy(totalTakerTokenAmount);
        const transferrableMakerTokenAmount = BigNumber.min([makerProxyAllowance, makerBalance]);
        const transferrableFeeTokenAmount = BigNumber.min([makerFeeProxyAllowance, makerFeeBalance]);

        const isMakerTokenZRX = signedOrder.makerTokenAddress === zrxTokenAddress;
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
