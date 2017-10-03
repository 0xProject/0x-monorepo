import * as _ from 'lodash';
import * as BigNumber from 'bignumber.js';
import {SchemaValidator, schemas} from '0x-json-schemas';
import promisify = require('es6-promisify');
import {Web3Wrapper} from '../web3_wrapper';
import {
    ECSignature,
    ExchangeContract,
    ExchangeContractErrCodes,
    ExchangeContractErrs,
    ZeroExError,
    OrderValues,
    OrderAddresses,
    Order,
    OrderFillOrKillRequest,
    SignedOrder,
    ContractEvent,
    ExchangeEvents,
    ContractEventEmitter,
    SubscriptionOpts,
    IndexedFilterValues,
    CreateContractEvent,
    ContractEventObj,
    OrderCancellationRequest,
    OrderFillRequest,
    LogErrorContractEventArgs,
    LogFillContractEventArgs,
    LogCancelContractEventArgs,
    LogWithDecodedArgs,
    MethodOpts,
    ValidateOrderFillableOpts,
    OrderTransactionOpts,
    RawLog,
} from '../types';
import {assert} from '../utils/assert';
import {utils} from '../utils/utils';
import {eventUtils} from '../utils/event_utils';
import {OrderValidationUtils} from '../utils/order_validation_utils';
import {ContractWrapper} from './contract_wrapper';
import {constants} from '../utils/constants';
import {TokenWrapper} from './token_wrapper';
import {decorators} from '../utils/decorators';
import {AbiDecoder} from '../utils/abi_decoder';
import {artifacts} from '../artifacts';

const SHOULD_VALIDATE_BY_DEFAULT = true;

/**
 * This class includes all the functionality related to calling methods and subscribing to
 * events of the 0x Exchange smart contract.
 */
