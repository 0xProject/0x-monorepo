import {
    CoordinatorContract,
    CoordinatorRegistryContract,
    ExchangeContract,
} from '@0x/abi-gen-wrappers';
import { Coordinator, CoordinatorRegistry, Exchange } from '@0x/contract-artifacts';
import { schemas } from '@0x/json-schemas';
import {
    generatePseudoRandomSalt,
    signatureUtils,
    transactionHashUtils,
} from '@0x/order-utils';
import { Order, SignedOrder, ZeroExTransaction } from '@0x/types';
import { BigNumber, fetchAsync } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { ContractAbi } from 'ethereum-types';
import * as http from 'http';
import * as request from 'supertest';

import { orderTxOptsSchema } from '../schemas/order_tx_opts_schema';
import { txOptsSchema } from '../schemas/tx_opts_schema';
import {
    CoordinatorServerResponse,
    OrderTransactionOpts,
} from '../types';
import { assert } from '../utils/assert';
import { _getDefaultContractAddresses } from '../utils/contract_addresses';
import { decorators } from '../utils/decorators';
import { TransactionEncoder } from '../utils/transaction_encoder';

import { ContractWrapper } from './contract_wrapper';

const HTTP_OK = 200;

/**
 * This class includes all the functionality related to calling methods, sending transactions and subscribing to
 * events of the 0x V2 Coordinator smart contract.
 */
export class CoordinatorWrapper extends ContractWrapper {
    public abi: ContractAbi = Coordinator.compilerOutput.abi;
    public networkId: number;
    public address: string;
    public exchangeAddress: string;
    public registryAddress: string;
    private _contractInstance: CoordinatorContract;
    private _registryInstance: CoordinatorRegistryContract;
    private _exchangeInstance: ExchangeContract;
    private _transactionEncoder: TransactionEncoder;

    /**
     * Instantiate ExchangeWrapper
     * @param web3Wrapper Web3Wrapper instance to use.
     * @param networkId Desired networkId.
     * @param address The address of the Coordinator contract. If undefined, will
     * default to the known address corresponding to the networkId.
     * @param registryAddress The address of the Coordinator contract. If undefined, will
     * default to the known address corresponding to the networkId.
     * @param zrxTokenAddress The address of the ZRXToken contract. If
     * undefined, will default to the known address corresponding to the
     * networkId.
     * @param blockPollingIntervalMs The block polling interval to use for active subscriptions.
     */
    constructor(
        web3Wrapper: Web3Wrapper,
        networkId: number,
        address?: string,
        exchangeAddress?: string,
        registryAddress?: string,
        blockPollingIntervalMs?: number,
    ) {
        super(web3Wrapper, networkId, blockPollingIntervalMs);
        this.networkId = networkId;
        this.address = address === undefined ? _getDefaultContractAddresses(networkId).coordinator : address;
        this.exchangeAddress = exchangeAddress === undefined
            ? _getDefaultContractAddresses(networkId).coordinator
            : exchangeAddress;
        this.registryAddress = registryAddress === undefined
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
        const feeRecipientAddress = getFeeRecipientOrThrow([leftSignedOrder, rightSignedOrder]);
        const data = this._transactionEncoder.matchOrdersTx(leftSignedOrder, rightSignedOrder);
        return this._handleFillAsync(data, takerAddress, feeRecipientAddress, orderTransactionOpts);
    }

