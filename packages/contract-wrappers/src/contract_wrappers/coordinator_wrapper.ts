import { CoordinatorContract, CoordinatorRegistryContract, ExchangeContract } from '@0x/abi-gen-wrappers';
import { Coordinator, CoordinatorRegistry, Exchange } from '@0x/contract-artifacts';
import { schemas } from '@0x/json-schemas';
import { generatePseudoRandomSalt, signatureUtils, transactionHashUtils } from '@0x/order-utils';
import { Order, SignedOrder, SignedZeroExTransaction, ZeroExTransaction } from '@0x/types';
import { BigNumber, fetchAsync } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { ContractAbi } from 'ethereum-types';

import { orderTxOptsSchema } from '../schemas/order_tx_opts_schema';
import { txOptsSchema } from '../schemas/tx_opts_schema';
import {
    CoordinatorServerApprovalResponse,
    CoordinatorServerCancellationResponse,
    OrderTransactionOpts,
} from '../types';
import { assert } from '../utils/assert';
import { _getDefaultContractAddresses } from '../utils/contract_addresses';
import { decorators } from '../utils/decorators';
import { TransactionEncoder } from '../utils/transaction_encoder';

import { ContractWrapper } from './contract_wrapper';

const HTTP_OK = 200;

/**
 * This class includes all the functionality related to filling or cancelling orders through
 * the 0x V2 Coordinator smart contract.
 */
export class CoordinatorWrapper extends ContractWrapper {
    public abi: ContractAbi = Coordinator.compilerOutput.abi;
    public networkId: number;
    public address: string;
    public exchangeAddress: string;
    public registryAddress: string;
    private readonly _contractInstance: CoordinatorContract;
    private readonly _registryInstance: CoordinatorRegistryContract;
    private readonly _exchangeInstance: ExchangeContract;
    private readonly _transactionEncoder: TransactionEncoder;

