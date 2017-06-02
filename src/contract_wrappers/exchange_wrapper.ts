import * as _ from 'lodash';
import * as BigNumber from 'bignumber.js';
import promisify = require('es6-promisify');
import {Web3Wrapper} from '../web3_wrapper';
import {
    ECSignature,
    ExchangeContract,
    ExchangeContractErrCodes,
    ExchangeContractErrs,
    FillOrderValidationErrs,
    OrderValues,
    OrderAddresses,
    SignedOrder,
    ContractEvent,
    ZeroExError,
    ExchangeEvents,
    SubscriptionOpts,
    IndexFilterValues,
    CreateContractEvent,
    ContractEventObj,
    EventCallback,
} from '../types';
import {assert} from '../utils/assert';
import {utils} from '../utils/utils';
import {ContractWrapper} from './contract_wrapper';
import * as ExchangeArtifacts from '../artifacts/Exchange.json';
import {ecSignatureSchema} from '../schemas/ec_signature_schema';
import {signedOrderSchema} from '../schemas/order_schemas';
import {SchemaValidator} from '../utils/schema_validator';
import {ContractResponse} from '../types';
import {constants} from '../utils/constants';
import {TokenWrapper} from './token_wrapper';

export class ExchangeWrapper extends ContractWrapper {
    private exchangeContractErrCodesToMsg = {
        [ExchangeContractErrCodes.ERROR_FILL_EXPIRED]: ExchangeContractErrs.ORDER_EXPIRED,
        [ExchangeContractErrCodes.ERROR_CANCEL_EXPIRED]: ExchangeContractErrs.ORDER_EXPIRED,
        [ExchangeContractErrCodes.ERROR_FILL_NO_VALUE]: ExchangeContractErrs.ORDER_REMAINING_FILL_AMOUNT_ZERO,
        [ExchangeContractErrCodes.ERROR_CANCEL_NO_VALUE]: ExchangeContractErrs.ORDER_REMAINING_FILL_AMOUNT_ZERO,
        [ExchangeContractErrCodes.ERROR_FILL_TRUNCATION]: ExchangeContractErrs.ORDER_ROUNDING_ERROR,
        [ExchangeContractErrCodes.ERROR_FILL_BALANCE_ALLOWANCE]: ExchangeContractErrs.ORDER_BALANCE_ALLOWANCE_ERROR,
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
     * Fills a signed order with a fillAmount denominated in baseUnits of the taker token. The caller can
     * decide whether they want the call to throw if the balance/allowance checks fail by setting
     * shouldCheckTransfer to false. If set to true, the call will fail without throwing, preserving gas costs.
     */
    public async fillOrderAsync(signedOrder: SignedOrder, fillTakerAmountInBaseUnits: BigNumber.BigNumber,
                                shouldCheckTransfer: boolean): Promise<void> {
        assert.doesConformToSchema('signedOrder',
                                   SchemaValidator.convertToJSONSchemaCompatibleObject(signedOrder as object),
                                   signedOrderSchema);
        assert.isBigNumber('fillTakerAmountInBaseUnits', fillTakerAmountInBaseUnits);
        assert.isBoolean('shouldCheckTransfer', shouldCheckTransfer);

        const senderAddress = await this.web3Wrapper.getSenderAddressOrThrowAsync();
        await this.validateFillOrderAsync(signedOrder, fillTakerAmountInBaseUnits, senderAddress);

        const exchangeInstance = await this.getExchangeContractAsync();

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
            fillTakerAmountInBaseUnits,
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
            fillTakerAmountInBaseUnits,
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
        for (const logEventObj of this.exchangeLogEventObjs) {
            await promisify(logEventObj.stopWatching, logEventObj)();
        }
        this.exchangeLogEventObjs = [];
    }
    private async validateFillOrderAsync(signedOrder: SignedOrder, fillAmount: BigNumber.BigNumber,
                                         senderAddress: string) {
        if (fillAmount.eq(0)) {
            throw new Error(FillOrderValidationErrs.FILL_AMOUNT_IS_ZERO);
        }
        if (signedOrder.taker !== constants.NULL_ADDRESS && signedOrder.taker !== senderAddress) {
            throw new Error(FillOrderValidationErrs.NOT_A_TAKER);
        }
        if (signedOrder.expirationUnixTimestampSec.lessThan(Date.now() / 1000)) {
            throw new Error(FillOrderValidationErrs.EXPIRED);
        }
        const makerBalance = await this.tokenWrapper.getBalanceAsync(signedOrder.makerTokenAddress,
                                                                        signedOrder.maker);
        const takerBalance = await this.tokenWrapper.getBalanceAsync(signedOrder.takerTokenAddress, senderAddress);
        const makerAllowance = await this.tokenWrapper.getProxyAllowanceAsync(signedOrder.makerTokenAddress,
                                                                              signedOrder.maker);
        const takerAllowance = await this.tokenWrapper.getProxyAllowanceAsync(signedOrder.takerTokenAddress,
                                                                              senderAddress);
        if (fillAmount.greaterThan(takerBalance)) {
            throw new Error(FillOrderValidationErrs.NOT_ENOUGH_TAKER_BALANCE);
        }
        if (fillAmount.greaterThan(takerAllowance)) {
            throw new Error(FillOrderValidationErrs.NOT_ENOUGH_TAKER_ALLOWANCE);
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
    private async getExchangeContractAsync(): Promise<ExchangeContract> {
        if (!_.isUndefined(this.exchangeContractIfExists)) {
            return this.exchangeContractIfExists;
        }
        const contractInstance = await this.instantiateContractIfExistsAsync((ExchangeArtifacts as any));
        this.exchangeContractIfExists = contractInstance as ExchangeContract;
        return this.exchangeContractIfExists;
    }
}
