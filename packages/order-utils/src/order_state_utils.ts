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
import { constants } from './constants';
import { orderHashUtils } from './order_hash';
import { RemainingFillableCalculator } from './remaining_fillable_calculator';

interface SidedOrderRelevantState {
    isMakerSide: boolean;
    traderBalance: BigNumber;
    traderProxyAllowance: BigNumber;
    traderFeeBalance: BigNumber;
    traderFeeProxyAllowance: BigNumber;
    filledTakerAssetAmount: BigNumber;
    remainingFillableAssetAmount: BigNumber;
}

const ACCEPTABLE_RELATIVE_ROUNDING_ERROR = 0.0001;

export class OrderStateUtils {
    private _balanceAndProxyAllowanceFetcher: AbstractBalanceAndProxyAllowanceFetcher;
    private _orderFilledCancelledFetcher: AbstractOrderFilledCancelledFetcher;
    private static _validateIfOrderIsValid(
        signedOrder: SignedOrder,
        sidedOrderRelevantState: SidedOrderRelevantState,
    ): void {
        const isMakerSide = sidedOrderRelevantState.isMakerSide;
        const availableTakerAssetAmount = signedOrder.takerAssetAmount.minus(
            sidedOrderRelevantState.filledTakerAssetAmount,
        );
        if (availableTakerAssetAmount.eq(0)) {
            throw new Error(ExchangeContractErrs.OrderRemainingFillAmountZero);
        }

        if (sidedOrderRelevantState.traderBalance.eq(0)) {
            throw new Error(
                isMakerSide
                    ? ExchangeContractErrs.InsufficientMakerBalance
                    : ExchangeContractErrs.InsufficientTakerBalance,
            );
        }
        if (sidedOrderRelevantState.traderProxyAllowance.eq(0)) {
            throw new Error(
                isMakerSide
                    ? ExchangeContractErrs.InsufficientMakerAllowance
                    : ExchangeContractErrs.InsufficientTakerAllowance,
            );
        }
        if (!signedOrder.makerFee.eq(0)) {
            if (sidedOrderRelevantState.traderFeeBalance.eq(0)) {
                throw new Error(
                    isMakerSide
                        ? ExchangeContractErrs.InsufficientMakerFeeBalance
                        : ExchangeContractErrs.InsufficientTakerFeeBalance,
                );
            }
            if (sidedOrderRelevantState.traderFeeProxyAllowance.eq(0)) {
                throw new Error(
                    isMakerSide
                        ? ExchangeContractErrs.InsufficientMakerFeeAllowance
                        : ExchangeContractErrs.InsufficientTakerFeeAllowance,
                );
            }
        }

        let minFillableTakerAssetAmountWithinNoRoundingErrorRange;
        if (isMakerSide) {
            minFillableTakerAssetAmountWithinNoRoundingErrorRange = signedOrder.takerAssetAmount
                .dividedBy(ACCEPTABLE_RELATIVE_ROUNDING_ERROR)
                .dividedBy(signedOrder.makerAssetAmount);
        } else {
            minFillableTakerAssetAmountWithinNoRoundingErrorRange = signedOrder.makerAssetAmount
                .dividedBy(ACCEPTABLE_RELATIVE_ROUNDING_ERROR)
                .dividedBy(signedOrder.takerAssetAmount);
        }

        if (
            sidedOrderRelevantState.remainingFillableAssetAmount.lessThan(
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
    public async getOpenOrderStateAsync(signedOrder: SignedOrder): Promise<OrderState> {
        const orderRelevantState = await this.getOpenOrderRelevantStateAsync(signedOrder);
        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        const sidedOrderRelevantState = {
            isMakerSide: true,
            traderBalance: orderRelevantState.makerBalance,
            traderProxyAllowance: orderRelevantState.makerProxyAllowance,
            traderFeeBalance: orderRelevantState.makerFeeBalance,
            traderFeeProxyAllowance: orderRelevantState.makerFeeProxyAllowance,
            filledTakerAssetAmount: orderRelevantState.filledTakerAssetAmount,
            remainingFillableAssetAmount: orderRelevantState.remainingFillableMakerAssetAmount,
        };
        try {
            OrderStateUtils._validateIfOrderIsValid(signedOrder, sidedOrderRelevantState);
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
    public async getOpenOrderRelevantStateAsync(signedOrder: SignedOrder): Promise<OrderRelevantState> {
        const isMaker = true;
        const sidedOrderRelevantState = await this._getSidedOrderRelevantStateAsync(
            isMaker,
            signedOrder,
            signedOrder.takerAddress,
        );
        const remainingFillableTakerAssetAmount = sidedOrderRelevantState.remainingFillableAssetAmount
            .times(signedOrder.takerAssetAmount)
            .dividedToIntegerBy(signedOrder.makerAssetAmount);

        const orderRelevantState = {
            makerBalance: sidedOrderRelevantState.traderBalance,
            makerProxyAllowance: sidedOrderRelevantState.traderProxyAllowance,
            makerFeeBalance: sidedOrderRelevantState.traderFeeBalance,
            makerFeeProxyAllowance: sidedOrderRelevantState.traderFeeProxyAllowance,
            filledTakerAssetAmount: sidedOrderRelevantState.filledTakerAssetAmount,
            remainingFillableMakerAssetAmount: sidedOrderRelevantState.remainingFillableAssetAmount,
            remainingFillableTakerAssetAmount,
        };
        return orderRelevantState;
    }
    public async getMaxFillableTakerAssetAmountAsync(
        signedOrder: SignedOrder,
        takerAddress: string,
    ): Promise<BigNumber> {
        // Get max fillable amount for an order, considering the makers ability to fill
        let isMaker = true;
        const orderRelevantMakerState = await this._getSidedOrderRelevantStateAsync(
            isMaker,
            signedOrder,
            signedOrder.takerAddress,
        );
        const remainingFillableTakerAssetAmountGivenMakersStatus = orderRelevantMakerState.remainingFillableAssetAmount;

        // Get max fillable amount for an order, considering the takers ability to fill
        isMaker = false;
        const orderRelevantTakerState = await this._getSidedOrderRelevantStateAsync(isMaker, signedOrder, takerAddress);
        const remainingFillableTakerAssetAmountGivenTakersStatus = orderRelevantTakerState.remainingFillableAssetAmount;

        // The min of these two in the actualy max fillable by either party
        const fillableTakerAssetAmount = BigNumber.min([
            remainingFillableTakerAssetAmountGivenMakersStatus,
            remainingFillableTakerAssetAmountGivenTakersStatus,
        ]);

        return fillableTakerAssetAmount;
    }
    public async getMaxFillableTakerAssetAmountForFailingOrderAsync(
        signedOrder: SignedOrder,
        takerAddress: string,
    ): Promise<BigNumber> {
        // Get min of taker balance & allowance
        const takerAssetBalanceOfTaker = await this._balanceAndProxyAllowanceFetcher.getBalanceAsync(
            signedOrder.takerAssetData,
            takerAddress,
        );
        const takerAssetAllowanceOfTaker = await this._balanceAndProxyAllowanceFetcher.getProxyAllowanceAsync(
            signedOrder.takerAssetData,
            takerAddress,
        );
        const minTakerAssetAmount = BigNumber.min([takerAssetBalanceOfTaker, takerAssetAllowanceOfTaker]);

        // get remainingFillAmount
        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        const filledTakerAssetAmount = await this._orderFilledCancelledFetcher.getFilledTakerAmountAsync(orderHash);
        const remainingFillTakerAssetAmount = signedOrder.takerAssetAmount.minus(filledTakerAssetAmount);

        if (minTakerAssetAmount.gte(remainingFillTakerAssetAmount)) {
            return remainingFillTakerAssetAmount;
        } else {
            return minTakerAssetAmount;
        }
    }
    private async _getSidedOrderRelevantStateAsync(
        isMakerSide: boolean,
        signedOrder: SignedOrder,
        takerAddress: string,
    ): Promise<SidedOrderRelevantState> {
        let traderAddress;
        let assetData;
        let assetAmount;
        let feeAmount;
        if (isMakerSide) {
            traderAddress = signedOrder.makerAddress;
            assetData = signedOrder.makerAssetData;
            assetAmount = signedOrder.makerAssetAmount;
            feeAmount = signedOrder.makerFee;
        } else {
            traderAddress = takerAddress;
            assetData = signedOrder.takerAssetData;
            assetAmount = signedOrder.takerAssetAmount;
            feeAmount = signedOrder.takerFee;
        }
        const zrxAssetData = this._orderFilledCancelledFetcher.getZRXAssetData();
        const isAssetZRX = assetData === zrxAssetData;

        const traderBalance = await this._balanceAndProxyAllowanceFetcher.getBalanceAsync(assetData, traderAddress);
        const traderProxyAllowance = await this._balanceAndProxyAllowanceFetcher.getProxyAllowanceAsync(
            assetData,
            traderAddress,
        );
        const traderFeeBalance = await this._balanceAndProxyAllowanceFetcher.getBalanceAsync(
            zrxAssetData,
            traderAddress,
        );
        const traderFeeProxyAllowance = await this._balanceAndProxyAllowanceFetcher.getProxyAllowanceAsync(
            zrxAssetData,
            traderAddress,
        );

        const transferrableTraderAssetAmount = BigNumber.min([traderProxyAllowance, traderBalance]);
        const transferrableFeeAssetAmount = BigNumber.min([traderFeeProxyAllowance, traderFeeBalance]);

        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        const filledTakerAssetAmount = await this._orderFilledCancelledFetcher.getFilledTakerAmountAsync(orderHash);
        const totalMakerAssetAmount = signedOrder.makerAssetAmount;
        const totalTakerAssetAmount = signedOrder.takerAssetAmount;
        const isOrderCancelled = await this._orderFilledCancelledFetcher.isOrderCancelledAsync(orderHash);
        const remainingTakerAssetAmount = isOrderCancelled
            ? new BigNumber(0)
            : totalTakerAssetAmount.minus(filledTakerAssetAmount);
        const remainingMakerAssetAmount = remainingTakerAssetAmount.eq(0)
            ? new BigNumber(0)
            : remainingTakerAssetAmount.times(totalMakerAssetAmount).dividedToIntegerBy(totalTakerAssetAmount);
        const remainingAssetAmount = isMakerSide ? remainingMakerAssetAmount : remainingTakerAssetAmount;

        const remainingFillableCalculator = new RemainingFillableCalculator(
            feeAmount,
            assetAmount,
            isAssetZRX,
            transferrableTraderAssetAmount,
            transferrableFeeAssetAmount,
            remainingAssetAmount,
        );
        const remainingFillableAssetAmount = remainingFillableCalculator.computeRemainingFillable();

        const sidedOrderRelevantState = {
            isMakerSide,
            traderBalance,
            traderProxyAllowance,
            traderFeeBalance,
            traderFeeProxyAllowance,
            filledTakerAssetAmount,
            remainingFillableAssetAmount,
        };
        return sidedOrderRelevantState;
    }
}