    /**
     * Instantiate CoordinatorWrapper
     * @param web3Wrapper Web3Wrapper instance to use.
     * @param networkId Desired networkId.
     * @param address The address of the Coordinator contract. If undefined, will
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
        super(web3Wrapper, networkId);
        this.networkId = networkId;
        this.address = address === undefined ? _getDefaultContractAddresses(networkId).coordinator : address;
        this.exchangeAddress =
            exchangeAddress === undefined ? _getDefaultContractAddresses(networkId).coordinator : exchangeAddress;
        this.registryAddress =
            registryAddress === undefined
                ? _getDefaultContractAddresses(networkId).coordinatorRegistry
                : registryAddress;

        this._contractInstance = new CoordinatorContract(
            this.abi,
            this.address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        this._registryInstance = new CoordinatorRegistryContract(
            CoordinatorRegistry.compilerOutput.abi,
            this.registryAddress,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        this._exchangeInstance = new ExchangeContract(
            Exchange.compilerOutput.abi,
            this.exchangeAddress,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );

        this._transactionEncoder = new TransactionEncoder(this._exchangeInstance);
    }

    /**
     * Fills a signed order with an amount denominated in baseUnits of the taker asset.
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
        const data = this._transactionEncoder.fillOrderTx(signedOrder, takerAssetFillAmount);
        return this._handleFillAsync(data, takerAddress, signedOrder.feeRecipientAddress, orderTransactionOpts);
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
        const data = this._transactionEncoder.fillOrderNoThrowTx(signedOrder, takerAssetFillAmount);
        return this._handleFillAsync(data, takerAddress, signedOrder.feeRecipientAddress, orderTransactionOpts);
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
        const data = this._transactionEncoder.fillOrKillOrderTx(signedOrder, takerAssetFillAmount);
        return this._handleFillAsync(data, takerAddress, signedOrder.feeRecipientAddress, orderTransactionOpts);
    }

    /**
     * Batch version of fillOrderAsync. Executes multiple fills atomically in a single transaction.
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
        const feeRecipientAddress = getFeeRecipientOrThrow(signedOrders);
        const data = this._transactionEncoder.batchFillOrdersTx(signedOrders, takerAssetFillAmounts);
        return this._handleFillAsync(data, takerAddress, feeRecipientAddress, orderTransactionOpts);
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
        const feeRecipientAddress = getFeeRecipientOrThrow(signedOrders);
        const data = this._transactionEncoder.batchFillOrdersNoThrowTx(signedOrders, takerAssetFillAmounts);
        return this._handleFillAsync(data, takerAddress, feeRecipientAddress, orderTransactionOpts);
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
        const feeRecipientAddress = getFeeRecipientOrThrow(signedOrders);
        const data = this._transactionEncoder.batchFillOrKillOrdersTx(signedOrders, takerAssetFillAmounts);
        return this._handleFillAsync(data, takerAddress, feeRecipientAddress, orderTransactionOpts);
    }

    /**
     * Synchronously executes multiple calls to fillOrder until total amount of makerAsset is bought by taker.
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
        const feeRecipientAddress = getFeeRecipientOrThrow(signedOrders);
        const data = this._transactionEncoder.marketBuyOrdersTx(signedOrders, makerAssetFillAmount);
        return this._handleFillAsync(data, takerAddress, feeRecipientAddress, orderTransactionOpts);
    }

    /**
     * Synchronously executes multiple calls to fillOrder until total amount of makerAsset is bought by taker.
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
        const feeRecipientAddress = getFeeRecipientOrThrow(signedOrders);
        const data = this._transactionEncoder.marketSellOrdersTx(signedOrders, takerAssetFillAmount);
        return this._handleFillAsync(data, takerAddress, feeRecipientAddress, orderTransactionOpts);
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
        const feeRecipientAddress = getFeeRecipientOrThrow(signedOrders);
        const data = this._transactionEncoder.marketBuyOrdersNoThrowTx(signedOrders, makerAssetFillAmount);
        return this._handleFillAsync(data, takerAddress, feeRecipientAddress, orderTransactionOpts);
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
        const feeRecipientAddress = getFeeRecipientOrThrow(signedOrders);
        const data = this._transactionEncoder.marketSellOrdersNoThrowTx(signedOrders, takerAssetFillAmount);
        return this._handleFillAsync(data, takerAddress, feeRecipientAddress, orderTransactionOpts);
    }

    /**
     * Match two complementary orders that have a profitable spread.
     * Each order is filled at their respective price point. However, the calculations are carried out as though
     * the orders are both being filled at the right order's price point.
     * The profit made by the left order goes to the taker (whoever matched the two orders).
     * @param leftSignedOrder  First order to match.
     * @param rightSignedOrder Second order to match.
     * @param takerAddress     The address that sends the transaction and gets the spread.
     * @param orderTransactionOpts Optional arguments this method accepts.
     * @return Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async matchOrdersAsync(
        leftSignedOrder: SignedOrder,
        rightSignedOrder: SignedOrder,
        takerAddress: string,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('leftSignedOrder', leftSignedOrder, schemas.signedOrderSchema);
        assert.doesConformToSchema('rightSignedOrder', rightSignedOrder, schemas.signedOrderSchema);

        const data = this._transactionEncoder.matchOrdersTx(leftSignedOrder, rightSignedOrder);
        const transaction = await this._toSignedZeroExTransactionAsync(data, takerAddress);
        return this._sendTransactionAsync(
            transaction,
            takerAddress,
            transaction.signature,
            [],
            [],
            orderTransactionOpts,
        );
    }

    /**
     * Soft cancel a given order. See [soft cancels](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/coordinator-specification.md#soft-cancels).
     * @param   order           An object that conforms to the Order or SignedOrder interface. The order you would like to cancel.
     * @return  CoordinatorServerCancellationResponse. See [Cancellation Response](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/coordinator-specification.md#response).
     */
    @decorators.asyncZeroExErrorHandler
    public async softCancelOrderAsync(order: Order | SignedOrder): Promise<CoordinatorServerCancellationResponse> {
        assert.doesConformToSchema('order', order, schemas.orderSchema);
        assert.isETHAddressHex('feeRecipientAddress', order.feeRecipientAddress);
        assert.isSenderAddressAsync('makerAddress', order.makerAddress, this._web3Wrapper);
        const data = this._transactionEncoder.cancelOrderTx(order);

        const transaction = await this._toSignedZeroExTransactionAsync(data, order.makerAddress);
        return (await this._requestServerResponseAsync(
            transaction,
            order.makerAddress,
            order.feeRecipientAddress,
        )) as CoordinatorServerCancellationResponse;
    }

