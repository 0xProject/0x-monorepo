import * as _ from 'lodash';
import {Web3Wrapper} from '../web3_wrapper';
import {
    ECSignature,
    ExchangeContract,
    ExchangeContractErrCodes,
    ExchangeContractErrs,
    OrderValues,
    OrderAddresses,
    SignedOrder,
    ContractEvent,
    ContractResponse,
} from '../types';
import {assert} from '../utils/assert';
import {ContractWrapper} from './contract_wrapper';
import * as ExchangeArtifacts from '../artifacts/Exchange.json';
import {ecSignatureSchema} from '../schemas/ec_signature_schema';
import {signedOrderSchema} from '../schemas/order_schemas';
import {SchemaValidator} from '../utils/schema_validator';
import {constants} from '../utils/constants';
import {TokenWrapper} from './token_wrapper';

export class ExchangeWrapper extends ContractWrapper {
    private exchangeContractErrCodesToMsg = {
        [ExchangeContractErrCodes.ERROR_FILL_EXPIRED]: ExchangeContractErrs.ORDER_FILL_EXPIRED,
        [ExchangeContractErrCodes.ERROR_CANCEL_EXPIRED]: ExchangeContractErrs.ORDER_FILL_EXPIRED,
        [ExchangeContractErrCodes.ERROR_FILL_NO_VALUE]: ExchangeContractErrs.ORDER_REMAINING_FILL_AMOUNT_ZERO,
        [ExchangeContractErrCodes.ERROR_CANCEL_NO_VALUE]: ExchangeContractErrs.ORDER_REMAINING_FILL_AMOUNT_ZERO,
        [ExchangeContractErrCodes.ERROR_FILL_TRUNCATION]: ExchangeContractErrs.ORDER_FILL_ROUNDING_ERROR,
        [ExchangeContractErrCodes.ERROR_FILL_BALANCE_ALLOWANCE]: ExchangeContractErrs.FILL_BALANCE_ALLOWANCE_ERROR,
    };
    private exchangeContractIfExists?: ExchangeContract;
    private tokenWrapper: TokenWrapper;
    constructor(web3Wrapper: Web3Wrapper, tokenWrapper: TokenWrapper) {
        super(web3Wrapper);
        this.tokenWrapper = tokenWrapper;
    }
    public invalidateContractInstance(): void {
        delete this.exchangeContractIfExists;
    }
    public async isValidSignatureAsync(dataHex: string, ecSignature: ECSignature,
                                       signerAddressHex: string): Promise<boolean> {
        assert.isHexString('dataHex', dataHex);
        assert.doesConformToSchema('ecSignature', ecSignature, ecSignatureSchema);
        assert.isETHAddressHex('signerAddressHex', signerAddressHex);

        const senderAddress = await this.web3Wrapper.getSenderAddressOrThrowAsync();
        const exchangeInstance = await this.getExchangeContractAsync();

        const isValidSignature = await exchangeInstance.isValidSignature.call(
            signerAddressHex,
            dataHex,
            ecSignature.v,
            ecSignature.r,
            ecSignature.s,
            {
                from: senderAddress,
            },
        );
        return isValidSignature;
    }
    /**
     * Fills a signed order with a fillAmount denominated in baseUnits of the taker token.
     * Since the order in which transactions are included in the next block is indeterminate, race-conditions
     * could arise where a users balance or allowance changes before the fillOrder executes. Because of this,
     * we allow you to specify `shouldCheckTransfer`. If true, the smart contract will not throw if while
     * executing, the parties do not have sufficient balances/allowances, preserving gas costs. Setting it to
     * false forgoes this check and causes the smart contract to throw instead.
     */
    public async fillOrderAsync(signedOrder: SignedOrder, fillTakerAmount: BigNumber.BigNumber,
                                shouldCheckTransfer: boolean): Promise<void> {
        assert.doesConformToSchema('signedOrder',
                                   SchemaValidator.convertToJSONSchemaCompatibleObject(signedOrder as object),
                                   signedOrderSchema);
        assert.isBigNumber('fillTakerAmount', fillTakerAmount);
        assert.isBoolean('shouldCheckTransfer', shouldCheckTransfer);

        const senderAddress = await this.web3Wrapper.getSenderAddressOrThrowAsync();
        const exchangeInstance = await this.getExchangeContractAsync();
        await this.validateFillOrderAndThrowIfInvalidAsync(signedOrder, fillTakerAmount, senderAddress);

        const orderAddresses: OrderAddresses = [
            signedOrder.maker,
            signedOrder.taker,
            signedOrder.makerTokenAddress,
            signedOrder.takerTokenAddress,
            signedOrder.feeRecipient,
        ];
        const orderValues: OrderValues = [
            signedOrder.makerTokenAmount,
            signedOrder.takerTokenAmount,
            signedOrder.makerFee,
            signedOrder.takerFee,
            signedOrder.expirationUnixTimestampSec,
            signedOrder.salt,
        ];
        const gas = await exchangeInstance.fill.estimateGas(
            orderAddresses,
            orderValues,
            fillTakerAmount,
            shouldCheckTransfer,
            signedOrder.ecSignature.v,
            signedOrder.ecSignature.r,
            signedOrder.ecSignature.s,
            {
                from: senderAddress,
            },
        );
        const response: ContractResponse = await exchangeInstance.fill(
            orderAddresses,
            orderValues,
            fillTakerAmount,
            shouldCheckTransfer,
            signedOrder.ecSignature.v,
            signedOrder.ecSignature.r,
            signedOrder.ecSignature.s,
            {
                from: senderAddress,
                gas,
            },
        );
        this.throwErrorLogsAsErrors(response.logs);
    }
    private async validateFillOrderAndThrowIfInvalidAsync(signedOrder: SignedOrder,
                                                          fillTakerAmount: BigNumber.BigNumber,
                                                          senderAddress: string): Promise<void> {
        if (fillTakerAmount.eq(0)) {
            throw new Error(ExchangeContractErrs.ORDER_REMAINING_FILL_AMOUNT_ZERO);
        }
        if (signedOrder.taker !== constants.NULL_ADDRESS && signedOrder.taker !== senderAddress) {
            throw new Error(ExchangeContractErrs.TRANSACTION_SENDER_IS_NOT_FILL_ORDER_TAKER);
        }
        const currentUnixTimestampSec = Date.now() / 1000;
        if (signedOrder.expirationUnixTimestampSec.lessThan(currentUnixTimestampSec)) {
            throw new Error(ExchangeContractErrs.ORDER_FILL_EXPIRED);
        }
        const zrxTokenAddress = await this.getZRXTokenAddressAsync();
        await this.validateFillOrderBalancesAndAllowancesAndThrowIfInvalidAsync(signedOrder, fillTakerAmount,
                                                               senderAddress, zrxTokenAddress);

        const wouldRoundingErrorOccur = await this.isRoundingErrorAsync(
            signedOrder.takerTokenAmount, fillTakerAmount, signedOrder.makerTokenAmount,
        );
        if (wouldRoundingErrorOccur) {
            throw new Error(ExchangeContractErrs.ORDER_FILL_ROUNDING_ERROR);
        }
    }

