import * as _ from 'lodash';
import {ExchangeContractErrs, SignedOrder, Order, ZeroExError} from '../types';
import {ZeroEx} from '../0x';
import {TokenWrapper} from '../contract_wrappers/token_wrapper';
import {ExchangeWrapper} from '../contract_wrappers/exchange_wrapper';
import {utils} from '../utils/utils';
import {constants} from '../utils/constants';

export class OrderValidationUtils {
    private tokenWrapper: TokenWrapper;
    private exchangeWrapper: ExchangeWrapper;
    constructor(tokenWrapper: TokenWrapper, exchangeWrapper: ExchangeWrapper) {
        this.tokenWrapper = tokenWrapper;
        this.exchangeWrapper = exchangeWrapper;
    }
    public async validateOrderFillableThrowIfNotFillableAsync(
        signedOrder: SignedOrder, zrxTokenAddress: string, expectedFillTakerTokenAmount?: BigNumber.BigNumber,
    ): Promise<void> {
        const orderHash = utils.getOrderHashHex(signedOrder);
        const unavailableTakerTokenAmount = await this.exchangeWrapper.getUnavailableTakerAmountAsync(orderHash);
        if (signedOrder.makerTokenAmount.eq(unavailableTakerTokenAmount)) {
            throw new Error(ExchangeContractErrs.OrderRemainingFillAmountZero);
        }
        const currentUnixTimestampSec = utils.getCurrentUnixTimestamp();
        if (signedOrder.expirationUnixTimestampSec.lessThan(currentUnixTimestampSec)) {
            throw new Error(ExchangeContractErrs.OrderFillExpired);
        }
        let fillTakerTokenAmount = signedOrder.takerTokenAmount.minus(unavailableTakerTokenAmount);
        if (!_.isUndefined(expectedFillTakerTokenAmount)) {
            fillTakerTokenAmount = expectedFillTakerTokenAmount;
        }
        await this.validateFillOrderMakerBalancesAllowancesThrowIfInvalidAsync(
            signedOrder, fillTakerTokenAmount, zrxTokenAddress,
        );
    }
    public async validateFillOrderThrowIfInvalidAsync(signedOrder: SignedOrder,
                                                      fillTakerTokenAmount: BigNumber.BigNumber,
                                                      takerAddress: string,
                                                      zrxTokenAddress: string): Promise<void> {
        if (fillTakerTokenAmount.eq(0)) {
            throw new Error(ExchangeContractErrs.OrderFillAmountZero);
        }
        const orderHash = utils.getOrderHashHex(signedOrder);
        if (!ZeroEx.isValidSignature(orderHash, signedOrder.ecSignature, signedOrder.maker)) {
            throw new Error(ZeroExError.InvalidSignature);
        }
        const unavailableTakerTokenAmount = await this.exchangeWrapper.getUnavailableTakerAmountAsync(orderHash);
        if (signedOrder.makerTokenAmount.eq(unavailableTakerTokenAmount)) {
            throw new Error(ExchangeContractErrs.OrderRemainingFillAmountZero);
        }
        if (signedOrder.taker !== constants.NULL_ADDRESS && signedOrder.taker !== takerAddress) {
            throw new Error(ExchangeContractErrs.TransactionSenderIsNotFillOrderTaker);
        }
        const currentUnixTimestampSec = utils.getCurrentUnixTimestamp();
        if (signedOrder.expirationUnixTimestampSec.lessThan(currentUnixTimestampSec)) {
            throw new Error(ExchangeContractErrs.OrderFillExpired);
        }
        await this.validateFillOrderBalancesAllowancesThrowIfInvalidAsync(
            signedOrder, fillTakerTokenAmount, takerAddress, zrxTokenAddress,
        );

        const wouldRoundingErrorOccur = await this.exchangeWrapper.isRoundingErrorAsync(
            fillTakerTokenAmount, signedOrder.takerTokenAmount, signedOrder.makerTokenAmount,
        );
        if (wouldRoundingErrorOccur) {
            throw new Error(ExchangeContractErrs.OrderFillRoundingError);
        }
    }
    public async validateFillOrKillOrderThrowIfInvalidAsync(signedOrder: SignedOrder,
                                                            fillTakerTokenAmount: BigNumber.BigNumber,
                                                            takerAddress: string,
                                                            zrxTokenAddress: string): Promise<void> {
        await this.validateFillOrderThrowIfInvalidAsync(
            signedOrder, fillTakerTokenAmount, takerAddress, zrxTokenAddress,
        );
        // Check that fillValue available >= fillTakerAmount
        const orderHashHex = utils.getOrderHashHex(signedOrder);
        const unavailableTakerAmount = await this.exchangeWrapper.getUnavailableTakerAmountAsync(orderHashHex);
        const remainingTakerAmount = signedOrder.takerTokenAmount.minus(unavailableTakerAmount);
        if (remainingTakerAmount < fillTakerTokenAmount) {
            throw new Error(ExchangeContractErrs.InsufficientRemainingFillAmount);
        }
    }
    public async validateCancelOrderThrowIfInvalidAsync(order: Order,
                                                        cancelTakerTokenAmount: BigNumber.BigNumber,
                                                        unavailableTakerTokenAmount: BigNumber.BigNumber,
    ): Promise<void> {
        if (cancelTakerTokenAmount.eq(0)) {
            throw new Error(ExchangeContractErrs.OrderCancelAmountZero);
        }
        if (order.takerTokenAmount.eq(unavailableTakerTokenAmount)) {
            throw new Error(ExchangeContractErrs.OrderAlreadyCancelledOrFilled);
        }
        const currentUnixTimestampSec = utils.getCurrentUnixTimestamp();
        if (order.expirationUnixTimestampSec.lessThan(currentUnixTimestampSec)) {
            throw new Error(ExchangeContractErrs.OrderCancelExpired);
        }
    }
    public async validateFillOrderBalancesAllowancesThrowIfInvalidAsync(
        signedOrder: SignedOrder, fillTakerAmount: BigNumber.BigNumber, senderAddress: string, zrxTokenAddress: string,
    ): Promise<void> {
        await this.validateFillOrderMakerBalancesAllowancesThrowIfInvalidAsync(
            signedOrder, fillTakerAmount, zrxTokenAddress,
        );
        await this.validateFillOrderTakerBalancesAllowancesThrowIfInvalidAsync(
            signedOrder, fillTakerAmount, senderAddress, zrxTokenAddress,
        );
    }
    private async validateFillOrderMakerBalancesAllowancesThrowIfInvalidAsync(
        signedOrder: SignedOrder, fillTakerAmount: BigNumber.BigNumber, zrxTokenAddress: string,
    ): Promise<void> {
        const makerBalance = await this.tokenWrapper.getBalanceAsync(signedOrder.makerTokenAddress, signedOrder.maker);
        const makerAllowance = await this.tokenWrapper.getProxyAllowanceAsync(
            signedOrder.makerTokenAddress, signedOrder.maker);

        const isMakerTokenZRX = signedOrder.makerTokenAddress === zrxTokenAddress;
        // exchangeRate is the price of one maker token denominated in taker tokens
        const exchangeRate = signedOrder.takerTokenAmount.div(signedOrder.makerTokenAmount);
        const fillMakerAmount = fillTakerAmount.div(exchangeRate);

        const requiredMakerAmount = isMakerTokenZRX ? fillMakerAmount.plus(signedOrder.makerFee) : fillMakerAmount;
        if (requiredMakerAmount.greaterThan(makerBalance)) {
            throw new Error(ExchangeContractErrs.InsufficientMakerBalance);
        }
        if (requiredMakerAmount.greaterThan(makerAllowance)) {
            throw new Error(ExchangeContractErrs.InsufficientMakerAllowance);
        }

        if (!isMakerTokenZRX) {
            const makerZRXBalance = await this.tokenWrapper.getBalanceAsync(zrxTokenAddress, signedOrder.maker);
            const makerZRXAllowance = await this.tokenWrapper.getProxyAllowanceAsync(
                zrxTokenAddress, signedOrder.maker);

            if (signedOrder.makerFee.greaterThan(makerZRXBalance)) {
                throw new Error(ExchangeContractErrs.InsufficientMakerFeeBalance);
            }
            if (signedOrder.makerFee.greaterThan(makerZRXAllowance)) {
                throw new Error(ExchangeContractErrs.InsufficientMakerFeeAllowance);
            }
        }
    }
    private async validateFillOrderTakerBalancesAllowancesThrowIfInvalidAsync(
        signedOrder: SignedOrder, fillTakerAmount: BigNumber.BigNumber, senderAddress: string, zrxTokenAddress: string,
    ): Promise<void> {
        const takerBalance = await this.tokenWrapper.getBalanceAsync(signedOrder.takerTokenAddress, senderAddress);
        const takerAllowance = await this.tokenWrapper.getProxyAllowanceAsync(
            signedOrder.takerTokenAddress, senderAddress);

        const isTakerTokenZRX = signedOrder.takerTokenAddress === zrxTokenAddress;

        const requiredTakerAmount = isTakerTokenZRX ? fillTakerAmount.plus(signedOrder.takerFee) : fillTakerAmount;
        if (requiredTakerAmount.greaterThan(takerBalance)) {
            throw new Error(ExchangeContractErrs.InsufficientTakerBalance);
        }
        if (requiredTakerAmount.greaterThan(takerAllowance)) {
            throw new Error(ExchangeContractErrs.InsufficientTakerAllowance);
        }

        if (!isTakerTokenZRX) {
            const takerZRXBalance = await this.tokenWrapper.getBalanceAsync(zrxTokenAddress, senderAddress);
            const takerZRXAllowance = await this.tokenWrapper.getProxyAllowanceAsync(zrxTokenAddress, senderAddress);

            if (signedOrder.takerFee.greaterThan(takerZRXBalance)) {
                throw new Error(ExchangeContractErrs.InsufficientTakerFeeBalance);
            }
            if (signedOrder.takerFee.greaterThan(takerZRXAllowance)) {
                throw new Error(ExchangeContractErrs.InsufficientTakerFeeAllowance);
            }
        }
    }
}
