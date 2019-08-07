import { getContractAddressesForNetworkOrThrow } from '@0x/contract-addresses';
import { Coordinator } from '@0x/contract-artifacts';
import { schemas } from '@0x/json-schemas';
import { generatePseudoRandomSalt, signatureUtils } from '@0x/order-utils';
import { Order, SignedOrder, SignedZeroExTransaction, ZeroExTransaction } from '@0x/types';
import { BigNumber, fetchAsync } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { ContractAbi } from 'ethereum-types';
import * as HttpStatus from 'http-status-codes';
import { flatten } from 'lodash';

import { CoordinatorContract, CoordinatorRegistryContract, ExchangeContract } from './index';

import { orderTxOptsSchema } from './schemas/order_tx_opts_schema';
import { txOptsSchema } from './schemas/tx_opts_schema';
import { CoordinatorTransaction, OrderTransactionOpts } from './types';
import { assert } from './utils/assert';
import {
    CoordinatorServerApprovalRawResponse,
    CoordinatorServerApprovalResponse,
    CoordinatorServerCancellationResponse,
    CoordinatorServerError,
    CoordinatorServerErrorMsg,
    CoordinatorServerResponse,
} from './utils/coordinator_server_types';
import { decorators } from './utils/decorators';
import { getAbiEncodedTransactionData } from './utils/getAbiEncodedTransactionData';

/**
 * This class includes all the functionality related to filling or cancelling orders through
 * the 0x V2 Coordinator extension contract.
 */
export class CoordinatorWrapper {
    public abi: ContractAbi = Coordinator.compilerOutput.abi;
    public networkId: number;
    public address: string;
    public exchangeAddress: string;
    public registryAddress: string;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _contractInstance: CoordinatorContract;
    private readonly _registryInstance: CoordinatorRegistryContract;
    private readonly _exchangeInstance: ExchangeContract;
    private readonly _feeRecipientToEndpoint: { [feeRecipient: string]: string } = {};

