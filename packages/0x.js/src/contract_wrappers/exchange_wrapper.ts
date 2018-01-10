import { schemas } from '@0xproject/json-schemas';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { artifacts } from '../artifacts';
import {
    BlockParamLiteral,
    BlockRange,
    DecodedLogArgs,
    ECSignature,
    EventCallback,
    ExchangeContractErrCodes,
    ExchangeContractErrs,
    ExchangeContractEventArgs,
    ExchangeEvents,
    IndexedFilterValues,
    LogErrorContractEventArgs,
    LogWithDecodedArgs,
    MethodOpts,
    Order,
    OrderAddresses,
    OrderCancellationRequest,
    OrderFillRequest,
    OrderTransactionOpts,
    OrderValues,
    SignedOrder,
    ValidateOrderFillableOpts,
} from '../types';
import { AbiDecoder } from '../utils/abi_decoder';
import { assert } from '../utils/assert';
import { decorators } from '../utils/decorators';
import { ExchangeTransferSimulator } from '../utils/exchange_transfer_simulator';
import { OrderValidationUtils } from '../utils/order_validation_utils';
import { utils } from '../utils/utils';

import { ContractWrapper } from './contract_wrapper';
import { ExchangeContract } from './generated/exchange';
import { TokenWrapper } from './token_wrapper';

const SHOULD_VALIDATE_BY_DEFAULT = true;

interface ExchangeContractErrCodesToMsgs {
    [exchangeContractErrCodes: number]: string;
}

/**
 * This class includes all the functionality related to calling methods and subscribing to
 * events of the 0x Exchange smart contract.
 */
