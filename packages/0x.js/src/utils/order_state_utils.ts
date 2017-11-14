import * as _ from 'lodash';
import * as Web3 from 'web3';
import BigNumber from 'bignumber.js';
import {
    ExchangeContractErrs,
    SignedOrder,
    OrderRelevantState,
    MethodOpts,
    OrderState,
    OrderStateValid,
    OrderStateInvalid,
} from '../types';
import {ZeroEx} from '../0x';
import {TokenWrapper} from '../contract_wrappers/token_wrapper';
import {ExchangeWrapper} from '../contract_wrappers/exchange_wrapper';
import {utils} from '../utils/utils';
import {constants} from '../utils/constants';
import {OrderFilledCancelledLazyStore} from '../stores/order_filled_cancelled_lazy_store';
import {BalanceAndProxyAllowanceLazyStore} from '../stores/balance_proxy_allowance_lazy_store';

export class OrderStateUtils {
    private balanceAndProxyAllowanceLazyStore: BalanceAndProxyAllowanceLazyStore;
    private orderFilledCancelledLazyStore: OrderFilledCancelledLazyStore;
    constructor(balanceAndProxyAllowanceLazyStore: BalanceAndProxyAllowanceLazyStore,
                orderFilledCancelledLazyStore: OrderFilledCancelledLazyStore) {
        this.balanceAndProxyAllowanceLazyStore = balanceAndProxyAllowanceLazyStore;
        this.orderFilledCancelledLazyStore = orderFilledCancelledLazyStore;
    }
    public async getOrderStateAsync(signedOrder: SignedOrder): Promise<OrderState> {
        const orderRelevantState = await this.getOrderRelevantStateAsync(signedOrder);
        const orderHash = ZeroEx.getOrderHashHex(signedOrder);
        try {
            this.validateIfOrderIsValid(signedOrder, orderRelevantState);
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
        const exchange = (this.orderFilledCancelledLazyStore as any).exchange as ExchangeWrapper;
        const zrxTokenAddress = await exchange.getZRXTokenAddressAsync();
        const orderHash = ZeroEx.getOrderHashHex(signedOrder);
        const makerBalance = await this.balanceAndProxyAllowanceLazyStore.getBalanceAsync(
            signedOrder.makerTokenAddress, signedOrder.maker,
        );
        const makerProxyAllowance = await this.balanceAndProxyAllowanceLazyStore.getProxyAllowanceAsync(
            signedOrder.makerTokenAddress, signedOrder.maker,
        );
        const makerFeeBalance = await this.balanceAndProxyAllowanceLazyStore.getBalanceAsync(
            zrxTokenAddress, signedOrder.maker,
        );
        const makerFeeProxyAllowance = await this.balanceAndProxyAllowanceLazyStore.getProxyAllowanceAsync(
            zrxTokenAddress, signedOrder.maker,
        );
        const filledTakerTokenAmount = await this.orderFilledCancelledLazyStore.getFilledTakerAmountAsync(orderHash);
        const canceledTakerTokenAmount = await this.orderFilledCancelledLazyStore.getCancelledTakerAmountAsync(
            orderHash,
        );
        const unavailableTakerTokenAmount = await exchange.getUnavailableTakerAmountAsync(orderHash);
        const totalMakerTokenAmount = signedOrder.makerTokenAmount;
        const totalTakerTokenAmount = signedOrder.takerTokenAmount;
        const remainingTakerTokenAmount = totalTakerTokenAmount.minus(unavailableTakerTokenAmount);
        const remainingMakerTokenAmount = remainingTakerTokenAmount.times(totalMakerTokenAmount)
                                                                   .dividedToIntegerBy(totalTakerTokenAmount);
        const fillableMakerTokenAmount = BigNumber.min([makerProxyAllowance, makerBalance]);
        const remainingFillableMakerTokenAmount = BigNumber.min(fillableMakerTokenAmount, remainingMakerTokenAmount);
        const remainingFillableTakerTokenAmount = remainingFillableMakerTokenAmount
                                                  .times(totalTakerTokenAmount)
                                                  .dividedToIntegerBy(totalMakerTokenAmount);
        // TODO: Handle edge case where maker token is ZRX with fee
        const orderRelevantState = {
            makerBalance,
            makerProxyAllowance,
            makerFeeBalance,
            makerFeeProxyAllowance,
            filledTakerTokenAmount,
            canceledTakerTokenAmount,
            remainingFillableMakerTokenAmount,
            remainingFillableTakerTokenAmount,
        };
        return orderRelevantState;
    }
    private validateIfOrderIsValid(signedOrder: SignedOrder, orderRelevantState: OrderRelevantState): void {
        const unavailableTakerTokenAmount = orderRelevantState.canceledTakerTokenAmount.add(
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
                                                                           .times(1000)
                                                                           .dividedBy(signedOrder.makerTokenAmount);
        if (orderRelevantState.remainingFillableTakerTokenAmount
            .lessThan(minFillableTakerTokenAmountWithinNoRoundingErrorRange)) {
            throw new Error(ExchangeContractErrs.OrderFillRoundingError);
        }
        // TODO Add linear function solver when maker token is ZRX #badass
        // Return the max amount that's fillable
    }
}
