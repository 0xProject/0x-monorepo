import {ExchangeContractErrs, SignedOrder} from '../types';

export const orderValidationUtils = {
    /**
     * This method does not currently validate the edge-case where the makerToken or takerToken is also the token used
     * to pay fees  (ZRX). It is possible for them to have enough for fees and the transfer but not both.
     * Handling the edge-cases that arise when this happens would require making sure that the user has sufficient
     * funds to pay both the fees and the transfer amount. We decided to punt on this for now as the contracts
     * will throw for these edge-cases.
     * TODO: Throw errors before calling the smart contract for these edge-cases in order to minimize
     * the callers gas costs.
     */
    async validateFillOrderBalancesAndAllowancesAndThrowIfInvalidAsync(
        signedOrder: SignedOrder, fillTakerAmount: BigNumber.BigNumber, senderAddress: string, zrxTokenAddress: string,
    ): Promise<void> {

        const makerBalance = await this._tokenWrapper.getBalanceAsync(signedOrder.makerTokenAddress,
                                                                     signedOrder.maker);
        const takerBalance = await this._tokenWrapper.getBalanceAsync(signedOrder.takerTokenAddress, senderAddress);
        const makerAllowance = await this._tokenWrapper.getProxyAllowanceAsync(signedOrder.makerTokenAddress,
                                                                              signedOrder.maker);
        const takerAllowance = await this._tokenWrapper.getProxyAllowanceAsync(signedOrder.takerTokenAddress,
                                                                              senderAddress);

        // exchangeRate is the price of one maker token denominated in taker tokens
        const exchangeRate = signedOrder.takerTokenAmount.div(signedOrder.makerTokenAmount);
        const fillMakerAmountInBaseUnits = fillTakerAmount.div(exchangeRate);

        const isMakerTokenZRX = signedOrder.makerTokenAddress === zrxTokenAddress;
        const isTakerTokenZRX = signedOrder.takerTokenAddress === zrxTokenAddress;

        if (fillTakerAmount.greaterThan(takerBalance)) {
            throw new Error(ExchangeContractErrs.InsufficientTakerBalance);
        }
        if (fillTakerAmount.greaterThan(takerAllowance)) {
            throw new Error(ExchangeContractErrs.InsufficientTakerAllowance);
        }
        if (fillMakerAmountInBaseUnits.greaterThan(makerBalance)) {
            throw new Error(ExchangeContractErrs.InsufficientMakerBalance);
        }
        if (fillMakerAmountInBaseUnits.greaterThan(makerAllowance)) {
            throw new Error(ExchangeContractErrs.InsufficientMakerAllowance);
        }

        const makerFeeBalance = await this._tokenWrapper.getBalanceAsync(zrxTokenAddress,
                                                                        signedOrder.maker);
        const takerFeeBalance = await this._tokenWrapper.getBalanceAsync(zrxTokenAddress, senderAddress);
        const makerFeeAllowance = await this._tokenWrapper.getProxyAllowanceAsync(zrxTokenAddress,
                                                                                 signedOrder.maker);
        const takerFeeAllowance = await this._tokenWrapper.getProxyAllowanceAsync(zrxTokenAddress,
                                                                                 senderAddress);

        if (signedOrder.takerFee.greaterThan(takerFeeBalance)) {
            throw new Error(ExchangeContractErrs.InsufficientTakerFeeBalance);
        }
        if (signedOrder.takerFee.greaterThan(takerFeeAllowance)) {
            throw new Error(ExchangeContractErrs.InsufficientTakerFeeAllowance);
        }
        if (signedOrder.makerFee.greaterThan(makerFeeBalance)) {
            throw new Error(ExchangeContractErrs.InsufficientMakerFeeBalance);
        }
        if (signedOrder.makerFee.greaterThan(makerFeeAllowance)) {
            throw new Error(ExchangeContractErrs.InsufficientMakerFeeAllowance);
        }
    },
};