    /**
     * Instantiate CoordinatorWrapper
     * @param web3Wrapper Web3Wrapper instance to use.
     * @param networkId Desired networkId.
     * @param address The address of the Coordinator contract. If undefined, will
     * default to the known address corresponding to the networkId.
     * @param exchangeAddress The address of the Exchange contract. If undefined, will
     * default to the known address corresponding to the networkId.
     * @param registryAddress The address of the CoordinatorRegistry contract. If undefined, will
     * default to the known address corresponding to the networkId.
     */
    constructor(
        web3Wrapper: Web3Wrapper,
        networkId: number,
        address?: string,
        exchangeAddress?: string,
        registryAddress?: string,
    ) {
        this.networkId = networkId;
        const contractAddresses = getContractAddressesForNetworkOrThrow(networkId);
        this.address = address === undefined ? contractAddresses.coordinator : address;
        this.exchangeAddress = exchangeAddress === undefined ? contractAddresses.coordinator : exchangeAddress;
        this.registryAddress = registryAddress === undefined ? contractAddresses.coordinatorRegistry : registryAddress;
        this._web3Wrapper = web3Wrapper;

        this._contractInstance = new CoordinatorContract(
            this.address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        this._registryInstance = new CoordinatorRegistryContract(
            this.registryAddress,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        this._exchangeInstance = new ExchangeContract(
            this.exchangeAddress,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
    }

    /**
     * Fills a signed order with an amount denominated in baseUnits of the taker asset. Under-the-hood, this
     * method uses the `feeRecipientAddress` of the order to look up the coordinator server endpoint registered in the
     * coordinator registry contract. It requests a signature from that coordinator server before
     * submitting the order and signature as a 0x transaction to the coordinator extension contract. The coordinator extension
     * contract validates signatures and then fills the order via the Exchange contract.
     * @param   signedOrder           An object that conforms to the SignedOrder interface.
     * @param   takerAssetFillAmount  The amount of the order (in taker asset baseUnits) that you wish to fill.
     * @param   takerAddress          The user Ethereum address who would like to fill this order. Must be available via the supplied
     *                                Provider provided at instantiation.
     * @param   orderTransactionOpts  Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async fillOrderAsync(
        signedOrder: SignedOrder,
        takerAssetFillAmount: BigNumber,
        takerAddress: string,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        assert.isValidBaseUnitAmount('takerAssetFillAmount', takerAssetFillAmount);
        assert.isETHAddressHex('takerAddress', takerAddress);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);

        const data = this._getAbiEncodedTransactionData(
            'fillOrder',
            signedOrder,
            takerAssetFillAmount,
            signedOrder.signature,
        );
        const txHash = await this._handleFillsAsync(data, takerAddress, [signedOrder], orderTransactionOpts);
        return txHash;
    }

    /**
     * No-throw version of fillOrderAsync. This version will not throw if the fill fails. This allows the caller to save gas at the expense of not knowing the reason the fill failed.
     * @param   signedOrder          An object that conforms to the SignedOrder interface.
     * @param   takerAssetFillAmount The amount of the order (in taker asset baseUnits) that you wish to fill.
     * @param   takerAddress         The user Ethereum address who would like to fill this order.
     *                               Must be available via the supplied Provider provided at instantiation.
     * @param   orderTransactionOpts Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async fillOrderNoThrowAsync(
        signedOrder: SignedOrder,
        takerAssetFillAmount: BigNumber,
        takerAddress: string,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        assert.isValidBaseUnitAmount('takerAssetFillAmount', takerAssetFillAmount);
        assert.isETHAddressHex('takerAddress', takerAddress);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);

        const data = this._getAbiEncodedTransactionData(
            'fillOrderNoThrow',
            signedOrder,
            takerAssetFillAmount,
            signedOrder.signature,
        );
        const txHash = await this._handleFillsAsync(data, takerAddress, [signedOrder], orderTransactionOpts);
        return txHash;
    }

    /**
     * Attempts to fill a specific amount of an order. If the entire amount specified cannot be filled,
     * the fill order is abandoned.
     * @param   signedOrder          An object that conforms to the SignedOrder interface.
     * @param   takerAssetFillAmount The amount of the order (in taker asset baseUnits) that you wish to fill.
     * @param   takerAddress         The user Ethereum address who would like to fill this order. Must be available via the supplied
     *                               Provider provided at instantiation.
     * @param   orderTransactionOpts Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async fillOrKillOrderAsync(
        signedOrder: SignedOrder,
        takerAssetFillAmount: BigNumber,
        takerAddress: string,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        assert.isValidBaseUnitAmount('takerAssetFillAmount', takerAssetFillAmount);
        assert.isETHAddressHex('takerAddress', takerAddress);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);

        const data = this._getAbiEncodedTransactionData(
            'fillOrKillOrder',
            signedOrder,
            takerAssetFillAmount,
            signedOrder.signature,
        );
        const txHash = await this._handleFillsAsync(data, takerAddress, [signedOrder], orderTransactionOpts);
        return txHash;
    }

    /**
     * Batch version of fillOrderAsync. Executes multiple fills atomically in a single transaction.
     * Under-the-hood, this method uses the `feeRecipientAddress`s of the orders to looks up the coordinator server endpoints
     * registered in the coordinator registry contract. It requests a signature from each coordinator server before
     * submitting the orders and signatures as a 0x transaction to the coordinator extension contract, which validates the
     * signatures and then fills the order through the Exchange contract.
     * If any `feeRecipientAddress` in the batch is not registered to a coordinator server, the whole batch fails.
     * @param   signedOrders          An array of signed orders to fill.
     * @param   takerAssetFillAmounts The amounts of the orders (in taker asset baseUnits) that you wish to fill.
     * @param   takerAddress          The user Ethereum address who would like to fill these orders. Must be available via the supplied
     *                                Provider provided at instantiation.
     * @param   orderTransactionOpts  Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async batchFillOrdersAsync(
        signedOrders: SignedOrder[],
        takerAssetFillAmounts: BigNumber[],
        takerAddress: string,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        for (const takerAssetFillAmount of takerAssetFillAmounts) {
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
        }
        assert.isETHAddressHex('takerAddress', takerAddress);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);

        const signatures = signedOrders.map(o => o.signature);
        const data = this._getAbiEncodedTransactionData('batchFillOrders', signedOrders, takerAssetFillAmounts, signatures);
        const txHash = await this._handleFillsAsync(data, takerAddress, signedOrders, orderTransactionOpts);
        return txHash;
    }

    /**
     * No throw version of batchFillOrdersAsync
     * @param   signedOrders          An array of signed orders to fill.
     * @param   takerAssetFillAmounts The amounts of the orders (in taker asset baseUnits) that you wish to fill.
     * @param   takerAddress          The user Ethereum address who would like to fill these orders. Must be available via the supplied
     *                                Provider provided at instantiation.
     * @param   orderTransactionOpts  Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async batchFillOrdersNoThrowAsync(
        signedOrders: SignedOrder[],
        takerAssetFillAmounts: BigNumber[],
        takerAddress: string,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        for (const takerAssetFillAmount of takerAssetFillAmounts) {
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
        }
        assert.isETHAddressHex('takerAddress', takerAddress);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);

        const signatures = signedOrders.map(o => o.signature);
        const data = this._getAbiEncodedTransactionData(
            'batchFillOrdersNoThrow',
            signedOrders,
            takerAssetFillAmounts,
            signatures,
        );
        const txHash = await this._handleFillsAsync(data, takerAddress, signedOrders, orderTransactionOpts);
        return txHash;
    }

    /**
     * Batch version of fillOrKillOrderAsync. Executes multiple fills atomically in a single transaction.
     * @param   signedOrders          An array of signed orders to fill.
     * @param   takerAssetFillAmounts The amounts of the orders (in taker asset baseUnits) that you wish to fill.
     * @param   takerAddress          The user Ethereum address who would like to fill these orders. Must be available via the supplied
     *                                Provider provided at instantiation.
     * @param   orderTransactionOpts  Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async batchFillOrKillOrdersAsync(
        signedOrders: SignedOrder[],
        takerAssetFillAmounts: BigNumber[],
        takerAddress: string,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        for (const takerAssetFillAmount of takerAssetFillAmounts) {
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
        }
        assert.isETHAddressHex('takerAddress', takerAddress);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);

        const signatures = signedOrders.map(o => o.signature);
        const data = this._getAbiEncodedTransactionData(
            'batchFillOrKillOrders',
            signedOrders,
            takerAssetFillAmounts,
            signatures,
        );
        const txHash = await this._handleFillsAsync(data, takerAddress, signedOrders, orderTransactionOpts);
        return txHash;
    }

    /**
     * Synchronously executes multiple calls to fillOrder until total amount of makerAsset is bought by taker.
     * Under-the-hood, this method uses the `feeRecipientAddress`s of the orders to looks up the coordinator server endpoints
     * registered in the coordinator registry contract. It requests a signature from each coordinator server before
     * submitting the orders and signatures as a 0x transaction to the coordinator extension contract, which validates the
     * signatures and then fills the order through the Exchange contract.
     * If any `feeRecipientAddress` in the batch is not registered to a coordinator server, the whole batch fails.
     * @param   signedOrders         An array of signed orders to fill.
     * @param   makerAssetFillAmount Maker asset fill amount.
     * @param   takerAddress         The user Ethereum address who would like to fill these orders. Must be available via the supplied
     *                               Provider provided at instantiation.
     * @param   orderTransactionOpts Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async marketBuyOrdersAsync(
        signedOrders: SignedOrder[],
        makerAssetFillAmount: BigNumber,
        takerAddress: string,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
        assert.isETHAddressHex('takerAddress', takerAddress);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);

        const signatures = signedOrders.map(o => o.signature);
        const data = this._getAbiEncodedTransactionData('marketBuyOrders', signedOrders, makerAssetFillAmount, signatures);
        const txHash = await this._handleFillsAsync(data, takerAddress, signedOrders, orderTransactionOpts);
        return txHash;
    }

    /**
     * Synchronously executes multiple calls to fillOrder until total amount of makerAsset is bought by taker.
     * Under-the-hood, this method uses the `feeRecipientAddress`s of the orders to looks up the coordinator server endpoints
     * registered in the coordinator registry contract. It requests a signature from each coordinator server before
     * submitting the orders and signatures as a 0x transaction to the coordinator extension contract, which validates the
     * signatures and then fills the order through the Exchange contract.
     * If any `feeRecipientAddress` in the batch is not registered to a coordinator server, the whole batch fails.
     * @param   signedOrders         An array of signed orders to fill.
     * @param   takerAssetFillAmount Taker asset fill amount.
     * @param   takerAddress         The user Ethereum address who would like to fill these orders. Must be available via the supplied
     *                               Provider provided at instantiation.
     * @param   orderTransactionOpts Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async marketSellOrdersAsync(
        signedOrders: SignedOrder[],
        takerAssetFillAmount: BigNumber,
        takerAddress: string,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
        assert.isETHAddressHex('takerAddress', takerAddress);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);

        const signatures = signedOrders.map(o => o.signature);
        const data = this._getAbiEncodedTransactionData('marketSellOrders', signedOrders, takerAssetFillAmount, signatures);
        const txHash = await this._handleFillsAsync(data, takerAddress, signedOrders, orderTransactionOpts);
        return txHash;
    }

    /**
     * No throw version of marketBuyOrdersAsync
     * @param   signedOrders         An array of signed orders to fill.
     * @param   makerAssetFillAmount Maker asset fill amount.
     * @param   takerAddress         The user Ethereum address who would like to fill these orders. Must be available via the supplied
     *                               Provider provided at instantiation.
     * @param   orderTransactionOpts Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async marketBuyOrdersNoThrowAsync(
        signedOrders: SignedOrder[],
        makerAssetFillAmount: BigNumber,
        takerAddress: string,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        assert.isBigNumber('makerAssetFillAmount', makerAssetFillAmount);
        assert.isETHAddressHex('takerAddress', takerAddress);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);

        const signatures = signedOrders.map(o => o.signature);
        const data = this._getAbiEncodedTransactionData(
            'marketBuyOrdersNoThrow',
            signedOrders,
            makerAssetFillAmount,
            signatures,
        );
        const txHash = await this._handleFillsAsync(data, takerAddress, signedOrders, orderTransactionOpts);
        return txHash;
    }

    /**
     * No throw version of marketSellOrdersAsync
     * @param   signedOrders         An array of signed orders to fill.
     * @param   takerAssetFillAmount Taker asset fill amount.
     * @param   takerAddress         The user Ethereum address who would like to fill these orders. Must be available via the supplied
     *                               Provider provided at instantiation.
     * @param   orderTransactionOpts Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async marketSellOrdersNoThrowAsync(
        signedOrders: SignedOrder[],
        takerAssetFillAmount: BigNumber,
        takerAddress: string,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount);
        assert.isETHAddressHex('takerAddress', takerAddress);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);

        const signatures = signedOrders.map(o => o.signature);
        const data = this._getAbiEncodedTransactionData(
            'marketSellOrdersNoThrow',
            signedOrders,
            takerAssetFillAmount,
            signatures,
        );
        const txHash = await this._handleFillsAsync(data, takerAddress, signedOrders, orderTransactionOpts);
        return txHash;
    }

    /**
     * Soft cancel a given order.
     * Soft cancels are recorded only on coordinator operator servers and do not involve an Ethereum transaction.
     * See [soft cancels](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/coordinator-specification.md#soft-cancels).
     * @param   order           An object that conforms to the Order or SignedOrder interface. The order you would like to cancel.
     * @return  CoordinatorServerCancellationResponse. See [Cancellation Response](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/coordinator-specification.md#response).
     */
    public async softCancelOrderAsync(order: Order | SignedOrder): Promise<CoordinatorServerCancellationResponse> {
        assert.doesConformToSchema('order', order, schemas.orderSchema);
        assert.isETHAddressHex('feeRecipientAddress', order.feeRecipientAddress);
        assert.isSenderAddressAsync('makerAddress', order.makerAddress, this._web3Wrapper);

        const data = this._getAbiEncodedTransactionData('cancelOrder', order);
        const transaction = await this._generateSignedZeroExTransactionAsync(data, order.makerAddress);
        const endpoint = await this._getServerEndpointOrThrowAsync(order.feeRecipientAddress);

        const response = await this._executeServerRequestAsync(transaction, order.makerAddress, endpoint);
        if (response.isError) {
            const approvedOrders = new Array();
            const cancellations = new Array();
            const errors = [
                {
                    ...response,
                    orders: [order],
                },
            ];
            throw new CoordinatorServerError(
                CoordinatorServerErrorMsg.CancellationFailed,
                approvedOrders,
                cancellations,
                errors,
            );
        } else {
            return response.body as CoordinatorServerCancellationResponse;
        }
    }

    /**
     * Batch version of softCancelOrderAsync. Requests multiple soft cancels
     * @param   orders                An array of orders to cancel.
     * @return  CoordinatorServerCancellationResponse. See [Cancellation Response](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/coordinator-specification.md#response).
     */
    public async batchSoftCancelOrdersAsync(orders: SignedOrder[]): Promise<CoordinatorServerCancellationResponse[]> {
        assert.doesConformToSchema('orders', orders, schemas.ordersSchema);
        const makerAddress = getMakerAddressOrThrow(orders);
        assert.isSenderAddressAsync('makerAddress', makerAddress, this._web3Wrapper);
        const data = this._getAbiEncodedTransactionData('batchCancelOrders', orders);

        const serverEndpointsToOrders = await this._mapServerEndpointsToOrdersAsync(orders);

        // make server requests
        const errorResponses: CoordinatorServerResponse[] = [];
        const successResponses: CoordinatorServerCancellationResponse[] = [];
        const transaction = await this._generateSignedZeroExTransactionAsync(data, makerAddress);
        for (const endpoint of Object.keys(serverEndpointsToOrders)) {
            const response = await this._executeServerRequestAsync(transaction, makerAddress, endpoint);
            if (response.isError) {
                errorResponses.push(response);
            } else {
                successResponses.push(response.body as CoordinatorServerCancellationResponse);
            }
        }

        // if no errors
        if (errorResponses.length === 0) {
            return successResponses;
        } else {
            // lookup orders with errors
            const errorsWithOrders = errorResponses.map(resp => {
                const endpoint = resp.coordinatorOperator;
                const _orders = serverEndpointsToOrders[endpoint];
                return {
                    ...resp,
                    orders: _orders,
                };
            });

            const approvedOrders = new Array();
            const cancellations = successResponses;
            // return errors and approvals
            throw new CoordinatorServerError(
                CoordinatorServerErrorMsg.CancellationFailed,
                approvedOrders,
                cancellations,
                errorsWithOrders,
            );
        }
    }

    /**
     * Cancels an order on-chain by submitting an Ethereum transaction.
     * @param   order           An object that conforms to the Order or SignedOrder interface. The order you would like to cancel.
     * @param   orderTransactionOpts Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async hardCancelOrderAsync(
        order: Order | SignedOrder,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('order', order, schemas.orderSchema);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        await assert.isSenderAddressAsync('makerAddress', order.makerAddress, this._web3Wrapper);

        const data = this._getAbiEncodedTransactionData('cancelOrder', order);
        const transaction = await this._generateSignedZeroExTransactionAsync(data, order.makerAddress);

        const approvalSignatures = new Array();
        const approvalExpirationTimeSeconds = new Array();
        const txHash = await this._submitCoordinatorTransactionAsync(
            transaction,
            order.makerAddress,
            transaction.signature,
            approvalExpirationTimeSeconds,
            approvalSignatures,
            orderTransactionOpts,
        );
        return txHash;
    }

    /**
     * Batch version of hardCancelOrderAsync. Cancels orders on-chain by submitting an Ethereum transaction.
     * Executes multiple cancels atomically in a single transaction.
     * @param   orders                An array of orders to cancel.
     * @param   orderTransactionOpts  Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async batchHardCancelOrdersAsync(
        orders: SignedOrder[],
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('orders', orders, schemas.ordersSchema);
        const makerAddress = getMakerAddressOrThrow(orders);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        await assert.isSenderAddressAsync('makerAddress', makerAddress, this._web3Wrapper);

        const data = this._getAbiEncodedTransactionData('batchCancelOrders', orders);
        const transaction = await this._generateSignedZeroExTransactionAsync(data, makerAddress);

        const approvalSignatures = new Array();
        const approvalExpirationTimeSeconds = new Array();
        const txHash = await this._submitCoordinatorTransactionAsync(
            transaction,
            makerAddress,
            transaction.signature,
            approvalExpirationTimeSeconds,
            approvalSignatures,
            orderTransactionOpts,
        );
        return txHash;
    }

    /**
     * Cancels orders on-chain by submitting an Ethereum transaction.
     * Cancels all orders created by makerAddress with a salt less than or equal to the targetOrderEpoch
     * and senderAddress equal to coordinator extension contract address.
     * @param   targetOrderEpoch             Target order epoch.
     * @param   senderAddress                Address that should send the transaction.
     * @param   orderTransactionOpts         Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async hardCancelOrdersUpToAsync(
        targetOrderEpoch: BigNumber,
        senderAddress: string,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.isBigNumber('targetOrderEpoch', targetOrderEpoch);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        await assert.isSenderAddressAsync('senderAddress', senderAddress, this._web3Wrapper);

        const data = this._getAbiEncodedTransactionData('cancelOrdersUpTo', targetOrderEpoch);
        const transaction = await this._generateSignedZeroExTransactionAsync(data, senderAddress);

        const approvalSignatures = new Array();
        const approvalExpirationTimeSeconds = new Array();
        const txHash = await this._submitCoordinatorTransactionAsync(
            transaction,
            senderAddress,
            transaction.signature,
            approvalExpirationTimeSeconds,
            approvalSignatures,
            orderTransactionOpts,
        );
        return txHash;
    }

    /**
     * Validates that the 0x transaction has been approved by all of the feeRecipients that correspond to each order in the transaction's Exchange calldata.
     * Throws an error if the transaction approvals are not valid. Will not detect failures that would occur when the transaction is executed on the Exchange contract.
     * @param transaction 0x transaction containing salt, signerAddress, and data.
     * @param txOrigin Required signer of Ethereum transaction calling this function.
     * @param transactionSignature Proof that the transaction has been signed by the signer.
     * @param approvalExpirationTimeSeconds Array of expiration times in seconds for which each corresponding approval signature expires.
     * @param approvalSignatures Array of signatures that correspond to the feeRecipients of each order in the transaction's Exchange calldata.
     */
    public async assertValidCoordinatorApprovalsOrThrowAsync(
        transaction: ZeroExTransaction,
        txOrigin: string,
        transactionSignature: string,
        approvalExpirationTimeSeconds: BigNumber[],
        approvalSignatures: string[],
    ): Promise<void> {
        assert.doesConformToSchema('transaction', transaction, schemas.zeroExTransactionSchema);
        assert.isETHAddressHex('txOrigin', txOrigin);
        assert.isHexString('transactionSignature', transactionSignature);
        for (const expirationTime of approvalExpirationTimeSeconds) {
            assert.isBigNumber('expirationTime', expirationTime);
        }
        for (const approvalSignature of approvalSignatures) {
            assert.isHexString('approvalSignature', approvalSignature);
        }

        await this._contractInstance.assertValidCoordinatorApprovals.callAsync(
            transaction,
            txOrigin,
            transactionSignature,
            approvalExpirationTimeSeconds,
            approvalSignatures,
        );
    }

    /**
     * Recovers the address of a signer given a hash and signature.
     * @param hash Any 32 byte hash.
     * @param signature Proof that the hash has been signed by signer.
     * @returns Signer address.
     */
    public async getSignerAddressAsync(hash: string, signature: string): Promise<string> {
        assert.isHexString('hash', hash);
        assert.isHexString('signature', signature);
        const signerAddress = await this._contractInstance.getSignerAddress.callAsync(hash, signature);
        return signerAddress;
    }

    private _getAbiEncodedTransactionData<K extends keyof ExchangeContract>(methodName: K, ...args: any): string {
        return getAbiEncodedTransactionData(this._exchangeInstance, methodName, ...args);
    }

    private async _handleFillsAsync(
        data: string,
        takerAddress: string,
        signedOrders: SignedOrder[],
        orderTransactionOpts: OrderTransactionOpts,
    ): Promise<string> {
        const coordinatorOrders = signedOrders.filter(o => o.senderAddress === this.address);
        const serverEndpointsToOrders = await this._mapServerEndpointsToOrdersAsync(coordinatorOrders);

        // make server requests
        const errorResponses: CoordinatorServerResponse[] = [];
        const approvalResponses: CoordinatorServerResponse[] = [];
        const transaction = await this._generateSignedZeroExTransactionAsync(data, takerAddress);
        for (const endpoint of Object.keys(serverEndpointsToOrders)) {
            const response = await this._executeServerRequestAsync(transaction, takerAddress, endpoint);
            if (response.isError) {
                errorResponses.push(response);
            } else {
                approvalResponses.push(response);
            }
        }

        // if no errors
        if (errorResponses.length === 0) {
            // concatenate all approval responses
            const allApprovals = approvalResponses.map(resp =>
                formatRawResponse(resp.body as CoordinatorServerApprovalRawResponse),
            );

            const allSignatures = flatten(allApprovals.map(a => a.signatures));
            const allExpirationTimes = flatten(allApprovals.map(a => a.expirationTimeSeconds));

            // submit transaction with approvals
            const txHash = await this._submitCoordinatorTransactionAsync(
                transaction,
                takerAddress,
                transaction.signature,
                allExpirationTimes,
                allSignatures,
                orderTransactionOpts,
            );
            return txHash;
        } else {
            // format errors and approvals
            // concatenate approvals
            const notCoordinatorOrders = signedOrders.filter(o => o.senderAddress !== this.address);
            const approvedOrdersNested = approvalResponses.map(resp => {
                const endpoint = resp.coordinatorOperator;
                const orders = serverEndpointsToOrders[endpoint];
                return orders;
            });
            const approvedOrders = flatten(approvedOrdersNested.concat(notCoordinatorOrders));

            // lookup orders with errors
            const errorsWithOrders = errorResponses.map(resp => {
                const endpoint = resp.coordinatorOperator;
                const orders = serverEndpointsToOrders[endpoint];
                return {
                    ...resp,
                    orders,
                };
            });

            // throw informative error
            const cancellations = new Array();
            throw new CoordinatorServerError(
                CoordinatorServerErrorMsg.FillFailed,
                approvedOrders,
                cancellations,
                errorsWithOrders,
            );
        }
        function formatRawResponse(
            rawResponse: CoordinatorServerApprovalRawResponse,
        ): CoordinatorServerApprovalResponse {
            return {
                signatures: ([] as string[]).concat(rawResponse.signatures),
                expirationTimeSeconds: ([] as BigNumber[]).concat(
                    Array(rawResponse.signatures.length).fill(rawResponse.expirationTimeSeconds),
                ),
            };
        }
    }

    private async _getServerEndpointOrThrowAsync(feeRecipientAddress: string): Promise<string> {
        const cached = this._feeRecipientToEndpoint[feeRecipientAddress];
        const endpoint =
            cached !== undefined
                ? cached
                : await _fetchServerEndpointOrThrowAsync(feeRecipientAddress, this._registryInstance);
        return endpoint;

        async function _fetchServerEndpointOrThrowAsync(
            feeRecipient: string,
            registryInstance: CoordinatorRegistryContract,
        ): Promise<string> {
            const coordinatorOperatorEndpoint = await registryInstance.getCoordinatorEndpoint.callAsync(feeRecipient);
            if (coordinatorOperatorEndpoint === '' || coordinatorOperatorEndpoint === undefined) {
                throw new Error(
                    `No Coordinator server endpoint found in Coordinator Registry for feeRecipientAddress: ${feeRecipient}. Registry contract address: ${
                        registryInstance.address
                    }`,
                );
            }
            return coordinatorOperatorEndpoint;
        }
    }

    private async _generateSignedZeroExTransactionAsync(
        data: string,
        signerAddress: string,
    ): Promise<SignedZeroExTransaction> {
        const transaction: ZeroExTransaction = {
            salt: generatePseudoRandomSalt(),
            signerAddress,
            data,
            verifyingContractAddress: this.exchangeAddress,
        };
        const signedTransaction = await signatureUtils.ecSignTransactionAsync(
            this._web3Wrapper.getProvider(),
            transaction,
            transaction.signerAddress,
        );

        return signedTransaction;
    }

    private async _executeServerRequestAsync(
        signedTransaction: SignedZeroExTransaction,
        txOrigin: string,
        endpoint: string,
    ): Promise<CoordinatorServerResponse> {
        const requestPayload = {
            signedTransaction,
            txOrigin,
        };
        const response = await fetchAsync(`${endpoint}/v1/request_transaction?networkId=${this.networkId}`, {
            body: JSON.stringify(requestPayload),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
        });

        const isError = response.status !== HttpStatus.OK;
        const isValidationError = response.status === HttpStatus.BAD_REQUEST;
        const json = isError && !isValidationError ? undefined : await response.json();

        const result = {
            isError,
            status: response.status,
            body: isError ? undefined : json,
            error: isError ? json : undefined,
            request: requestPayload,
            coordinatorOperator: endpoint,
        };

        return result;
    }

    private async _submitCoordinatorTransactionAsync(
        transaction: CoordinatorTransaction,
        txOrigin: string,
        transactionSignature: string,
        approvalExpirationTimeSeconds: BigNumber[],
        approvalSignatures: string[],
        orderTransactionOpts: OrderTransactionOpts,
    ): Promise<string> {
        if (orderTransactionOpts.shouldValidate) {
            await this._contractInstance.executeTransaction.callAsync(
                transaction,
                txOrigin,
                transactionSignature,
                approvalExpirationTimeSeconds,
                approvalSignatures,
                {
                    from: txOrigin,
                    gas: orderTransactionOpts.gasLimit,
                    gasPrice: orderTransactionOpts.gasPrice,
                    nonce: orderTransactionOpts.nonce,
                },
            );
        }
        const txHash = await this._contractInstance.executeTransaction.sendTransactionAsync(
            transaction,
            txOrigin,
            transactionSignature,
            approvalExpirationTimeSeconds,
            approvalSignatures,
            {
                from: txOrigin,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            },
        );
        return txHash;
    }

    private async _mapServerEndpointsToOrdersAsync(
        coordinatorOrders: SignedOrder[],
    ): Promise<{ [endpoint: string]: SignedOrder[] }> {
        const feeRecipientsToOrders: { [feeRecipient: string]: SignedOrder[] } = {};
        for (const order of coordinatorOrders) {
            const feeRecipient = order.feeRecipientAddress;
            if (feeRecipientsToOrders[feeRecipient] === undefined) {
                feeRecipientsToOrders[feeRecipient] = [] as SignedOrder[];
            }
            feeRecipientsToOrders[feeRecipient].push(order);
        }
        const serverEndpointsToOrders: { [endpoint: string]: SignedOrder[] } = {};
        for (const feeRecipient of Object.keys(feeRecipientsToOrders)) {
            const endpoint = await this._getServerEndpointOrThrowAsync(feeRecipient);
            const orders = feeRecipientsToOrders[feeRecipient];
            if (serverEndpointsToOrders[endpoint] === undefined) {
                serverEndpointsToOrders[endpoint] = [];
            }
            serverEndpointsToOrders[endpoint] = serverEndpointsToOrders[endpoint].concat(orders);
        }
        return serverEndpointsToOrders;
    }
}

function getMakerAddressOrThrow(orders: Array<Order | SignedOrder>): string {
    const uniqueMakerAddresses = new Set(orders.map(o => o.makerAddress));
    if (uniqueMakerAddresses.size > 1) {
        throw new Error(`All orders in a batch must have the same makerAddress`);
    }
    return orders[0].makerAddress;
}

// tslint:disable:max-file-line-count
