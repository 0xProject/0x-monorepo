import * as _ from 'lodash';
import * as BigNumber from 'bignumber.js';
import promisify = require('es6-promisify');
import {Web3Wrapper} from '../web3_wrapper';
import {
    ECSignature,
    ExchangeContract,
    ExchangeContractErrCodes,
    ExchangeContractErrs,
    OrderValues,
    OrderAddresses,
    Order,
    SignedOrder,
    ContractEvent,
    ExchangeEvents,
    SubscriptionOpts,
    IndexFilterValues,
    CreateContractEvent,
    ContractEventObj,
    EventCallback,
    ContractResponse,
} from '../types';
import {assert} from '../utils/assert';
import {utils} from '../utils/utils';
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
    private exchangeLogEventObjs: ContractEventObj[];
    private tokenWrapper: TokenWrapper;
    constructor(web3Wrapper: Web3Wrapper, tokenWrapper: TokenWrapper) {
        super(web3Wrapper);
        this.tokenWrapper = tokenWrapper;
        this.exchangeLogEventObjs = [];
    }
    public async invalidateContractInstanceAsync(): Promise<void> {
        await this.stopWatchingExchangeLogEventsAsync();
        delete this.exchangeContractIfExists;
    }
    public async isValidSignatureAsync(dataHex: string, ecSignature: ECSignature,
                                       signerAddressHex: string): Promise<boolean> {
        assert.isHexString('dataHex', dataHex);
        assert.doesConformToSchema('ecSignature', ecSignature, ecSignatureSchema);
        assert.isETHAddressHex('signerAddressHex', signerAddressHex);

        const exchangeInstance = await this.getExchangeContractAsync();

        const isValidSignature = await exchangeInstance.isValidSignature.call(
            signerAddressHex,
            dataHex,
            ecSignature.v,
            ecSignature.r,
            ecSignature.s,
        );
        return isValidSignature;
    }
    /**
     * Returns the unavailable takerAmount of an order. Unavailable amount is defined as the total
     * amount that has been filled or cancelled. The remaining takerAmount can be calculated by
     * subtracting the unavailable amount from the total order takerAmount.
     */
    public async getUnavailableTakerAmountAsync(orderHashHex: string): Promise<BigNumber.BigNumber> {
        assert.isValidOrderHash('orderHashHex', orderHashHex);

        const exchangeContract = await this.getExchangeContractAsync();
        let unavailableAmountInBaseUnits = await exchangeContract.getUnavailableValueT.call(orderHashHex);
        // Wrap BigNumbers returned from web3 with our own (later) version of BigNumber
        unavailableAmountInBaseUnits = new BigNumber(unavailableAmountInBaseUnits);
        return unavailableAmountInBaseUnits;
    }
    /**
     * Retrieve the takerAmount of an order that has already been filled.
     */
    public async getFilledTakerAmountAsync(orderHashHex: string): Promise<BigNumber.BigNumber> {
        assert.isValidOrderHash('orderHashHex', orderHashHex);

        const exchangeContract = await this.getExchangeContractAsync();
        let fillAmountInBaseUnits = await exchangeContract.filled.call(orderHashHex);
        // Wrap BigNumbers returned from web3 with our own (later) version of BigNumber
        fillAmountInBaseUnits = new BigNumber(fillAmountInBaseUnits);
        return fillAmountInBaseUnits;
    }
    /**
     * Retrieve the takerAmount of an order that has been cancelled.
     */
    public async getCanceledTakerAmountAsync(orderHashHex: string): Promise<BigNumber.BigNumber> {
        assert.isValidOrderHash('orderHashHex', orderHashHex);

        const exchangeContract = await this.getExchangeContractAsync();
        let cancelledAmountInBaseUnits = await exchangeContract.cancelled.call(orderHashHex);
        // Wrap BigNumbers returned from web3 with our own (later) version of BigNumber
        cancelledAmountInBaseUnits = new BigNumber(cancelledAmountInBaseUnits);
        return cancelledAmountInBaseUnits;
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
                                shouldCheckTransfer: boolean, takerAddress: string): Promise<void> {
        assert.doesConformToSchema('signedOrder',
                                   SchemaValidator.convertToJSONSchemaCompatibleObject(signedOrder as object),
                                   signedOrderSchema);
        assert.isBigNumber('fillTakerAmount', fillTakerAmount);
        assert.isBoolean('shouldCheckTransfer', shouldCheckTransfer);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this.web3Wrapper);

        const exchangeInstance = await this.getExchangeContractAsync();
        await this.validateFillOrderAndThrowIfInvalidAsync(signedOrder, fillTakerAmount, takerAddress);

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
                from: takerAddress,
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
                from: takerAddress,
                gas,
            },
        );
        this.throwErrorLogsAsErrors(response.logs);
    }
    /**
     * Cancels the order.
     */
    public async cancelOrderAsync(order: Order, cancelAmount: BigNumber.BigNumber): Promise<void> {
        assert.doesConformToSchema('order',
            SchemaValidator.convertToJSONSchemaCompatibleObject(order as object),
            signedOrderSchema);
        assert.isBigNumber('cancelAmount', cancelAmount);
        await assert.isSenderAddressAvailableAsync(this.web3Wrapper, 'order.maker', order.maker);

        const exchangeInstance = await this.getExchangeContractAsync();
        await this.validateCancelOrderAndThrowIfInvalidAsync(order, cancelAmount);

        const orderAddresses: OrderAddresses = [
            order.maker,
            order.taker,
            order.makerTokenAddress,
            order.takerTokenAddress,
            order.feeRecipient,
        ];
        const orderValues: OrderValues = [
            order.makerTokenAmount,
            order.takerTokenAmount,
            order.makerFee,
            order.takerFee,
            order.expirationUnixTimestampSec,
            order.salt,
        ];
        const gas = await exchangeInstance.cancel.estimateGas(
            orderAddresses,
            orderValues,
            cancelAmount,
            {
                from: order.maker,
            },
        );
        const response: ContractResponse = await exchangeInstance.cancel(
            orderAddresses,
            orderValues,
            cancelAmount,
            {
                from: order.maker,
                gas,
            },
        );
        this.throwErrorLogsAsErrors(response.logs);
    }
    /**
     * Subscribe to an event type emitted by the Exchange smart contract
     */
    public async subscribeAsync(eventName: ExchangeEvents, subscriptionOpts: SubscriptionOpts,
                                indexFilterValues: IndexFilterValues, callback: EventCallback) {
        const exchangeContract = await this.getExchangeContractAsync();
        let createLogEvent: CreateContractEvent;
        switch (eventName) {
            case ExchangeEvents.LogFill:
                createLogEvent = exchangeContract.LogFill;
                break;
            case ExchangeEvents.LogError:
                createLogEvent = exchangeContract.LogError;
                break;
            case ExchangeEvents.LogCancel:
                createLogEvent = exchangeContract.LogCancel;
                break;
            default:
                utils.spawnSwitchErr('ExchangeEvents', eventName);
                return;
        }

        const logEventObj: ContractEventObj = createLogEvent(indexFilterValues, subscriptionOpts);
        logEventObj.watch(callback);
        this.exchangeLogEventObjs.push(logEventObj);
    }
    private async stopWatchingExchangeLogEventsAsync() {
        const stopWatchingPromises = _.map(this.exchangeLogEventObjs, logEventObj => {
            return promisify(logEventObj.stopWatching, logEventObj)();
        });
        await Promise.all(stopWatchingPromises);
        this.exchangeLogEventObjs = [];
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
    private async validateCancelOrderAndThrowIfInvalidAsync(order: Order,
                                                            cancelAmount: BigNumber.BigNumber): Promise<void> {
        // TODO
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
        await assert.isUserAddressAvailableAsync(this.web3Wrapper);
        const exchangeInstance = await this.getExchangeContractAsync();
        const isRoundingError = await exchangeInstance.isRoundingError.call(
            takerTokenAmount, fillTakerAmount, makerTokenAmount,
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