    /**
     * Batch version of softCancelOrderAsync. Requests multiple soft cancels
     * @param   orders                An array of orders to cancel.
     * @return  CoordinatorServerCancellationResponse. See [Cancellation Response](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/coordinator-specification.md#response).
     */
    @decorators.asyncZeroExErrorHandler
    public async batchSoftCancelOrdersAsync(orders: SignedOrder[]): Promise<CoordinatorServerCancellationResponse> {
        assert.doesConformToSchema('orders', orders, schemas.ordersSchema);
        const feeRecipientAddress = getFeeRecipientOrThrow(orders);
        const makerAddress = getMakerAddressOrThrow(orders);
        assert.isETHAddressHex('feeRecipientAddress', feeRecipientAddress);
        assert.isSenderAddressAsync('makerAddress', makerAddress, this._web3Wrapper);

        const data = this._transactionEncoder.batchCancelOrdersTx(orders);
        const transaction = await this._toSignedZeroExTransactionAsync(data, makerAddress);
        return (await this._requestServerResponseAsync(
            transaction,
            makerAddress,
            feeRecipientAddress,
        )) as CoordinatorServerCancellationResponse;
    }

    /**
     * Hard cancellation on Exchange contract. Cancels a single order.
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

        const data = this._transactionEncoder.cancelOrderTx(order);
        const transaction = await this._toSignedZeroExTransactionAsync(data, order.makerAddress);
        return this._sendTransactionAsync(
            transaction,
            order.makerAddress,
            transaction.signature,
            [],
            [],
            orderTransactionOpts,
        );
    }

    /**
     * Hard cancellation on Exchange contract.
     * Batch version of cancelOrderAsync. Executes multiple cancels atomically in a single transaction.
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

        const data = this._transactionEncoder.batchCancelOrdersTx(orders);
        const transaction = await this._toSignedZeroExTransactionAsync(data, makerAddress);
        return this._sendTransactionAsync(
            transaction,
            makerAddress,
            transaction.signature,
            [],
            [],
            orderTransactionOpts,
        );
    }

    /**
     * Hard cancellation on Exchange contract.
     * Cancels all orders created by makerAddress with a salt less than or equal to the targetOrderEpoch
     * and senderAddress equal to msg.sender (or null address if msg.sender == makerAddress).
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
        return this._exchangeInstance.cancelOrdersUpTo.sendTransactionAsync(targetOrderEpoch, {
            from: senderAddress,
            gas: orderTransactionOpts.gasLimit,
            gasPrice: orderTransactionOpts.gasPrice,
            nonce: orderTransactionOpts.nonce,
        });
        // // todo: find out why this doesn't work (xianny)
        // const data = this._transactionEncoder.cancelOrdersUpToTx(targetOrderEpoch);
        // const transaction = await this._toSignedZeroExTransactionAsync(data, senderAddress);
        // return this._sendTransactionAsync(
        //     transaction,
        //     senderAddress,
        //     transaction.signature,
        //     [],
        //     [],
        //     orderTransactionOpts,
        // );
    }

    public async assertValidCoordinatorApprovalsAsync(
        transaction: ZeroExTransaction,
        txOrigin: string,
        signature: string,
        approvalExpirationTimeSeconds: BigNumber[],
        approvalSignatures: string[],
    ): Promise<void> {
        assert.doesConformToSchema('transaction', transaction, schemas.zeroExTransactionSchema);
        assert.isETHAddressHex('txOrigin', txOrigin);
        assert.isHexString('signature', signature);
        for (const expirationTime of approvalExpirationTimeSeconds) {
            assert.isBigNumber('expirationTime', expirationTime);
        }
        for (const approvalSignature of approvalSignatures) {
            assert.isHexString('approvalSignature', approvalSignature);
        }

        return this._contractInstance.assertValidCoordinatorApprovals.callAsync(
            transaction,
            txOrigin,
            signature,
            approvalExpirationTimeSeconds,
            approvalSignatures,
        );
    }

    public async getSignerAddressAsync(hash: string, signature: string): Promise<string> {
        assert.isHexString('hash', hash);
        assert.isHexString('signature', signature);
        return this._contractInstance.getSignerAddress.callAsync(hash, signature);
    }

    private async _sendTransactionAsync(
        transaction: { salt: BigNumber; signerAddress: string; data: string },
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

    private async _toSignedZeroExTransactionAsync(
        data: string,
        senderAddress: string,
    ): Promise<SignedZeroExTransaction> {
        await assert.isSenderAddressAsync('senderAddress', senderAddress, this._web3Wrapper);
        const normalizedSenderAddress = senderAddress.toLowerCase();

        const transaction: ZeroExTransaction = {
            salt: generatePseudoRandomSalt(),
            signerAddress: normalizedSenderAddress,
            data,
            verifyingContractAddress: this.exchangeAddress,
        };
        const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
        const signature = await signatureUtils.ecSignHashAsync(
            this._web3Wrapper.getProvider(),
            transactionHash,
            transaction.signerAddress,
        );
        return {
            ...transaction,
            signature,
        };
    }

    private async _requestServerResponseAsync(
        transaction: SignedZeroExTransaction,
        senderAddress: string,
        feeRecipientAddress: string,
    ): Promise<CoordinatorServerApprovalResponse | CoordinatorServerCancellationResponse> {
        assert.doesConformToSchema('transaction', transaction, schemas.zeroExTransactionSchema);
        assert.isETHAddressHex('feeRecipientAddress', feeRecipientAddress);

        const coordinatorOperatorEndpoint = await this._registryInstance.getCoordinatorEndpoint.callAsync(
            feeRecipientAddress,
        );
        if (coordinatorOperatorEndpoint === undefined) {
            throw new Error(
                `Could not find endpoint for coordinator operator with { coordinatorAddress: ${
                    this.address
                }, registryAddress: ${this.registryAddress}, operatorAddress: ${feeRecipientAddress}}`,
            );
        }

        const requestPayload = {
            signedTransaction: transaction,
            txOrigin: senderAddress,
        };
        const response = await fetchAsync(
            `${coordinatorOperatorEndpoint}/v1/request_transaction?networkId=${this.networkId}`,
            {
                body: JSON.stringify(requestPayload),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
            },
        );

        if (response.status !== HTTP_OK) {
            throw new Error(`${response.status}: ${JSON.stringify(await response.json())}`); // todo
        }

        return (await response.json()) as CoordinatorServerApprovalResponse | CoordinatorServerCancellationResponse;
    }

    private async _handleFillAsync(
        data: string,
        takerAddress: string,
        feeRecipientAddress: string,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);

        const transaction = await this._toSignedZeroExTransactionAsync(data, takerAddress);
        const { signatures, expirationTimeSeconds } = (await this._requestServerResponseAsync(
            transaction,
            takerAddress,
            feeRecipientAddress,
        )) as CoordinatorServerApprovalResponse;

        return this._sendTransactionAsync(
            transaction,
            takerAddress,
            transaction.signature,
            [expirationTimeSeconds],
            signatures,
            orderTransactionOpts,
        );
    }
} // tslint:disable:max-file-line-count

function getFeeRecipientOrThrow(orders: Array<Order | SignedOrder>): string {
    const uniqueFeeRecipients = new Set(orders.map(o => o.feeRecipientAddress));
    if (uniqueFeeRecipients.size > 1) {
        throw new Error(
            `All orders in a batch must have the same feeRecipientAddress (a valid coordinator operator address)`,
        );
    }
    return orders[0].feeRecipientAddress;
}

function getMakerAddressOrThrow(orders: Array<Order | SignedOrder>): string {
    const uniqueMakerAddresses = new Set(orders.map(o => o.makerAddress));
    if (uniqueMakerAddresses.size > 1) {
        throw new Error(`All orders in a batch must have the same makerAddress`);
    }
    return orders[0].makerAddress;
}
