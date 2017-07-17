import {ExchangeContractErrs, SignedOrder} from '../types';
import {TokenWrapper} from '../contract_wrappers/token_wrapper';

export class OrderValidationUtils {
    public static async validateFillOrderBalancesAndAllowancesAndThrowIfInvalidAsync(
        tokenWrapper: TokenWrapper, signedOrder: SignedOrder, fillTakerAmount: BigNumber.BigNumber,
        senderAddress: string, zrxTokenAddress: string): Promise<void> {
        await OrderValidationUtils.validateFillOrderMakerBalancesAndAllowancesAndThrowIfInvalidAsync(
            tokenWrapper, signedOrder, fillTakerAmount, zrxTokenAddress,
        );
        await OrderValidationUtils.validateFillOrderTakerBalancesAndAllowancesAndThrowIfInvalidAsync(
            tokenWrapper, signedOrder, fillTakerAmount, senderAddress, zrxTokenAddress,
        );
    }
    private static async validateFillOrderMakerBalancesAndAllowancesAndThrowIfInvalidAsync(
        tokenWrapper: TokenWrapper, signedOrder: SignedOrder, fillTakerAmount: BigNumber.BigNumber,
        zrxTokenAddress: string,
    ): Promise<void> {
        const makerBalance = await tokenWrapper.getBalanceAsync(
            signedOrder.makerTokenAddress, signedOrder.maker);
        const makerAllowance = await tokenWrapper.getProxyAllowanceAsync(
            signedOrder.makerTokenAddress, signedOrder.maker);
        const makerZRXBalance = await tokenWrapper.getBalanceAsync(
            zrxTokenAddress, signedOrder.maker);
        const makerZRXAllowance = await tokenWrapper.getProxyAllowanceAsync(
            zrxTokenAddress, signedOrder.maker);

        const isMakerTokenZRX = signedOrder.makerTokenAddress === zrxTokenAddress;
        // exchangeRate is the price of one maker token denominated in taker tokens
        const exchangeRate = signedOrder.takerTokenAmount.div(signedOrder.makerTokenAmount);
        const fillMakerAmount = fillTakerAmount.div(exchangeRate);

        if (isMakerTokenZRX) {
            const requiredMakerAmount = fillMakerAmount.plus(signedOrder.makerFee);
            if (requiredMakerAmount.greaterThan(makerBalance)) {
                throw new Error(ExchangeContractErrs.InsufficientMakerBalance);
            }
            if (requiredMakerAmount.greaterThan(makerAllowance)) {
                throw new Error(ExchangeContractErrs.InsufficientMakerAllowance);
            }
        } else {
            if (fillMakerAmount.greaterThan(makerBalance)) {
                throw new Error(ExchangeContractErrs.InsufficientMakerBalance);
            }
            if (fillMakerAmount.greaterThan(makerAllowance)) {
                throw new Error(ExchangeContractErrs.InsufficientMakerAllowance);
            }
            if (signedOrder.makerFee.greaterThan(makerZRXBalance)) {
                throw new Error(ExchangeContractErrs.InsufficientMakerFeeBalance);
            }
            if (signedOrder.makerFee.greaterThan(makerZRXAllowance)) {
                throw new Error(ExchangeContractErrs.InsufficientMakerFeeAllowance);
            }
        }
    }
    private static async validateFillOrderTakerBalancesAndAllowancesAndThrowIfInvalidAsync(
        tokenWrapper: TokenWrapper, signedOrder: SignedOrder, fillTakerAmount: BigNumber.BigNumber,
        senderAddress: string, zrxTokenAddress: string,
    ): Promise<void> {
        const takerBalance = await tokenWrapper.getBalanceAsync(signedOrder.takerTokenAddress, senderAddress);
        const takerAllowance = await tokenWrapper.getProxyAllowanceAsync(
            signedOrder.takerTokenAddress, senderAddress);
        const takerZRXBalance = await tokenWrapper.getBalanceAsync(zrxTokenAddress, senderAddress);
        const takerZRXAllowance = await tokenWrapper.getProxyAllowanceAsync(
            zrxTokenAddress, senderAddress);

        const isTakerTokenZRX = signedOrder.takerTokenAddress === zrxTokenAddress;

        if (isTakerTokenZRX) {
            const requiredTakerAmount = fillTakerAmount.plus(signedOrder.takerFee);
            if (requiredTakerAmount.greaterThan(takerBalance)) {
                throw new Error(ExchangeContractErrs.InsufficientTakerBalance);
            }
            if (requiredTakerAmount.greaterThan(takerAllowance)) {
                throw new Error(ExchangeContractErrs.InsufficientTakerAllowance);
            }
        } else {
            if (fillTakerAmount.greaterThan(takerBalance)) {
                throw new Error(ExchangeContractErrs.InsufficientTakerBalance);
            }
            if (fillTakerAmount.greaterThan(takerAllowance)) {
                throw new Error(ExchangeContractErrs.InsufficientTakerAllowance);
            }
            if (signedOrder.takerFee.greaterThan(takerZRXBalance)) {
                throw new Error(ExchangeContractErrs.InsufficientTakerFeeBalance);
            }
            if (signedOrder.takerFee.greaterThan(takerZRXAllowance)) {
                throw new Error(ExchangeContractErrs.InsufficientTakerFeeAllowance);
            }
        }
    }
}
