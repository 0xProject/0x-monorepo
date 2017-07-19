import {ExchangeContractErrs, SignedOrder} from '../types';
import {TokenWrapper} from '../contract_wrappers/token_wrapper';

export class OrderValidationUtils {
    private tokenWrapper: TokenWrapper;
    constructor(tokenWrapper: TokenWrapper) {
        this.tokenWrapper = tokenWrapper;
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

        if (isMakerTokenZRX) {
            const requiredMakerAmount = fillMakerAmount.plus(signedOrder.makerFee);
            if (requiredMakerAmount.greaterThan(makerBalance)) {
                throw new Error(ExchangeContractErrs.InsufficientMakerBalance);
            }
            if (requiredMakerAmount.greaterThan(makerAllowance)) {
                throw new Error(ExchangeContractErrs.InsufficientMakerAllowance);
            }
        } else {
            const makerZRXBalance = await this.tokenWrapper.getBalanceAsync(zrxTokenAddress, signedOrder.maker);
            const makerZRXAllowance = await this.tokenWrapper.getProxyAllowanceAsync(
                zrxTokenAddress, signedOrder.maker);

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
    private async validateFillOrderTakerBalancesAllowancesThrowIfInvalidAsync(
        signedOrder: SignedOrder, fillTakerAmount: BigNumber.BigNumber, senderAddress: string, zrxTokenAddress: string,
    ): Promise<void> {
        const takerBalance = await this.tokenWrapper.getBalanceAsync(signedOrder.takerTokenAddress, senderAddress);
        const takerAllowance = await this.tokenWrapper.getProxyAllowanceAsync(
            signedOrder.takerTokenAddress, senderAddress);

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
            const takerZRXBalance = await this.tokenWrapper.getBalanceAsync(zrxTokenAddress, senderAddress);
            const takerZRXAllowance = await this.tokenWrapper.getProxyAllowanceAsync(zrxTokenAddress, senderAddress);

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