export class ExchangeWrapper extends ContractWrapper {
    private _exchangeContractIfExists?: ExchangeContract;
    private _orderValidationUtils: OrderValidationUtils;
    private _tokenWrapper: TokenWrapper;
    private _exchangeContractErrCodesToMsg: ExchangeContractErrCodesToMsgs = {
        [ExchangeContractErrCodes.ERROR_FILL_EXPIRED]: ExchangeContractErrs.OrderFillExpired,
        [ExchangeContractErrCodes.ERROR_CANCEL_EXPIRED]: ExchangeContractErrs.OrderFillExpired,
        [ExchangeContractErrCodes.ERROR_FILL_NO_VALUE]: ExchangeContractErrs.OrderRemainingFillAmountZero,
        [ExchangeContractErrCodes.ERROR_CANCEL_NO_VALUE]: ExchangeContractErrs.OrderRemainingFillAmountZero,
        [ExchangeContractErrCodes.ERROR_FILL_TRUNCATION]: ExchangeContractErrs.OrderFillRoundingError,
        [ExchangeContractErrCodes.ERROR_FILL_BALANCE_ALLOWANCE]: ExchangeContractErrs.FillBalanceAllowanceError,
    };
    private _contractAddressIfExists?: string;
    private _zrxContractAddressIfExists?: string;
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
    constructor(
        web3Wrapper: Web3Wrapper,
        networkId: number,
        abiDecoder: AbiDecoder,
        tokenWrapper: TokenWrapper,
        contractAddressIfExists?: string,
    ) {
        super(web3Wrapper, networkId, abiDecoder);
        this._tokenWrapper = tokenWrapper;
        this._orderValidationUtils = new OrderValidationUtils(this);
        this._contractAddressIfExists = contractAddressIfExists;
    }
    /**
     * Returns the unavailable takerAmount of an order. Unavailable amount is defined as the total
     * amount that has been filled or cancelled. The remaining takerAmount can be calculated by
     * subtracting the unavailable amount from the total order takerAmount.
     * @param   orderHash               The hex encoded orderHash for which you would like to retrieve the
     *                                  unavailable takerAmount.
     * @param   methodOpts              Optional arguments this method accepts.
     * @return  The amount of the order (in taker tokens) that has either been filled or cancelled.
     */
    public async getUnavailableTakerAmountAsync(orderHash: string, methodOpts?: MethodOpts): Promise<BigNumber> {
        assert.doesConformToSchema('orderHash', orderHash, schemas.orderHashSchema);

        const exchangeContract = await this._getExchangeContractAsync();
        const defaultBlock = _.isUndefined(methodOpts) ? undefined : methodOpts.defaultBlock;
        let unavailableTakerTokenAmount = await exchangeContract.getUnavailableTakerTokenAmount.callAsync(
            orderHash,
            defaultBlock,
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
    public async getFilledTakerAmountAsync(orderHash: string, methodOpts?: MethodOpts): Promise<BigNumber> {
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
    public async getCancelledTakerAmountAsync(orderHash: string, methodOpts?: MethodOpts): Promise<BigNumber> {
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
    @decorators.asyncZeroExErrorHandler
    public async fillOrderAsync(
        signedOrder: SignedOrder,
        fillTakerTokenAmount: BigNumber,
        shouldThrowOnInsufficientBalanceOrAllowance: boolean,
        takerAddress: string,
        orderTransactionOpts: OrderTransactionOpts = {},
    ): Promise<string> {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        assert.isValidBaseUnitAmount('fillTakerTokenAmount', fillTakerTokenAmount);
        assert.isBoolean('shouldThrowOnInsufficientBalanceOrAllowance', shouldThrowOnInsufficientBalanceOrAllowance);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);

        const exchangeInstance = await this._getExchangeContractAsync();
        const shouldValidate = _.isUndefined(orderTransactionOpts.shouldValidate)
            ? SHOULD_VALIDATE_BY_DEFAULT
            : orderTransactionOpts.shouldValidate;
        if (shouldValidate) {
            const zrxTokenAddress = this.getZRXTokenAddress();
            const exchangeTradeEmulator = new ExchangeTransferSimulator(this._tokenWrapper, BlockParamLiteral.Latest);
            await this._orderValidationUtils.validateFillOrderThrowIfInvalidAsync(
                exchangeTradeEmulator,
                signedOrder,
                fillTakerTokenAmount,
                takerAddress,
                zrxTokenAddress,
            );
        }

        const [orderAddresses, orderValues] = ExchangeWrapper._getOrderAddressesAndValues(signedOrder);

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
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
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
    @decorators.asyncZeroExErrorHandler
    public async fillOrdersUpToAsync(
        signedOrders: SignedOrder[],
        fillTakerTokenAmount: BigNumber,
        shouldThrowOnInsufficientBalanceOrAllowance: boolean,
        takerAddress: string,
        orderTransactionOpts: OrderTransactionOpts = {},
    ): Promise<string> {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        const takerTokenAddresses = _.map(signedOrders, signedOrder => signedOrder.takerTokenAddress);
        assert.hasAtMostOneUniqueValue(
            takerTokenAddresses,
            ExchangeContractErrs.MultipleTakerTokensInFillUpToDisallowed,
        );
        const exchangeContractAddresses = _.map(signedOrders, signedOrder => signedOrder.exchangeContractAddress);
        assert.hasAtMostOneUniqueValue(
            exchangeContractAddresses,
            ExchangeContractErrs.BatchOrdersMustHaveSameExchangeAddress,
        );
        assert.isValidBaseUnitAmount('fillTakerTokenAmount', fillTakerTokenAmount);
        assert.isBoolean('shouldThrowOnInsufficientBalanceOrAllowance', shouldThrowOnInsufficientBalanceOrAllowance);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);

        const shouldValidate = _.isUndefined(orderTransactionOpts.shouldValidate)
            ? SHOULD_VALIDATE_BY_DEFAULT
            : orderTransactionOpts.shouldValidate;
        if (shouldValidate) {
            const zrxTokenAddress = this.getZRXTokenAddress();
            const exchangeTradeEmulator = new ExchangeTransferSimulator(this._tokenWrapper, BlockParamLiteral.Latest);
            for (const signedOrder of signedOrders) {
                await this._orderValidationUtils.validateFillOrderThrowIfInvalidAsync(
                    exchangeTradeEmulator,
                    signedOrder,
                    fillTakerTokenAmount,
                    takerAddress,
                    zrxTokenAddress,
                );
            }
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
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
            },
        );
        return txHash;
    }
    /**
     * Batch version of fillOrderAsync.
     * Executes multiple fills atomically in a single transaction.
     * If shouldThrowOnInsufficientBalanceOrAllowance is set to false, it will continue filling subsequent orders even
     * when earlier ones fail.
     * When shouldThrowOnInsufficientBalanceOrAllowance is set to true, if any fill fails, the entire batch fails.
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
    @decorators.asyncZeroExErrorHandler
    public async batchFillOrdersAsync(
        orderFillRequests: OrderFillRequest[],
        shouldThrowOnInsufficientBalanceOrAllowance: boolean,
        takerAddress: string,
        orderTransactionOpts: OrderTransactionOpts = {},
    ): Promise<string> {
        assert.doesConformToSchema('orderFillRequests', orderFillRequests, schemas.orderFillRequestsSchema);
        const exchangeContractAddresses = _.map(
            orderFillRequests,
            orderFillRequest => orderFillRequest.signedOrder.exchangeContractAddress,
        );
        assert.hasAtMostOneUniqueValue(
            exchangeContractAddresses,
            ExchangeContractErrs.BatchOrdersMustHaveSameExchangeAddress,
        );
        assert.isBoolean('shouldThrowOnInsufficientBalanceOrAllowance', shouldThrowOnInsufficientBalanceOrAllowance);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        const shouldValidate = _.isUndefined(orderTransactionOpts.shouldValidate)
            ? SHOULD_VALIDATE_BY_DEFAULT
            : orderTransactionOpts.shouldValidate;
        if (shouldValidate) {
            const zrxTokenAddress = this.getZRXTokenAddress();
            const exchangeTradeEmulator = new ExchangeTransferSimulator(this._tokenWrapper, BlockParamLiteral.Latest);
            for (const orderFillRequest of orderFillRequests) {
                await this._orderValidationUtils.validateFillOrderThrowIfInvalidAsync(
                    exchangeTradeEmulator,
                    orderFillRequest.signedOrder,
                    orderFillRequest.takerTokenFillAmount,
                    takerAddress,
                    zrxTokenAddress,
                );
            }
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
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
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
    @decorators.asyncZeroExErrorHandler
    public async fillOrKillOrderAsync(
        signedOrder: SignedOrder,
        fillTakerTokenAmount: BigNumber,
        takerAddress: string,
        orderTransactionOpts: OrderTransactionOpts = {},
    ): Promise<string> {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        assert.isValidBaseUnitAmount('fillTakerTokenAmount', fillTakerTokenAmount);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);

        const exchangeInstance = await this._getExchangeContractAsync();

        const shouldValidate = _.isUndefined(orderTransactionOpts.shouldValidate)
            ? SHOULD_VALIDATE_BY_DEFAULT
            : orderTransactionOpts.shouldValidate;
        if (shouldValidate) {
            const zrxTokenAddress = this.getZRXTokenAddress();
            const exchangeTradeEmulator = new ExchangeTransferSimulator(this._tokenWrapper, BlockParamLiteral.Latest);
            await this._orderValidationUtils.validateFillOrKillOrderThrowIfInvalidAsync(
                exchangeTradeEmulator,
                signedOrder,
                fillTakerTokenAmount,
                takerAddress,
                zrxTokenAddress,
            );
        }

        const [orderAddresses, orderValues] = ExchangeWrapper._getOrderAddressesAndValues(signedOrder);
        const txHash = await exchangeInstance.fillOrKillOrder.sendTransactionAsync(
            orderAddresses,
            orderValues,
            fillTakerTokenAmount,
            signedOrder.ecSignature.v,
            signedOrder.ecSignature.r,
            signedOrder.ecSignature.s,
            {
                from: takerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
            },
        );
        return txHash;
    }
    /**
     * Batch version of fillOrKill. Allows a taker to specify a batch of orders that will either be atomically
     * filled (each to the specified fillAmount) or aborted.
     * @param   orderFillRequests           An array of objects that conform to the OrderFillRequest interface.
     * @param   takerAddress                The user Ethereum address who would like to fill there orders.
     *                                      Must be available via the supplied Web3.Provider passed to 0x.js.
     * @param   orderTransactionOpts        Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async batchFillOrKillAsync(
        orderFillRequests: OrderFillRequest[],
        takerAddress: string,
        orderTransactionOpts: OrderTransactionOpts = {},
    ): Promise<string> {
        assert.doesConformToSchema('orderFillRequests', orderFillRequests, schemas.orderFillRequestsSchema);
        const exchangeContractAddresses = _.map(
            orderFillRequests,
            orderFillRequest => orderFillRequest.signedOrder.exchangeContractAddress,
        );
        assert.hasAtMostOneUniqueValue(
            exchangeContractAddresses,
            ExchangeContractErrs.BatchOrdersMustHaveSameExchangeAddress,
        );
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        if (_.isEmpty(orderFillRequests)) {
            throw new Error(ExchangeContractErrs.BatchOrdersMustHaveAtLeastOneItem);
        }
        const exchangeInstance = await this._getExchangeContractAsync();

        const shouldValidate = _.isUndefined(orderTransactionOpts.shouldValidate)
            ? SHOULD_VALIDATE_BY_DEFAULT
            : orderTransactionOpts.shouldValidate;
        if (shouldValidate) {
            const zrxTokenAddress = this.getZRXTokenAddress();
            const exchangeTradeEmulator = new ExchangeTransferSimulator(this._tokenWrapper, BlockParamLiteral.Latest);
            for (const orderFillRequest of orderFillRequests) {
                await this._orderValidationUtils.validateFillOrKillOrderThrowIfInvalidAsync(
                    exchangeTradeEmulator,
                    orderFillRequest.signedOrder,
                    orderFillRequest.takerTokenFillAmount,
                    takerAddress,
                    zrxTokenAddress,
                );
            }
        }

        const orderAddressesValuesAndTakerTokenFillAmounts = _.map(orderFillRequests, request => {
            return [
                ...ExchangeWrapper._getOrderAddressesAndValues(request.signedOrder),
                request.takerTokenFillAmount,
                request.signedOrder.ecSignature.v,
                request.signedOrder.ecSignature.r,
                request.signedOrder.ecSignature.s,
            ];
        });

        // We use _.unzip<any> because _.unzip doesn't type check if values have different types :'(
        const [orderAddresses, orderValues, fillTakerTokenAmounts, vParams, rParams, sParams] = _.unzip<any>(
            orderAddressesValuesAndTakerTokenFillAmounts,
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
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
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
    @decorators.asyncZeroExErrorHandler
    public async cancelOrderAsync(
        order: Order | SignedOrder,
        cancelTakerTokenAmount: BigNumber,
        orderTransactionOpts: OrderTransactionOpts = {},
    ): Promise<string> {
        assert.doesConformToSchema('order', order, schemas.orderSchema);
        assert.isValidBaseUnitAmount('takerTokenCancelAmount', cancelTakerTokenAmount);
        await assert.isSenderAddressAsync('order.maker', order.maker, this._web3Wrapper);

        const exchangeInstance = await this._getExchangeContractAsync();

        const shouldValidate = _.isUndefined(orderTransactionOpts.shouldValidate)
            ? SHOULD_VALIDATE_BY_DEFAULT
            : orderTransactionOpts.shouldValidate;
        if (shouldValidate) {
            const orderHash = utils.getOrderHashHex(order);
            const unavailableTakerTokenAmount = await this.getUnavailableTakerAmountAsync(orderHash);
            OrderValidationUtils.validateCancelOrderThrowIfInvalid(
                order,
                cancelTakerTokenAmount,
                unavailableTakerTokenAmount,
            );
        }

        const [orderAddresses, orderValues] = ExchangeWrapper._getOrderAddressesAndValues(order);
        const txHash = await exchangeInstance.cancelOrder.sendTransactionAsync(
            orderAddresses,
            orderValues,
            cancelTakerTokenAmount,
            {
                from: order.maker,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
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
    @decorators.asyncZeroExErrorHandler
    public async batchCancelOrdersAsync(
        orderCancellationRequests: OrderCancellationRequest[],
        orderTransactionOpts: OrderTransactionOpts = {},
    ): Promise<string> {
        assert.doesConformToSchema(
            'orderCancellationRequests',
            orderCancellationRequests,
            schemas.orderCancellationRequestsSchema,
        );
        const exchangeContractAddresses = _.map(
            orderCancellationRequests,
            orderCancellationRequest => orderCancellationRequest.order.exchangeContractAddress,
        );
        assert.hasAtMostOneUniqueValue(
            exchangeContractAddresses,
            ExchangeContractErrs.BatchOrdersMustHaveSameExchangeAddress,
        );
        const makers = _.map(orderCancellationRequests, cancellationRequest => cancellationRequest.order.maker);
        assert.hasAtMostOneUniqueValue(makers, ExchangeContractErrs.MultipleMakersInSingleCancelBatchDisallowed);
        const maker = makers[0];
        await assert.isSenderAddressAsync('maker', maker, this._web3Wrapper);
        const shouldValidate = _.isUndefined(orderTransactionOpts.shouldValidate)
            ? SHOULD_VALIDATE_BY_DEFAULT
            : orderTransactionOpts.shouldValidate;
        if (shouldValidate) {
            for (const orderCancellationRequest of orderCancellationRequests) {
                const orderHash = utils.getOrderHashHex(orderCancellationRequest.order);
                const unavailableTakerTokenAmount = await this.getUnavailableTakerAmountAsync(orderHash);
                OrderValidationUtils.validateCancelOrderThrowIfInvalid(
                    orderCancellationRequest.order,
                    orderCancellationRequest.takerTokenCancelAmount,
                    unavailableTakerTokenAmount,
                );
            }
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
        const [orderAddresses, orderValues, cancelTakerTokenAmounts] = _.unzip<any>(
            orderAddressesValuesAndTakerTokenCancelAmounts,
        );
        const txHash = await exchangeInstance.batchCancelOrders.sendTransactionAsync(
            orderAddresses,
            orderValues,
            cancelTakerTokenAmounts,
            {
                from: maker,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
            },
        );
        return txHash;
    }
    /**
     * Subscribe to an event type emitted by the Exchange contract.
     * @param   eventName           The exchange contract event you would like to subscribe to.
     * @param   indexFilterValues   An object where the keys are indexed args returned by the event and
     *                              the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param   callback            Callback that gets called when a log is added/removed
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends ExchangeContractEventArgs>(
        eventName: ExchangeEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
    ): string {
        assert.doesBelongToStringEnum('eventName', eventName, ExchangeEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const exchangeContractAddress = this.getContractAddress();
        const subscriptionToken = this._subscribe<ArgsType>(
            exchangeContractAddress,
            eventName,
            indexFilterValues,
            artifacts.ExchangeArtifact.abi,
            callback,
        );
        return subscriptionToken;
    }
    /**
     * Cancel a subscription
     * @param   subscriptionToken Subscription token returned by `subscribe()`
     */
    public unsubscribe(subscriptionToken: string): void {
        this._unsubscribe(subscriptionToken);
    }
    /**
     * Cancels all existing subscriptions
     */
    public unsubscribeAll(): void {
        super.unsubscribeAll();
    }
    /**
     * Gets historical logs without creating a subscription
     * @param   eventName           The exchange contract event you would like to subscribe to.
     * @param   blockRange          Block range to get logs from.
     * @param   indexFilterValues   An object where the keys are indexed args returned by the event and
     *                              the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return  Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends ExchangeContractEventArgs>(
        eventName: ExchangeEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.doesBelongToStringEnum('eventName', eventName, ExchangeEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const exchangeContractAddress = this.getContractAddress();
        const logs = await this._getLogsAsync<ArgsType>(
            exchangeContractAddress,
            eventName,
            blockRange,
            indexFilterValues,
            artifacts.ExchangeArtifact.abi,
        );
        return logs;
    }
    /**
     * Retrieves the Ethereum address of the Exchange contract deployed on the network
     * that the user-passed web3 provider is connected to.
     * @returns The Ethereum address of the Exchange contract being used.
     */
    public getContractAddress(): string {
        const contractAddress = this._getContractAddress(artifacts.ExchangeArtifact, this._contractAddressIfExists);
        return contractAddress;
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
        signedOrder: SignedOrder,
        opts?: ValidateOrderFillableOpts,
    ): Promise<void> {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        const zrxTokenAddress = this.getZRXTokenAddress();
        const expectedFillTakerTokenAmount = !_.isUndefined(opts) ? opts.expectedFillTakerTokenAmount : undefined;
        const exchangeTradeEmulator = new ExchangeTransferSimulator(this._tokenWrapper, BlockParamLiteral.Latest);
        await this._orderValidationUtils.validateOrderFillableOrThrowAsync(
            exchangeTradeEmulator,
            signedOrder,
            zrxTokenAddress,
            expectedFillTakerTokenAmount,
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
    public async validateFillOrderThrowIfInvalidAsync(
        signedOrder: SignedOrder,
        fillTakerTokenAmount: BigNumber,
        takerAddress: string,
    ): Promise<void> {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        assert.isValidBaseUnitAmount('fillTakerTokenAmount', fillTakerTokenAmount);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        const zrxTokenAddress = this.getZRXTokenAddress();
        const exchangeTradeEmulator = new ExchangeTransferSimulator(this._tokenWrapper, BlockParamLiteral.Latest);
        await this._orderValidationUtils.validateFillOrderThrowIfInvalidAsync(
            exchangeTradeEmulator,
            signedOrder,
            fillTakerTokenAmount,
            takerAddress,
            zrxTokenAddress,
        );
    }
    /**
     * Checks if cancelling a given order will succeed and throws an informative error if it won't.
     * @param   order                   An object that conforms to the Order or SignedOrder interface.
     *                                  The order you would like to cancel.
     * @param   cancelTakerTokenAmount  The amount (specified in taker tokens) that you would like to cancel.
     */
    public async validateCancelOrderThrowIfInvalidAsync(
        order: Order,
        cancelTakerTokenAmount: BigNumber,
    ): Promise<void> {
        assert.doesConformToSchema('order', order, schemas.orderSchema);
        assert.isValidBaseUnitAmount('cancelTakerTokenAmount', cancelTakerTokenAmount);
        const orderHash = utils.getOrderHashHex(order);
        const unavailableTakerTokenAmount = await this.getUnavailableTakerAmountAsync(orderHash);
        OrderValidationUtils.validateCancelOrderThrowIfInvalid(
            order,
            cancelTakerTokenAmount,
            unavailableTakerTokenAmount,
        );
    }
    /**
     * Checks if calling fillOrKill on a given order will succeed and throws an informative error if it won't.
     * @param   signedOrder             An object that conforms to the SignedOrder interface. The
     *                                  signedOrder you wish to fill.
     * @param   fillTakerTokenAmount    The total amount of the takerTokens you would like to fill.
     * @param   takerAddress            The user Ethereum address who would like to fill this order.
     *                                  Must be available via the supplied Web3.Provider passed to 0x.js.
     */
    public async validateFillOrKillOrderThrowIfInvalidAsync(
        signedOrder: SignedOrder,
        fillTakerTokenAmount: BigNumber,
        takerAddress: string,
    ): Promise<void> {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        assert.isValidBaseUnitAmount('fillTakerTokenAmount', fillTakerTokenAmount);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        const zrxTokenAddress = this.getZRXTokenAddress();
        const exchangeTradeEmulator = new ExchangeTransferSimulator(this._tokenWrapper, BlockParamLiteral.Latest);
        await this._orderValidationUtils.validateFillOrKillOrderThrowIfInvalidAsync(
            exchangeTradeEmulator,
            signedOrder,
            fillTakerTokenAmount,
            takerAddress,
            zrxTokenAddress,
        );
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
    public async isRoundingErrorAsync(
        fillTakerTokenAmount: BigNumber,
        takerTokenAmount: BigNumber,
        makerTokenAmount: BigNumber,
    ): Promise<boolean> {
        assert.isValidBaseUnitAmount('fillTakerTokenAmount', fillTakerTokenAmount);
        assert.isValidBaseUnitAmount('takerTokenAmount', takerTokenAmount);
        assert.isValidBaseUnitAmount('makerTokenAmount', makerTokenAmount);
        const exchangeInstance = await this._getExchangeContractAsync();
        const isRoundingError = await exchangeInstance.isRoundingError.callAsync(
            fillTakerTokenAmount,
            takerTokenAmount,
            makerTokenAmount,
        );
        return isRoundingError;
    }
    /**
     * Checks if logs contain LogError, which is emmited by Exchange contract on transaction failure.
     * @param   logs   Transaction logs as returned by `zeroEx.awaitTransactionMinedAsync`
     */
    public throwLogErrorsAsErrors(logs: Array<LogWithDecodedArgs<DecodedLogArgs> | Web3.LogEntry>): void {
        const errLog = _.find(logs, {
            event: ExchangeEvents.LogError,
        }) as LogWithDecodedArgs<LogErrorContractEventArgs> | undefined;
        if (!_.isUndefined(errLog)) {
            const logArgs = errLog.args;
            const errCode = logArgs.errorId.toNumber();
            const errMessage = this._exchangeContractErrCodesToMsg[errCode];
            throw new Error(errMessage);
        }
    }
    /**
     * Returns the ZRX token address used by the exchange contract.
     * @return Address of ZRX token
     */
    public getZRXTokenAddress(): string {
        const contractAddress = this._getContractAddress(artifacts.ZRXArtifact, this._zrxContractAddressIfExists);
        return contractAddress;
    }
    private _invalidateContractInstances(): void {
        this.unsubscribeAll();
        delete this._exchangeContractIfExists;
    }
    private async _isValidSignatureUsingContractCallAsync(
        dataHex: string,
        ecSignature: ECSignature,
        signerAddressHex: string,
    ): Promise<boolean> {
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
    private async _getOrderHashHexUsingContractCallAsync(order: Order | SignedOrder): Promise<string> {
        const exchangeInstance = await this._getExchangeContractAsync();
        const [orderAddresses, orderValues] = ExchangeWrapper._getOrderAddressesAndValues(order);
        const orderHashHex = await exchangeInstance.getOrderHash.callAsync(orderAddresses, orderValues);
        return orderHashHex;
    }
    private async _getExchangeContractAsync(): Promise<ExchangeContract> {
        if (!_.isUndefined(this._exchangeContractIfExists)) {
            return this._exchangeContractIfExists;
        }
        const web3ContractInstance = await this._instantiateContractIfExistsAsync(
            artifacts.ExchangeArtifact,
            this._contractAddressIfExists,
        );
        const contractInstance = new ExchangeContract(web3ContractInstance, this._web3Wrapper.getContractDefaults());
        this._exchangeContractIfExists = contractInstance;
        return this._exchangeContractIfExists;
    }
    private async _getTokenTransferProxyAddressAsync(): Promise<string> {
        const exchangeInstance = await this._getExchangeContractAsync();
        const tokenTransferProxyAddress = await exchangeInstance.TOKEN_TRANSFER_PROXY_CONTRACT.callAsync();
        const tokenTransferProxyAddressLowerCase = tokenTransferProxyAddress.toLowerCase();
        return tokenTransferProxyAddressLowerCase;
    }
} // tslint:disable:max-file-line-count
