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
     * Fills a signed order with an amount denominated in baseUnits of the taker asset. Under-the-hood, this
     * method uses the `feeRecipientAddress` of the order to looks up the coordinator server endpoint registered in the
     * coordinator registry contract. It requests a signature from that coordinator server before
     * submitting the order and signature as a 0x transaction to the coordinator extension contract, which validates the
     * signatures and then fills the order through the Exchange contract.
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

        const data = this._transactionEncoder.fillOrderTx(signedOrder, takerAssetFillAmount);
        return this._handleFillsAsync(data, takerAddress, [signedOrder.feeRecipientAddress], orderTransactionOpts);
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

        const data = this._transactionEncoder.fillOrderNoThrowTx(signedOrder, takerAssetFillAmount);
        return this._handleFillsAsync(data, takerAddress, [signedOrder.feeRecipientAddress], orderTransactionOpts);
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

        const data = this._transactionEncoder.fillOrKillOrderTx(signedOrder, takerAssetFillAmount);
        return this._handleFillsAsync(data, takerAddress, [signedOrder.feeRecipientAddress], orderTransactionOpts);
    }

    /**
     * Batch version of fillOrderAsync. Executes multiple fills atomically in a single transaction.
     *  Under-the-hood, this
     * method uses the `feeRecipientAddress`s of the orders to looks up the coordinator server endpoints registered in the
     * coordinator registry contract. It requests a signature from each coordinator server before
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

        const feeRecipientAddresses = signedOrders.map(o => o.feeRecipientAddress);
        const data = this._transactionEncoder.batchFillOrdersTx(signedOrders, takerAssetFillAmounts);
        return this._handleFillsAsync(data, takerAddress, feeRecipientAddresses, orderTransactionOpts);
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

        const feeRecipientAddresses = signedOrders.map(o => o.feeRecipientAddress);
        const data = this._transactionEncoder.batchFillOrdersNoThrowTx(signedOrders, takerAssetFillAmounts);
        return this._handleFillsAsync(data, takerAddress, feeRecipientAddresses, orderTransactionOpts);
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

        const feeRecipientAddresses = signedOrders.map(o => o.feeRecipientAddress);
        const data = this._transactionEncoder.batchFillOrKillOrdersTx(signedOrders, takerAssetFillAmounts);
        return this._handleFillsAsync(data, takerAddress, feeRecipientAddresses, orderTransactionOpts);
    }

    /**
     * Synchronously executes multiple calls to fillOrder until total amount of makerAsset is bought by taker.
     *  Under-the-hood, this
     * method uses the `feeRecipientAddress`s of the orders to looks up the coordinator server endpoints registered in the
     * coordinator registry contract. It requests a signature from each coordinator server before
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

        const feeRecipientAddresses = signedOrders.map(o => o.feeRecipientAddress);
        const data = this._transactionEncoder.marketBuyOrdersTx(signedOrders, makerAssetFillAmount);
        return this._handleFillsAsync(data, takerAddress, feeRecipientAddresses, orderTransactionOpts);
    }

    /**
     * Synchronously executes multiple calls to fillOrder until total amount of makerAsset is bought by taker.
     * Under-the-hood, this
     * method uses the `feeRecipientAddress`s of the orders to looks up the coordinator server endpoints registered in the
     * coordinator registry contract. It requests a signature from each coordinator server before
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

        const data = this._transactionEncoder.marketSellOrdersTx(signedOrders, takerAssetFillAmount);
        const feeRecipients = signedOrders.map(o => o.feeRecipientAddress);
        return this._handleFillsAsync(data, takerAddress, feeRecipients, orderTransactionOpts);
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

        const feeRecipientAddresses = signedOrders.map(o => o.feeRecipientAddress);
        const data = this._transactionEncoder.marketBuyOrdersNoThrowTx(signedOrders, makerAssetFillAmount);
        return this._handleFillsAsync(data, takerAddress, feeRecipientAddresses, orderTransactionOpts);
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

        const feeRecipientAddresses = signedOrders.map(o => o.feeRecipientAddress);
        const data = this._transactionEncoder.marketSellOrdersNoThrowTx(signedOrders, takerAssetFillAmount);
        return this._handleFillsAsync(data, takerAddress, feeRecipientAddresses, orderTransactionOpts);
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
        const transaction = await this._generateSignedZeroExTransactionAsync(data, order.makerAddress);
        const endpoints = await this._getServerEndpointsOrThrowAsync([order.feeRecipientAddress]);
        return (await this._executeServerRequestAsync(
            transaction,
            order.makerAddress,
            endpoints[0],
        )) as CoordinatorServerCancellationResponse;
    }

    /**
     * Batch version of softCancelOrderAsync. Requests multiple soft cancels
     * @param   orders                An array of orders to cancel.
     * @return  CoordinatorServerCancellationResponse. See [Cancellation Response](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/coordinator-specification.md#response).
     */
    @decorators.asyncZeroExErrorHandler
    public async batchSoftCancelOrdersAsync(orders: SignedOrder[]): Promise<CoordinatorServerCancellationResponse[]> {
        assert.doesConformToSchema('orders', orders, schemas.ordersSchema);
        const makerAddress = getMakerAddressOrThrow(orders);
        assert.isSenderAddressAsync('makerAddress', makerAddress, this._web3Wrapper);

        const data = this._transactionEncoder.batchCancelOrdersTx(orders);
        const transaction = await this._generateSignedZeroExTransactionAsync(data, makerAddress);
        const endpoints = await this._getServerEndpointsOrThrowAsync(orders.map(o => o.feeRecipientAddress));
        return (await this._batchExecuteServerRequestAsync(
            transaction,
            makerAddress,
            endpoints,
        )) as CoordinatorServerCancellationResponse[];
    }

    /**
     * Cancels an order on-chain and involves an Ethereum transaction.
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
        const transaction = await this._generateSignedZeroExTransactionAsync(data, order.makerAddress);
        return this._submitCoordinatorTransactionAsync(
            transaction,
            order.makerAddress,
            transaction.signature,
            [],
            [],
            orderTransactionOpts,
        );
    }

    /**
     * Batch version of hardCancelOrderAsync. Cancels orders on-chain and involves an Ethereum transaction.
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

        const data = this._transactionEncoder.batchCancelOrdersTx(orders);
        const transaction = await this._generateSignedZeroExTransactionAsync(data, makerAddress);
        return this._submitCoordinatorTransactionAsync(
            transaction,
            makerAddress,
            transaction.signature,
            [],
            [],
            orderTransactionOpts,
        );
    }

    /**
     * Cancels orders on-chain and involves an Ethereum transaction.
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
        // const transaction = await this._generateSignedZeroExTransactionAsync(data, senderAddress);
        // return this._submitCoordinatorTransactionAsync(
        //     transaction,
        //     senderAddress,
        //     transaction.signature,
        //     [],
        //     [],
        //     orderTransactionOpts,
        // );
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

    private async _handleFillsAsync(
        data: string,
        takerAddress: string,
        feeRecipientAddresses: string[],
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        const uniqueFeeRecipients = [...new Set(feeRecipientAddresses)];
        const endpoints = await this._getServerEndpointsOrThrowAsync(uniqueFeeRecipients);
        const transaction = await this._generateSignedZeroExTransactionAsync(data, takerAddress);
        const approvalResponses = (await this._batchExecuteServerRequestAsync(
            transaction,
            takerAddress,
            endpoints,
        )) as CoordinatorServerApprovalResponse[];

        // concatenate all approval responses
        const { allSignatures, allExpirations } = approvalResponses.reduce(
            (accumulator, { signatures, expirationTimeSeconds }) => {
                const expirations = Array(signatures.length).fill(expirationTimeSeconds);
                accumulator.allSignatures.concat(signatures);
                accumulator.allExpirations.concat(expirations);
                return accumulator;
            },
            { allSignatures: new Array(), allExpirations: new Array() },
        );

        // submit transaction with approvals
        return this._submitCoordinatorTransactionAsync(
            transaction,
            takerAddress,
            transaction.signature,
            allSignatures,
            allExpirations,
            orderTransactionOpts,
        );
    }
    private async _getServerEndpointsOrThrowAsync(feeRecipientAddresses: string[]): Promise<string[]> {
        const uniqueFeeRecipients = [...new Set(feeRecipientAddresses)];
        const endpoints = uniqueFeeRecipients.map(feeRecipientAddress => {
            const coordinatorOperatorEndpoint = this._registryInstance.getCoordinatorEndpoint.callAsync(
                feeRecipientAddress,
            );
            if (coordinatorOperatorEndpoint === undefined) {
                throw new Error(
                    `No Coordinator server endpoint found in Coordinator Registry for feeRecipientAddress: ${feeRecipientAddress}. Registry contract address: ${
                        this.registryAddress
                    }`,
                );
            }
            return coordinatorOperatorEndpoint;
        });
        return Promise.all(endpoints);
    }

    private async _generateSignedZeroExTransactionAsync(
        data: string,
        senderAddress: string,
    ): Promise<SignedZeroExTransaction> {
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

    private async _executeServerRequestAsync(
        signedTransaction: SignedZeroExTransaction,
        txOrigin: string,
        endpoint: string,
    ): Promise<CoordinatorServerApprovalResponse | CoordinatorServerCancellationResponse> {
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

        if (response.status !== HTTP_OK) {
            if (response.status === 400) { // tslint:disable-line:custom-no-magic-numbers
                const errorReport = await response.json();
                const errorDetails = {
                    ...errorReport,
                    coordinatorOperator: endpoint,
                    request: requestPayload,
                };
                throw new Error(JSON.stringify(errorDetails));
            } else {
                throw new Error(
                    `Error response from coordinator operator at [${endpoint}]. Request payload: ${JSON.stringify(
                        requestPayload,
                    )}. Response: [${response.status}] ${JSON.stringify(await response.json())}`,
                ); // todo (xianny)
            }
        }
        return (await response.json()) as CoordinatorServerApprovalResponse | CoordinatorServerCancellationResponse;
    }

    private async _batchExecuteServerRequestAsync(
        signedTransaction: SignedZeroExTransaction,
        txOrigin: string,
        endpoints: string[],
    ): Promise<Array<CoordinatorServerApprovalResponse | CoordinatorServerCancellationResponse>> {
        const responses = endpoints.map(endpoint => {
            const response = this._executeServerRequestAsync(signedTransaction, txOrigin, endpoint);
            return response;
        });
        return Promise.all(responses);
    }

    private async _submitCoordinatorTransactionAsync(
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
}

function getMakerAddressOrThrow(orders: Array<Order | SignedOrder>): string {
    const uniqueMakerAddresses = new Set(orders.map(o => o.makerAddress));
    if (uniqueMakerAddresses.size > 1) {
        throw new Error(`All orders in a batch must have the same makerAddress`);
    }
    return orders[0].makerAddress;
}
// tslint:disable:max-file-line-count