export class ExchangeWrapper extends ContractWrapper {
    private _exchangeContractIfExists?: ExchangeContract;
    private _exchangeLogEventEmitters: ContractEventEmitter[];
    private _orderValidationUtils: OrderValidationUtils;
    private _tokenWrapper: TokenWrapper;
    private _exchangeContractErrCodesToMsg = {
        [ExchangeContractErrCodes.ERROR_FILL_EXPIRED]: ExchangeContractErrs.OrderFillExpired,
        [ExchangeContractErrCodes.ERROR_CANCEL_EXPIRED]: ExchangeContractErrs.OrderFillExpired,
        [ExchangeContractErrCodes.ERROR_FILL_NO_VALUE]: ExchangeContractErrs.OrderRemainingFillAmountZero,
        [ExchangeContractErrCodes.ERROR_CANCEL_NO_VALUE]: ExchangeContractErrs.OrderRemainingFillAmountZero,
        [ExchangeContractErrCodes.ERROR_FILL_TRUNCATION]: ExchangeContractErrs.OrderFillRoundingError,
        [ExchangeContractErrCodes.ERROR_FILL_BALANCE_ALLOWANCE]: ExchangeContractErrs.FillBalanceAllowanceError,
    };
    private _contractAddressIfExists?: string;
    private static _getOrderAddressesAndValues(order: Order): [OrderAddresses, OrderValues] {
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
        return [orderAddresses, orderValues];
    }
    constructor(web3Wrapper: Web3Wrapper, abiDecoder: AbiDecoder,
                tokenWrapper: TokenWrapper, contractAddressIfExists?: string) {
        super(web3Wrapper, abiDecoder);
        this._tokenWrapper = tokenWrapper;
        this._orderValidationUtils = new OrderValidationUtils(tokenWrapper, this);
        this._exchangeLogEventEmitters = [];
        this._contractAddressIfExists = contractAddressIfExists;
    }
    /**
     * Returns the unavailable takerAmount of an order. Unavailable amount is defined as the total
     * amount that has been filled or cancelled. The remaining takerAmount can be calculated by
     * subtracting the unavailable amount from the total order takerAmount.
     * @param   orderHash               The hex encoded orderHash for which you would like to retrieve the
     *                                  unavailable takerAmount.
     * @param   methodOpts              Optional arguments this method accepts.
     * @return  The amount of the order (in taker tokens) that has either been filled or canceled.
     */
    public async getUnavailableTakerAmountAsync(orderHash: string,
                                                methodOpts?: MethodOpts): Promise<BigNumber.BigNumber> {
        assert.doesConformToSchema('orderHash', orderHash, schemas.orderHashSchema);

        const exchangeContract = await this._getExchangeContractAsync();
        const defaultBlock = _.isUndefined(methodOpts) ? undefined : methodOpts.defaultBlock;
        let unavailableTakerTokenAmount = await exchangeContract.getUnavailableTakerTokenAmount.callAsync(
            orderHash, defaultBlock,
        );
        // Wrap BigNumbers returned from web3 with our own (later) version of BigNumber
        unavailableTakerTokenAmount = new BigNumber(unavailableTakerTokenAmount);
        return unavailableTakerTokenAmount;
    }
    /**
     * Retrieve the takerAmount of an order that has already been filled.
     * @param   orderHash    The hex encoded orderHash for which you would like to retrieve the filled takerAmount.
     * @param   methodOpts   Optional arguments this method accepts.
     * @return  The amount of the order (in taker tokens) that has already been filled.
     */
    public async getFilledTakerAmountAsync(orderHash: string, methodOpts?: MethodOpts): Promise<BigNumber.BigNumber> {
        assert.doesConformToSchema('orderHash', orderHash, schemas.orderHashSchema);

        const exchangeContract = await this._getExchangeContractAsync();
        const defaultBlock = _.isUndefined(methodOpts) ? undefined : methodOpts.defaultBlock;
        let fillAmountInBaseUnits = await exchangeContract.filled.callAsync(orderHash, defaultBlock);
        // Wrap BigNumbers returned from web3 with our own (later) version of BigNumber
        fillAmountInBaseUnits = new BigNumber(fillAmountInBaseUnits);
        return fillAmountInBaseUnits;
    }
    /**
     * Retrieve the takerAmount of an order that has been cancelled.
     * @param   orderHash    The hex encoded orderHash for which you would like to retrieve the
     *                       cancelled takerAmount.
     * @param   methodOpts   Optional arguments this method accepts.
     * @return  The amount of the order (in taker tokens) that has been cancelled.
     */
    public async getCanceledTakerAmountAsync(orderHash: string, methodOpts?: MethodOpts): Promise<BigNumber.BigNumber> {
        assert.doesConformToSchema('orderHash', orderHash, schemas.orderHashSchema);

        const exchangeContract = await this._getExchangeContractAsync();
        const defaultBlock = _.isUndefined(methodOpts) ? undefined : methodOpts.defaultBlock;
        let cancelledAmountInBaseUnits = await exchangeContract.cancelled.callAsync(orderHash, defaultBlock);
        // Wrap BigNumbers returned from web3 with our own (later) version of BigNumber
        cancelledAmountInBaseUnits = new BigNumber(cancelledAmountInBaseUnits);
        return cancelledAmountInBaseUnits;
    }
    /**
     * Fills a signed order with an amount denominated in baseUnits of the taker token.
     * Since the order in which transactions are included in the next block is indeterminate, race-conditions
     * could arise where a users balance or allowance changes before the fillOrder executes. Because of this,
     * we allow you to specify `shouldThrowOnInsufficientBalanceOrAllowance`.
     * If false, the smart contract will not throw if the parties
     * do not have sufficient balances/allowances, preserving gas costs. Setting it to true forgoes this check
     * and causes the smart contract to throw (using all the gas supplied) instead.
     * @param   signedOrder                                 An object that conforms to the SignedOrder interface.
     * @param   fillTakerTokenAmount                        The amount of the order (in taker tokens baseUnits) that
     *                                                      you wish to fill.
     * @param   shouldThrowOnInsufficientBalanceOrAllowance Whether or not you wish for the contract call to throw
     *                                                      if upon execution the tokens cannot be transferred.
     * @param   takerAddress                                The user Ethereum address who would like to fill this order.
     *                                                      Must be available via the supplied Web3.Provider
     *                                                      passed to 0x.js.
     * @param   orderTransactionOpts                        Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.contractCallErrorHandler
    public async fillOrderAsync(signedOrder: SignedOrder, fillTakerTokenAmount: BigNumber.BigNumber,
                                shouldThrowOnInsufficientBalanceOrAllowance: boolean,
                                takerAddress: string,
                                orderTransactionOpts?: OrderTransactionOpts): Promise<string> {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        assert.isBigNumber('fillTakerTokenAmount', fillTakerTokenAmount);
        assert.isBoolean('shouldThrowOnInsufficientBalanceOrAllowance', shouldThrowOnInsufficientBalanceOrAllowance);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);

        const exchangeInstance = await this._getExchangeContractAsync();
        const shouldValidate = _.isUndefined(orderTransactionOpts) ?
            SHOULD_VALIDATE_BY_DEFAULT :
            orderTransactionOpts.shouldValidate;
        if (shouldValidate) {
            await this.validateFillOrderThrowIfInvalidAsync(signedOrder, fillTakerTokenAmount, takerAddress);
        }

        const [orderAddresses, orderValues] = ExchangeWrapper._getOrderAddressesAndValues(signedOrder);

        const gas = await exchangeInstance.fillOrder.estimateGasAsync(
            orderAddresses,
            orderValues,
            fillTakerTokenAmount,
            shouldThrowOnInsufficientBalanceOrAllowance,
            signedOrder.ecSignature.v,
            signedOrder.ecSignature.r,
            signedOrder.ecSignature.s,
            {
                from: takerAddress,
            },
        );
        const txHash: string = await exchangeInstance.fillOrder.sendTransactionAsync(
            orderAddresses,
            orderValues,
            fillTakerTokenAmount,
            shouldThrowOnInsufficientBalanceOrAllowance,
            signedOrder.ecSignature.v,
            signedOrder.ecSignature.r,
            signedOrder.ecSignature.s,
            {
                from: takerAddress,
                gas,
            },
        );
        return txHash;
    }
    /**
     * Sequentially and atomically fills signedOrders up to the specified takerTokenFillAmount.
     * If the fill amount is reached - it succeeds and does not fill the rest of the orders.
     * If fill amount is not reached - it fills as much of the fill amount as possible and succeeds.
     * @param   signedOrders                                The array of signedOrders that you would like to fill until
     *                                                      takerTokenFillAmount is reached.
     * @param   fillTakerTokenAmount                        The total amount of the takerTokens you would like to fill.
     * @param   shouldThrowOnInsufficientBalanceOrAllowance Whether or not you wish for the contract call to throw if
     *                                                      upon execution any of the tokens cannot be transferred.
     *                                                      If set to false, the call will continue to fill subsequent
     *                                                      signedOrders even when some cannot be filled.
     * @param   takerAddress                                The user Ethereum address who would like to fill these
     *                                                      orders. Must be available via the supplied Web3.Provider
     *                                                      passed to 0x.js.
     * @param   orderTransactionOpts                        Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.contractCallErrorHandler
    public async fillOrdersUpToAsync(signedOrders: SignedOrder[], fillTakerTokenAmount: BigNumber.BigNumber,
                                     shouldThrowOnInsufficientBalanceOrAllowance: boolean,
                                     takerAddress: string,
                                     orderTransactionOpts?: OrderTransactionOpts): Promise<string> {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        const takerTokenAddresses = _.map(signedOrders, signedOrder => signedOrder.takerTokenAddress);
        assert.hasAtMostOneUniqueValue(takerTokenAddresses,
                                       ExchangeContractErrs.MultipleTakerTokensInFillUpToDisallowed);
        const exchangeContractAddresses = _.map(signedOrders, signedOrder => signedOrder.exchangeContractAddress);
        assert.hasAtMostOneUniqueValue(exchangeContractAddresses,
                                       ExchangeContractErrs.BatchOrdersMustHaveSameExchangeAddress);
        assert.isBigNumber('fillTakerTokenAmount', fillTakerTokenAmount);
        assert.isBoolean('shouldThrowOnInsufficientBalanceOrAllowance', shouldThrowOnInsufficientBalanceOrAllowance);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);

        const shouldValidate = _.isUndefined(orderTransactionOpts) ?
            SHOULD_VALIDATE_BY_DEFAULT :
            orderTransactionOpts.shouldValidate;
        if (shouldValidate) {
            await Promise.all(signedOrders.map(signedOrder => this.validateFillOrderThrowIfInvalidAsync(
                signedOrder, fillTakerTokenAmount, takerAddress)));
        }

        if (_.isEmpty(signedOrders)) {
            throw new Error(ExchangeContractErrs.BatchOrdersMustHaveAtLeastOneItem);
        }

        const orderAddressesValuesAndSignatureArray = _.map(signedOrders, signedOrder => {
            return [
                ...ExchangeWrapper._getOrderAddressesAndValues(signedOrder),
                signedOrder.ecSignature.v,
                signedOrder.ecSignature.r,
                signedOrder.ecSignature.s,
            ];
        });
        // We use _.unzip<any> because _.unzip doesn't type check if values have different types :'(
        const [orderAddressesArray, orderValuesArray, vArray, rArray, sArray] = _.unzip<any>(
            orderAddressesValuesAndSignatureArray,
        );

        const exchangeInstance = await this._getExchangeContractAsync();
        const gas = await exchangeInstance.fillOrdersUpTo.estimateGasAsync(
            orderAddressesArray,
            orderValuesArray,
            fillTakerTokenAmount,
            shouldThrowOnInsufficientBalanceOrAllowance,
            vArray,
            rArray,
            sArray,
            {
                from: takerAddress,
            },
        );
        const txHash = await exchangeInstance.fillOrdersUpTo.sendTransactionAsync(
            orderAddressesArray,
            orderValuesArray,
            fillTakerTokenAmount,
            shouldThrowOnInsufficientBalanceOrAllowance,
            vArray,
            rArray,
            sArray,
            {
                from: takerAddress,
                gas,
            },
        );
        return txHash;
    }
    /**
     * Batch version of fillOrderAsync.
     * Executes multiple fills atomically in a single transaction.
     * If shouldThrowOnInsufficientBalanceOrAllowance is set to true, it will continue filling subsequent orders even
     * when earlier ones fail.
     * When shouldThrowOnInsufficientBalanceOrAllowance is set to false, if any fill fails, the entire batch fails.
     * @param   orderFillRequests                               An array of objects that conform to the
     *                                                          OrderFillRequest interface.
     * @param   shouldThrowOnInsufficientBalanceOrAllowance     Whether or not you wish for the contract call to throw
     *                                                          if upon execution any of the tokens cannot be
     *                                                          transferred. If set to false, the call will continue to
     *                                                          fill subsequent signedOrders even when some
     *                                                          cannot be filled.
     * @param   takerAddress                                    The user Ethereum address who would like to fill
     *                                                          these orders. Must be available via the supplied
     *                                                          Web3.Provider passed to 0x.js.
     * @param   orderTransactionOpts                            Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.contractCallErrorHandler
    public async batchFillOrdersAsync(orderFillRequests: OrderFillRequest[],
                                      shouldThrowOnInsufficientBalanceOrAllowance: boolean,
                                      takerAddress: string,
                                      orderTransactionOpts?: OrderTransactionOpts): Promise<string> {
        assert.doesConformToSchema('orderFillRequests', orderFillRequests, schemas.orderFillRequestsSchema);
        const exchangeContractAddresses = _.map(
            orderFillRequests,
            orderFillRequest => orderFillRequest.signedOrder.exchangeContractAddress,
        );
        assert.hasAtMostOneUniqueValue(exchangeContractAddresses,
                                       ExchangeContractErrs.BatchOrdersMustHaveSameExchangeAddress);
        assert.isBoolean('shouldThrowOnInsufficientBalanceOrAllowance', shouldThrowOnInsufficientBalanceOrAllowance);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        const shouldValidate = _.isUndefined(orderTransactionOpts) ?
            SHOULD_VALIDATE_BY_DEFAULT :
            orderTransactionOpts.shouldValidate;
        if (shouldValidate) {
            await Promise.all(orderFillRequests.map(orderFillRequest => this.validateFillOrderThrowIfInvalidAsync(
                orderFillRequest.signedOrder, orderFillRequest.takerTokenFillAmount, takerAddress)),
            );
        }
        if (_.isEmpty(orderFillRequests)) {
            throw new Error(ExchangeContractErrs.BatchOrdersMustHaveAtLeastOneItem);
        }

        const orderAddressesValuesAmountsAndSignatureArray = _.map(orderFillRequests, orderFillRequest => {
            return [
                ...ExchangeWrapper._getOrderAddressesAndValues(orderFillRequest.signedOrder),
                orderFillRequest.takerTokenFillAmount,
                orderFillRequest.signedOrder.ecSignature.v,
                orderFillRequest.signedOrder.ecSignature.r,
                orderFillRequest.signedOrder.ecSignature.s,
            ];
        });
        // We use _.unzip<any> because _.unzip doesn't type check if values have different types :'(
        const [orderAddressesArray, orderValuesArray, fillTakerTokenAmounts, vArray, rArray, sArray] = _.unzip<any>(
            orderAddressesValuesAmountsAndSignatureArray,
        );

        const exchangeInstance = await this._getExchangeContractAsync();
        const gas = await exchangeInstance.batchFillOrders.estimateGasAsync(
            orderAddressesArray,
            orderValuesArray,
            fillTakerTokenAmounts,
            shouldThrowOnInsufficientBalanceOrAllowance,
            vArray,
            rArray,
            sArray,
            {
                from: takerAddress,
            },
        );
        const txHash = await exchangeInstance.batchFillOrders.sendTransactionAsync(
            orderAddressesArray,
            orderValuesArray,
            fillTakerTokenAmounts,
            shouldThrowOnInsufficientBalanceOrAllowance,
            vArray,
            rArray,
            sArray,
            {
                from: takerAddress,
                gas,
            },
        );
        return txHash;
    }
    /**
     * Attempts to fill a specific amount of an order. If the entire amount specified cannot be filled,
     * the fill order is abandoned.
     * @param   signedOrder             An object that conforms to the SignedOrder interface. The
     *                                  signedOrder you wish to fill.
     * @param   fillTakerTokenAmount    The total amount of the takerTokens you would like to fill.
     * @param   takerAddress            The user Ethereum address who would like to fill this order.
     *                                  Must be available via the supplied Web3.Provider passed to 0x.js.
     * @param   orderTransactionOpts    Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.contractCallErrorHandler
    public async fillOrKillOrderAsync(signedOrder: SignedOrder, fillTakerTokenAmount: BigNumber.BigNumber,
                                      takerAddress: string,
                                      orderTransactionOpts?: OrderTransactionOpts): Promise<string> {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        assert.isBigNumber('fillTakerTokenAmount', fillTakerTokenAmount);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);

        const exchangeInstance = await this._getExchangeContractAsync();

        const shouldValidate = _.isUndefined(orderTransactionOpts) ?
            SHOULD_VALIDATE_BY_DEFAULT :
            orderTransactionOpts.shouldValidate;
        if (shouldValidate) {
            await this.validateFillOrKillOrderThrowIfInvalidAsync(signedOrder, fillTakerTokenAmount, takerAddress);
        }

        const [orderAddresses, orderValues] = ExchangeWrapper._getOrderAddressesAndValues(signedOrder);

        const gas = await exchangeInstance.fillOrKillOrder.estimateGasAsync(
            orderAddresses,
            orderValues,
            fillTakerTokenAmount,
            signedOrder.ecSignature.v,
            signedOrder.ecSignature.r,
            signedOrder.ecSignature.s,
            {
                from: takerAddress,
            },
        );
        const txHash = await exchangeInstance.fillOrKillOrder.sendTransactionAsync(
            orderAddresses,
            orderValues,
            fillTakerTokenAmount,
            signedOrder.ecSignature.v,
            signedOrder.ecSignature.r,
            signedOrder.ecSignature.s,
            {
                from: takerAddress,
                gas,
            },
        );
        return txHash;
    }
    /**
     * Batch version of fillOrKill. Allows a taker to specify a batch of orders that will either be atomically
     * filled (each to the specified fillAmount) or aborted.
     * @param   orderFillOrKillRequests     An array of objects that conform to the OrderFillOrKillRequest interface.
     * @param   takerAddress                The user Ethereum address who would like to fill there orders.
     *                                      Must be available via the supplied Web3.Provider passed to 0x.js.
     * @param   orderTransactionOpts        Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.contractCallErrorHandler
    public async batchFillOrKillAsync(orderFillOrKillRequests: OrderFillOrKillRequest[],
                                      takerAddress: string,
                                      orderTransactionOpts?: OrderTransactionOpts): Promise<string> {
        assert.doesConformToSchema('orderFillOrKillRequests', orderFillOrKillRequests,
                                   schemas.orderFillOrKillRequestsSchema);
        const exchangeContractAddresses = _.map(
            orderFillOrKillRequests,
            orderFillOrKillRequest => orderFillOrKillRequest.signedOrder.exchangeContractAddress,
        );
        assert.hasAtMostOneUniqueValue(exchangeContractAddresses,
                                       ExchangeContractErrs.BatchOrdersMustHaveSameExchangeAddress);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        if (_.isEmpty(orderFillOrKillRequests)) {
            throw new Error(ExchangeContractErrs.BatchOrdersMustHaveAtLeastOneItem);
        }
        const exchangeInstance = await this._getExchangeContractAsync();

        const shouldValidate = _.isUndefined(orderTransactionOpts) ?
            SHOULD_VALIDATE_BY_DEFAULT :
            orderTransactionOpts.shouldValidate;
        if (shouldValidate) {
            await Promise.all(orderFillOrKillRequests.map(request => this.validateFillOrKillOrderThrowIfInvalidAsync(
                request.signedOrder, request.fillTakerAmount, takerAddress)),
            );
        }

        const orderAddressesValuesAndTakerTokenFillAmounts = _.map(orderFillOrKillRequests, request => {
            return [
                ...ExchangeWrapper._getOrderAddressesAndValues(request.signedOrder),
                request.fillTakerAmount,
                request.signedOrder.ecSignature.v,
                request.signedOrder.ecSignature.r,
                request.signedOrder.ecSignature.s,
            ];
        });

        // We use _.unzip<any> because _.unzip doesn't type check if values have different types :'(
        const [orderAddresses, orderValues, fillTakerTokenAmounts, vParams, rParams, sParams] =
              _.unzip<any>(orderAddressesValuesAndTakerTokenFillAmounts);

        const gas = await exchangeInstance.batchFillOrKillOrders.estimateGasAsync(
            orderAddresses,
            orderValues,
            fillTakerTokenAmounts,
            vParams,
            rParams,
            sParams,
            {
                from: takerAddress,
            },
        );
        const txHash = await exchangeInstance.batchFillOrKillOrders.sendTransactionAsync(
            orderAddresses,
            orderValues,
            fillTakerTokenAmounts,
            vParams,
            rParams,
            sParams,
            {
                from: takerAddress,
                gas,
            },
        );
        return txHash;
    }
    /**
     * Cancel a given fill amount of an order. Cancellations are cumulative.
     * @param   order                   An object that conforms to the Order or SignedOrder interface.
     *                                  The order you would like to cancel.
     * @param   cancelTakerTokenAmount  The amount (specified in taker tokens) that you would like to cancel.
     * @param   transactionOpts         Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.contractCallErrorHandler
    public async cancelOrderAsync(order: Order|SignedOrder,
                                  cancelTakerTokenAmount: BigNumber.BigNumber,
                                  orderTransactionOpts?: OrderTransactionOpts): Promise<string> {
        assert.doesConformToSchema('order', order, schemas.orderSchema);
        assert.isBigNumber('takerTokenCancelAmount', cancelTakerTokenAmount);
        await assert.isSenderAddressAsync('order.maker', order.maker, this._web3Wrapper);

        const exchangeInstance = await this._getExchangeContractAsync();

        const shouldValidate = _.isUndefined(orderTransactionOpts) ?
            SHOULD_VALIDATE_BY_DEFAULT :
            orderTransactionOpts.shouldValidate;
        if (shouldValidate) {
            await this.validateCancelOrderThrowIfInvalidAsync(order, cancelTakerTokenAmount);
        }

        const [orderAddresses, orderValues] = ExchangeWrapper._getOrderAddressesAndValues(order);
        const gas = await exchangeInstance.cancelOrder.estimateGasAsync(
            orderAddresses,
            orderValues,
            cancelTakerTokenAmount,
            {
                from: order.maker,
            },
        );
        const txHash = await exchangeInstance.cancelOrder.sendTransactionAsync(
            orderAddresses,
            orderValues,
            cancelTakerTokenAmount,
            {
                from: order.maker,
                gas,
            },
        );
        return txHash;
    }
    /**
     * Batch version of cancelOrderAsync. Atomically cancels multiple orders in a single transaction.
     * All orders must be from the same maker.
     * @param   orderCancellationRequests   An array of objects that conform to the OrderCancellationRequest
     *                                      interface.
     * @param   transactionOpts             Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.contractCallErrorHandler
    public async batchCancelOrdersAsync(orderCancellationRequests: OrderCancellationRequest[],
                                        orderTransactionOpts?: OrderTransactionOpts): Promise<string> {
        assert.doesConformToSchema('orderCancellationRequests', orderCancellationRequests,
                                   schemas.orderCancellationRequestsSchema);
        const exchangeContractAddresses = _.map(
            orderCancellationRequests,
            orderCancellationRequest => orderCancellationRequest.order.exchangeContractAddress,
        );
        assert.hasAtMostOneUniqueValue(exchangeContractAddresses,
                                       ExchangeContractErrs.BatchOrdersMustHaveSameExchangeAddress);
        const makers = _.map(orderCancellationRequests, cancellationRequest => cancellationRequest.order.maker);
        assert.hasAtMostOneUniqueValue(makers, ExchangeContractErrs.MultipleMakersInSingleCancelBatchDisallowed);
        const maker = makers[0];
        await assert.isSenderAddressAsync('maker', maker, this._web3Wrapper);
        const shouldValidate = _.isUndefined(orderTransactionOpts) ?
            SHOULD_VALIDATE_BY_DEFAULT :
            orderTransactionOpts.shouldValidate;
        if (shouldValidate) {
            await Promise.all(orderCancellationRequests.map(cancellationRequest =>
                this.validateCancelOrderThrowIfInvalidAsync(
                    cancellationRequest.order, cancellationRequest.takerTokenCancelAmount)));
        }
        if (_.isEmpty(orderCancellationRequests)) {
            throw new Error(ExchangeContractErrs.BatchOrdersMustHaveAtLeastOneItem);
        }
        const exchangeInstance = await this._getExchangeContractAsync();
        const orderAddressesValuesAndTakerTokenCancelAmounts = _.map(orderCancellationRequests, cancellationRequest => {
            return [
                ...ExchangeWrapper._getOrderAddressesAndValues(cancellationRequest.order),
                cancellationRequest.takerTokenCancelAmount,
            ];
        });
        // We use _.unzip<any> because _.unzip doesn't type check if values have different types :'(
        const [orderAddresses, orderValues, cancelTakerTokenAmounts] =
            _.unzip<any>(orderAddressesValuesAndTakerTokenCancelAmounts);
        const gas = await exchangeInstance.batchCancelOrders.estimateGasAsync(
            orderAddresses,
            orderValues,
            cancelTakerTokenAmounts,
            {
                from: maker,
            },
        );
        const txHash = await exchangeInstance.batchCancelOrders.sendTransactionAsync(
            orderAddresses,
            orderValues,
            cancelTakerTokenAmounts,
            {
                from: maker,
                gas,
            },
        );
        return txHash;
    }
    /**
     * Subscribe to an event type emitted by the Exchange smart contract
     * @param   eventName               The exchange contract event you would like to subscribe to.
     * @param   subscriptionOpts        Subscriptions options that let you configure the subscription.
     * @param   indexFilterValues       An object where the keys are indexed args returned by the event and
     *                                  the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param   exchangeContractAddress The hex encoded address of the Exchange contract to call.
     * @return                      ContractEventEmitter object
     */
    public async subscribeAsync(eventName: ExchangeEvents, subscriptionOpts: SubscriptionOpts,
                                indexFilterValues: IndexedFilterValues, exchangeContractAddress: string):
                                Promise<ContractEventEmitter> {
        assert.isETHAddressHex('exchangeContractAddress', exchangeContractAddress);
        assert.doesBelongToStringEnum('eventName', eventName, ExchangeEvents);
        assert.doesConformToSchema('subscriptionOpts', subscriptionOpts, schemas.subscriptionOptsSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const exchangeContract = await this._getExchangeContractAsync();
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
                throw utils.spawnSwitchErr('ExchangeEvents', eventName);
        }

        const logEventObj: ContractEventObj = createLogEvent(indexFilterValues, subscriptionOpts);
        const eventEmitter = eventUtils.wrapEventEmitter(logEventObj);
        this._exchangeLogEventEmitters.push(eventEmitter);
        return eventEmitter;
    }
    /**
     * Gets historical logs without creating a subscription
     * @param   eventName           The exchange contract event you would like to subscribe to.
     * @param   subscriptionOpts    Subscriptions options that let you configure the subscription.
     * @param   indexFilterValues   An object where the keys are indexed args returned by the event and
     *                              the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return  Array of logs that match the parameters
     */
    public async getLogsAsync(eventName: ExchangeEvents, subscriptionOpts: SubscriptionOpts,
                              indexFilterValues: IndexedFilterValues): Promise<LogWithDecodedArgs[]> {
        const exchangeContractAddress = await this.getContractAddressAsync();
        const logs = await this._getLogsAsync(
            exchangeContractAddress, eventName, subscriptionOpts, indexFilterValues, artifacts.ExchangeArtifact.abi,
        );
        return logs;
    }
    /**
     * Stops watching for all exchange events
     */
    public async stopWatchingAllEventsAsync(): Promise<void> {
        const stopWatchingPromises = _.map(this._exchangeLogEventEmitters,
                                           logEventObj => logEventObj.stopWatchingAsync());
        await Promise.all(stopWatchingPromises);
        this._exchangeLogEventEmitters = [];
    }
    /**
     * Retrieves the Ethereum address of the Exchange contract deployed on the network
     * that the user-passed web3 provider is connected to.
     * @returns The Ethereum address of the Exchange contract being used.
     */
    public async getContractAddressAsync(): Promise<string> {
        const exchangeInstance = await this._getExchangeContractAsync();
        const exchangeAddress = exchangeInstance.address;
        return exchangeAddress;
    }
    /**
     * Checks if order is still fillable and throws an error otherwise. Useful for orderbook
     * pruning where you want to remove stale orders without knowing who the taker will be.
     * @param   signedOrder     An object that conforms to the SignedOrder interface. The
     *                          signedOrder you wish to validate.
     * @param   opts            An object that conforms to the ValidateOrderFillableOpts
     *                          interface. Allows specifying a specific fillTakerTokenAmount
     *                          to validate for.
     */
    public async validateOrderFillableOrThrowAsync(
        signedOrder: SignedOrder, opts?: ValidateOrderFillableOpts,
    ): Promise<void> {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        const zrxTokenAddress = await this.getZRXTokenAddressAsync();
        const expectedFillTakerTokenAmount = !_.isUndefined(opts) ? opts.expectedFillTakerTokenAmount : undefined;
        await this._orderValidationUtils.validateOrderFillableOrThrowAsync(
            signedOrder, zrxTokenAddress, expectedFillTakerTokenAmount,
        );
    }
    /**
     * Checks if order fill will succeed and throws an error otherwise.
     * @param   signedOrder             An object that conforms to the SignedOrder interface. The
     *                                  signedOrder you wish to fill.
     * @param   fillTakerTokenAmount    The total amount of the takerTokens you would like to fill.
     * @param   takerAddress            The user Ethereum address who would like to fill this order.
     *                                  Must be available via the supplied Web3.Provider passed to 0x.js.
     */
    public async validateFillOrderThrowIfInvalidAsync(signedOrder: SignedOrder,
                                                      fillTakerTokenAmount: BigNumber.BigNumber,
                                                      takerAddress: string): Promise<void> {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        assert.isBigNumber('fillTakerTokenAmount', fillTakerTokenAmount);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        const zrxTokenAddress = await this.getZRXTokenAddressAsync();
        await this._orderValidationUtils.validateFillOrderThrowIfInvalidAsync(
            signedOrder, fillTakerTokenAmount, takerAddress, zrxTokenAddress);
    }
    /**
     * Checks if cancelling a given order will succeed and throws an informative error if it won't.
     * @param   order                   An object that conforms to the Order or SignedOrder interface.
     *                                  The order you would like to cancel.
     * @param   cancelTakerTokenAmount  The amount (specified in taker tokens) that you would like to cancel.
     */
    public async validateCancelOrderThrowIfInvalidAsync(
        order: Order, cancelTakerTokenAmount: BigNumber.BigNumber): Promise<void> {
        assert.doesConformToSchema('order', order, schemas.orderSchema);
        assert.isBigNumber('cancelTakerTokenAmount', cancelTakerTokenAmount);
        const orderHash = utils.getOrderHashHex(order);
        const unavailableTakerTokenAmount = await this.getUnavailableTakerAmountAsync(orderHash);
        await this._orderValidationUtils.validateCancelOrderThrowIfInvalidAsync(
            order, cancelTakerTokenAmount, unavailableTakerTokenAmount);
    }
    /**
     * Checks if calling fillOrKill on a given order will succeed and throws an informative error if it won't.
     * @param   signedOrder             An object that conforms to the SignedOrder interface. The
     *                                  signedOrder you wish to fill.
     * @param   fillTakerTokenAmount    The total amount of the takerTokens you would like to fill.
     * @param   takerAddress            The user Ethereum address who would like to fill this order.
     *                                  Must be available via the supplied Web3.Provider passed to 0x.js.
     */
    public async validateFillOrKillOrderThrowIfInvalidAsync(signedOrder: SignedOrder,
                                                            fillTakerTokenAmount: BigNumber.BigNumber,
                                                            takerAddress: string): Promise<void> {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        assert.isBigNumber('fillTakerTokenAmount', fillTakerTokenAmount);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        const zrxTokenAddress = await this.getZRXTokenAddressAsync();
        await this._orderValidationUtils.validateFillOrKillOrderThrowIfInvalidAsync(
            signedOrder, fillTakerTokenAmount, takerAddress, zrxTokenAddress);
    }
    /**
     * Checks if rounding error will be > 0.1% when computing makerTokenAmount by doing:
     * `(fillTakerTokenAmount * makerTokenAmount) / takerTokenAmount`.
     * 0x Protocol does not accept any trades that result in large rounding errors. This means that tokens with few or
     * no decimals can only be filled in quantities and ratios that avoid large rounding errors.
     * @param   fillTakerTokenAmount   The amount of the order (in taker tokens baseUnits) that you wish to fill.
     * @param   takerTokenAmount       The order size on the taker side
     * @param   makerTokenAmount       The order size on the maker side
     */
    public async isRoundingErrorAsync(fillTakerTokenAmount: BigNumber.BigNumber,
                                      takerTokenAmount: BigNumber.BigNumber,
                                      makerTokenAmount: BigNumber.BigNumber): Promise<boolean> {
        assert.isBigNumber('fillTakerTokenAmount', fillTakerTokenAmount);
        assert.isBigNumber('takerTokenAmount', takerTokenAmount);
        assert.isBigNumber('makerTokenAmount', makerTokenAmount);
        const exchangeInstance = await this._getExchangeContractAsync();
        const isRoundingError = await exchangeInstance.isRoundingError.callAsync(
            fillTakerTokenAmount, takerTokenAmount, makerTokenAmount,
        );
        return isRoundingError;
    }
    /**
     * Checks if logs contain LogError, which is emmited by Exchange contract on transaction failure.
     * @param   logsWithDecodedArgs   Transaction logs as returned by `zeroEx.awaitTransactionMinedAsync`
     */
    public throwLogErrorsAsErrors(logsWithDecodedArgs: LogWithDecodedArgs[]): void {
        const errLog = _.find(logsWithDecodedArgs, {event: ExchangeEvents.LogError});
        if (!_.isUndefined(errLog)) {
            const logArgs: LogErrorContractEventArgs = errLog.args as any;
            const errCode = logArgs.errorId.toNumber();
            const errMessage = this._exchangeContractErrCodesToMsg[errCode];
            throw new Error(errMessage);
        }
    }
    /**
     * Returns the ZRX token address used by the exchange contract.
     * @return Address of ZRX token
     */
    public async getZRXTokenAddressAsync(): Promise<string> {
        const exchangeInstance = await this._getExchangeContractAsync();
        const ZRXtokenAddress = await exchangeInstance.ZRX_TOKEN_CONTRACT.callAsync();
        return ZRXtokenAddress;
    }
    private async _invalidateContractInstancesAsync(): Promise<void> {
        await this.stopWatchingAllEventsAsync();
        delete this._exchangeContractIfExists;
    }
    private async _isValidSignatureUsingContractCallAsync(dataHex: string, ecSignature: ECSignature,
                                                          signerAddressHex: string): Promise<boolean> {
        assert.isHexString('dataHex', dataHex);
        assert.doesConformToSchema('ecSignature', ecSignature, schemas.ecSignatureSchema);
        assert.isETHAddressHex('signerAddressHex', signerAddressHex);

        const exchangeInstance = await this._getExchangeContractAsync();

        const isValidSignature = await exchangeInstance.isValidSignature.callAsync(
            signerAddressHex,
            dataHex,
            ecSignature.v,
            ecSignature.r,
            ecSignature.s,
        );
        return isValidSignature;
    }
    private async _getOrderHashHexUsingContractCallAsync(order: Order|SignedOrder): Promise<string> {
        const exchangeInstance = await this._getExchangeContractAsync();
        const [orderAddresses, orderValues] = ExchangeWrapper._getOrderAddressesAndValues(order);
        const orderHashHex = await exchangeInstance.getOrderHash.callAsync(orderAddresses, orderValues);
        return orderHashHex;
    }
    private async _getExchangeContractAsync(): Promise<ExchangeContract> {
        if (!_.isUndefined(this._exchangeContractIfExists)) {
            return this._exchangeContractIfExists;
        }
        const contractInstance = await this._instantiateContractIfExistsAsync<ExchangeContract>(
            artifacts.ExchangeArtifact, this._contractAddressIfExists,
        );
        this._exchangeContractIfExists = contractInstance as ExchangeContract;
        return this._exchangeContractIfExists;
    }
    private async _getTokenTransferProxyAddressAsync(): Promise<string> {
        const exchangeInstance = await this._getExchangeContractAsync();
        const tokenTransferProxyAddress = await exchangeInstance.TOKEN_TRANSFER_PROXY_CONTRACT.callAsync();
        const tokenTransferProxyAddressLowerCase = tokenTransferProxyAddress.toLowerCase();
        return tokenTransferProxyAddressLowerCase;
    }
}
