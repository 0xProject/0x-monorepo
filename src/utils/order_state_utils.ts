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

export class OrderStateUtils {
    private tokenWrapper: TokenWrapper;
    private exchangeWrapper: ExchangeWrapper;
    private defaultBlock: Web3.BlockParam;
    constructor(tokenWrapper: TokenWrapper, exchangeWrapper: ExchangeWrapper, defaultBlock: Web3.BlockParam) {
        this.tokenWrapper = tokenWrapper;
        this.exchangeWrapper = exchangeWrapper;
        this.defaultBlock = defaultBlock;
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
    public async getOrderRelevantStateAsync(
        signedOrder: SignedOrder): Promise<OrderRelevantState> {
        const methodOpts = {
            defaultBlock: this.defaultBlock,
        };
        const zrxTokenAddress = await this.exchangeWrapper.getZRXTokenAddressAsync();
        const orderHash = ZeroEx.getOrderHashHex(signedOrder);
        const makerBalance = await this.tokenWrapper.getBalanceAsync(
            signedOrder.makerTokenAddress, signedOrder.maker, methodOpts,
        );
        const makerProxyAllowance = await this.tokenWrapper.getProxyAllowanceAsync(
            signedOrder.makerTokenAddress, signedOrder.maker, methodOpts,
        );
        const makerFeeBalance = await this.tokenWrapper.getBalanceAsync(
            zrxTokenAddress, signedOrder.maker, methodOpts,
        );
        const makerFeeProxyAllowance = await this.tokenWrapper.getProxyAllowanceAsync(
            zrxTokenAddress, signedOrder.maker, methodOpts,
        );
        const filledTakerTokenAmount = await this.exchangeWrapper.getFilledTakerAmountAsync(orderHash, methodOpts);
        const canceledTakerTokenAmount = await this.exchangeWrapper.getCanceledTakerAmountAsync(orderHash, methodOpts);
        const orderRelevantState = {
            makerBalance,
            makerProxyAllowance,
            makerFeeBalance,
            makerFeeProxyAllowance,
            filledTakerTokenAmount,
            canceledTakerTokenAmount,
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
        // TODO Add linear function solver when maker token is ZRX #badass
        // Return the max amount that's fillable
    }
}