    /**
     * Cancel a given order.
     * @param   order           An object that conforms to the Order or SignedOrder interface. The order you would like to cancel.
     * @param   orderTransactionOpts Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async cancelOrderAsync(
        order: Order | SignedOrder,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('order', order, schemas.orderSchema);
        const data = this._transactionEncoder.cancelOrderTx(order);
        return this._handleFillAsync(data, order.makerAddress, order.feeRecipientAddress, orderTransactionOpts); // todo: is this the right taker address?
    }

    /**
     * Batch version of cancelOrderAsync. Executes multiple cancels atomically in a single transaction.
     * @param   orders                An array of orders to cancel.
     * @param   orderTransactionOpts  Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async batchCancelOrdersAsync(
        orders: SignedOrder[],
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('orders', orders, schemas.ordersSchema);
        const makerAddresses = orders.map(o => o.makerAddress);
        const makerAddress = makerAddresses[0];
        const feeRecipientAddress = getFeeRecipientOrThrow(orders);
        const data = this._transactionEncoder.batchCancelOrdersTx(orders);
        return this._handleFillAsync(data, makerAddress, feeRecipientAddress, orderTransactionOpts);
    }

    /**
     * Cancels all orders created by makerAddress with a salt less than or equal to the targetOrderEpoch
     * and senderAddress equal to msg.sender (or null address if msg.sender == makerAddress).
     * @param   targetOrderEpoch             Target order epoch.
     * @param   senderAddress                Address that should send the transaction.
     * @param   orderTransactionOpts         Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async cancelOrdersUpToAsync(
        targetOrderEpoch: BigNumber,
        senderAddress: string,
        coordinatorOperatorAddress: string,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.isBigNumber('targetOrderEpoch', targetOrderEpoch);
        const data = this._transactionEncoder.cancelOrdersUpToTx(targetOrderEpoch);
        return this._handleFillAsync(data, senderAddress, coordinatorOperatorAddress, orderTransactionOpts);
    }

    /**
     * Executes a 0x transaction. Transaction messages exist for the purpose of calling methods on the Exchange contract
     * in the context of another address (see [ZEIP18](https://github.com/0xProject/ZEIPs/issues/18)).
     * This is especially useful for implementing filter contracts.
     * @param   salt                  Salt
     * @param   signerAddress         Signer address
     * @param   data                  Transaction data
     * @param   signature             Signature
     * @param   takerAddress          Sender address
     * @param   feeRecipientAddress   Coordinator operator address registered in CoordinatorRegistryContract
     * @param   orderTransactionOpts  Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async executeTransactionWithApprovalAsync(
        salt: BigNumber,
        signerAddress: string,
        data: string,
        signature: string,
        takerAddress: string,
        feeRecipientAddress: string,
        orderTransactionOpts: OrderTransactionOpts,
    ): Promise<string> {
        assert.isBigNumber('salt', salt);
        assert.isETHAddressHex('signerAddress', signerAddress);
        assert.isHexString('data', data);
        assert.isHexString('signature', signature);
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        assert.isETHAddressHex('feeRecipientAddress', feeRecipientAddress);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);

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

        const txOrigin = takerAddress;
        const zeroExTransaction = {
            salt,
            signerAddress,
            data,
        };

        const requestPayload = {
            signedTransaction: {
                ...zeroExTransaction,
                signature,
                verifyingContractAddress: this.exchangeAddress,
            },
            txOrigin,
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
            throw new Error(``); // todo
        }

        const { signatures, expirationTimeSeconds } = (await response.json()) as CoordinatorServerResponse;

        console.log(`signatures, expiration: ${JSON.stringify(signatures)}, ${JSON.stringify(expirationTimeSeconds)}`);
        return this._contractInstance.executeTransaction.sendTransactionAsync(
            zeroExTransaction,
            txOrigin,
            signature,
            [expirationTimeSeconds],
            signatures,
            {
                from: txOrigin,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            },
        );
    }

    private async _handleFillAsync(
        data: string,
        takerAddress: string,
        feeRecipientAddress: string,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        const normalizedTakerAddress = takerAddress.toLowerCase();

        const transaction: ZeroExTransaction = {
            salt: generatePseudoRandomSalt(),
            signerAddress: normalizedTakerAddress,
            data,
            verifyingContractAddress: this.exchangeAddress,
        };
        const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
        const signature = await signatureUtils.ecSignHashAsync(
            this._web3Wrapper.getProvider(),
            transactionHash,
            transaction.signerAddress,
        );

        return this.executeTransactionWithApprovalAsync(
            transaction.salt,
            normalizedTakerAddress,
            data,
            signature,
            normalizedTakerAddress,
            feeRecipientAddress,
            orderTransactionOpts,
        );
    }
} // tslint:disable:max-file-line-count

function getFeeRecipientOrThrow(orders: Array<Order | SignedOrder>): string {
    const uniqueFeeRecipients = new Set(orders.map(o => o.feeRecipientAddress));
    if (uniqueFeeRecipients.size > 1) {
        throw new Error(`All orders in a batch must have the same feeRecipientAddress (a valid coordinator operator address)`);
    }
    return orders[0].feeRecipientAddress;
}