    /**
     * This method does not currently validate the edge-case where the makerToken or takerToken is also the token used
     * to pay fees  (ZRX). It is possible for them to have enough for fees and the transfer but not both.
     * Handling the edge-cases that arise when this happens would require making sure that the user has sufficient
     * funds to pay both the fees and the transfer amount. We decided to punt on this for now as the contracts
     * will throw for these edge-cases.
     * TODO: Throw errors before calling the smart contract for these edge-cases
     * TODO: in order to minimize the callers gas costs.
     */
    private async validateFillOrderBalancesAndAllowancesAndThrowIfInvalidAsync(signedOrder: SignedOrder,
                                                                               fillTakerAmount: BigNumber.BigNumber,
                                                                               senderAddress: string,
                                                                               zrxTokenAddress: string): Promise<void> {

        const makerBalance = await this.tokenWrapper.getBalanceAsync(signedOrder.makerTokenAddress,
                                                                     signedOrder.maker);
        const takerBalance = await this.tokenWrapper.getBalanceAsync(signedOrder.takerTokenAddress, senderAddress);
        const makerAllowance = await this.tokenWrapper.getProxyAllowanceAsync(signedOrder.makerTokenAddress,
                                                                              signedOrder.maker);
        const takerAllowance = await this.tokenWrapper.getProxyAllowanceAsync(signedOrder.takerTokenAddress,
                                                                              senderAddress);

        // exchangeRate is the price of one maker token denominated in taker tokens
        const exchangeRate = signedOrder.takerTokenAmount.div(signedOrder.makerTokenAmount);
        const fillMakerAmountInBaseUnits = fillTakerAmount.div(exchangeRate);

        if (fillTakerAmount.greaterThan(takerBalance)) {
            throw new Error(ExchangeContractErrs.INSUFFICIENT_TAKER_BALANCE);
        }
        if (fillTakerAmount.greaterThan(takerAllowance)) {
            throw new Error(ExchangeContractErrs.INSUFFICIENT_TAKER_ALLOWANCE);
        }
        if (fillMakerAmountInBaseUnits.greaterThan(makerBalance)) {
            throw new Error(ExchangeContractErrs.INSUFFICIENT_MAKER_BALANCE);
        }
        if (fillMakerAmountInBaseUnits.greaterThan(makerAllowance)) {
            throw new Error(ExchangeContractErrs.INSUFFICIENT_MAKER_ALLOWANCE);
        }

        const makerFeeBalance = await this.tokenWrapper.getBalanceAsync(zrxTokenAddress,
                                                                        signedOrder.maker);
        const takerFeeBalance = await this.tokenWrapper.getBalanceAsync(zrxTokenAddress, senderAddress);
        const makerFeeAllowance = await this.tokenWrapper.getProxyAllowanceAsync(zrxTokenAddress,
                                                                                 signedOrder.maker);
        const takerFeeAllowance = await this.tokenWrapper.getProxyAllowanceAsync(zrxTokenAddress,
                                                                                 senderAddress);

        if (signedOrder.takerFee.greaterThan(takerFeeBalance)) {
            throw new Error(ExchangeContractErrs.INSUFFICIENT_TAKER_FEE_BALANCE);
        }
        if (signedOrder.takerFee.greaterThan(takerFeeAllowance)) {
            throw new Error(ExchangeContractErrs.INSUFFICIENT_TAKER_FEE_ALLOWANCE);
        }
        if (signedOrder.makerFee.greaterThan(makerFeeBalance)) {
            throw new Error(ExchangeContractErrs.INSUFFICIENT_MAKER_FEE_BALANCE);
        }
        if (signedOrder.makerFee.greaterThan(makerFeeAllowance)) {
            throw new Error(ExchangeContractErrs.INSUFFICIENT_MAKER_FEE_ALLOWANCE);
        }
    }
    private throwErrorLogsAsErrors(logs: ContractEvent[]): void {
        const errEvent = _.find(logs, {event: 'LogError'});
        if (!_.isUndefined(errEvent)) {
            const errCode = errEvent.args.errorId.toNumber();
            const errMessage = this.exchangeContractErrCodesToMsg[errCode];
            throw new Error(errMessage);
        }
    }
    private async isRoundingErrorAsync(takerTokenAmount: BigNumber.BigNumber,
                                       fillTakerAmount: BigNumber.BigNumber,
                                       makerTokenAmount: BigNumber.BigNumber): Promise<boolean> {
        const exchangeInstance = await this.getExchangeContractAsync();
        const senderAddress = await this.web3Wrapper.getSenderAddressOrThrowAsync();
        const isRoundingError = await exchangeInstance.isRoundingError.call(
            takerTokenAmount, fillTakerAmount, makerTokenAmount, {
                from: senderAddress,
            },
        );
        return isRoundingError;
    }
    private async getExchangeContractAsync(): Promise<ExchangeContract> {
        if (!_.isUndefined(this.exchangeContractIfExists)) {
            return this.exchangeContractIfExists;
        }
        const contractInstance = await this.instantiateContractIfExistsAsync((ExchangeArtifacts as any));
        this.exchangeContractIfExists = contractInstance as ExchangeContract;
        return this.exchangeContractIfExists;
    }
    private async getZRXTokenAddressAsync(): Promise<string> {
        const exchangeInstance = await this.getExchangeContractAsync();
        return exchangeInstance.ZRX.call();
    }
}
