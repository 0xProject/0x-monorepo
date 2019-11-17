import { SendTransactionOpts } from '@0x/base-contract';
import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { ExchangeContract } from '@0x/contracts-exchange';
import { ExchangeFunctionName } from '@0x/contracts-test-utils';
import { schemas } from '@0x/json-schemas';
import { generatePseudoRandomSalt, signatureUtils } from '@0x/order-utils';
import { Order, SignedOrder, SignedZeroExTransaction, ZeroExTransaction } from '@0x/types';
import { BigNumber, fetchAsync } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { ContractAbi, SupportedProvider, TxData } from 'ethereum-types';
import * as HttpStatus from 'http-status-codes';
import { flatten } from 'lodash';

import { artifacts } from '../artifacts';
import { CoordinatorContract, CoordinatorRegistryContract } from '../wrappers';

import { assert } from './utils/assert';
import {
    CoordinatorServerApprovalResponse,
    CoordinatorServerCancellationResponse,
    CoordinatorServerError,
    CoordinatorServerErrorMsg,
    CoordinatorServerResponse,
} from './utils/coordinator_server_types';
export {
    CoordinatorServerApprovalResponse,
    CoordinatorServerCancellationResponse,
    CoordinatorServerError,
    CoordinatorServerErrorMsg,
    CoordinatorServerResponse,
};
import { decorators } from './utils/decorators';

/**
 * This class includes all the functionality related to filling or cancelling orders through
 * the 0x V2 Coordinator extension contract.
 */
export class CoordinatorClient {
    public abi: ContractAbi = artifacts.Coordinator.compilerOutput.abi;
    public chainId: number;
    public address: string;
    public exchangeAddress: string;
    public registryAddress: string;

    /**
     * Validates that the 0x transaction has been approved by all of the feeRecipients that correspond to each order in the transaction's Exchange calldata.
     * Throws an error if the transaction approvals are not valid. Will not detect failures that would occur when the transaction is executed on the Exchange contract.
     * @param transaction 0x transaction containing salt, signerAddress, and data.
     * @param txOrigin Required signer of Ethereum transaction calling this function.
     * @param transactionSignature Proof that the transaction has been signed by the signer.
     * @param approvalExpirationTimeSeconds Array of expiration times in seconds for which each corresponding approval signature expires.
     * @param approvalSignatures Array of signatures that correspond to the feeRecipients of each order in the transaction's Exchange calldata.
     */
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _contractInstance: CoordinatorContract;
    private readonly _registryInstance: CoordinatorRegistryContract;
    private readonly _exchangeInstance: ExchangeContract;
    private readonly _feeRecipientToEndpoint: { [feeRecipient: string]: string } = {};

    /**
     * Instantiate CoordinatorClient
     * @param web3Wrapper Web3Wrapper instance to use.
     * @param chainId Desired chainId.
     * @param address The address of the Coordinator contract. If undefined, will
     * default to the known address corresponding to the chainId.
     * @param exchangeAddress The address of the Exchange contract. If undefined, will
     * default to the known address corresponding to the chainId.
     * @param registryAddress The address of the CoordinatorRegistry contract. If undefined, will
     * default to the known address corresponding to the chainId.
     */
    constructor(
        provider: SupportedProvider,
        chainId: number,
        address?: string,
        exchangeAddress?: string,
        registryAddress?: string,
    ) {
        this.chainId = chainId;
        const contractAddresses = getContractAddressesForChainOrThrow(this.chainId);
        this.address = address === undefined ? contractAddresses.coordinator : address;
        this.exchangeAddress = exchangeAddress === undefined ? contractAddresses.coordinator : exchangeAddress;
        this.registryAddress = registryAddress === undefined ? contractAddresses.coordinatorRegistry : registryAddress;
        this._web3Wrapper = new Web3Wrapper(provider);

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
     * @param   sendTxOpts  Optional arguments for sending the transaction
     * @return  Transaction hash.
     */

    public async fillOrderAsync(
        order: Order,
        takerAssetFillAmount: BigNumber,
        signature: string,
        txData: TxData,
        sendTxOpts: Partial<SendTransactionOpts> = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('order', order, schemas.orderSchema);
        assert.isValidBaseUnitAmount('takerAssetFillAmount', takerAssetFillAmount);
        return this._executeTxThroughCoordinatorAsync(
            ExchangeFunctionName.FillOrder,
            txData,
            sendTxOpts,
            [order],
            order,
            takerAssetFillAmount,
            signature,
        );
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
        order: Order,
        takerAssetFillAmount: BigNumber,
        signature: string,
        txData: TxData,
        sendTxOpts: Partial<SendTransactionOpts> = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('order', order, schemas.orderSchema);
        assert.isValidBaseUnitAmount('takerAssetFillAmount', takerAssetFillAmount);
        return this._executeTxThroughCoordinatorAsync(
            ExchangeFunctionName.FillOrKillOrder,
            txData,
            sendTxOpts,
            [order],
            order,
            takerAssetFillAmount,
            signature,
        );
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
     * @param   sendTxOpts  Optional arguments for sending the transaction
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async batchFillOrdersAsync(
        orders: Order[],
        takerAssetFillAmounts: BigNumber[],
        signatures: string[],
        txData: TxData,
        sendTxOpts?: Partial<SendTransactionOpts>,
    ): Promise<string> {
        return this._batchFillAsync(
            ExchangeFunctionName.BatchFillOrders,
            orders,
            takerAssetFillAmounts,
            signatures,
            txData,
            sendTxOpts,
        );
    }
    /**
     * No throw version of batchFillOrdersAsync
     * @param   signedOrders          An array of signed orders to fill.
     * @param   takerAssetFillAmounts The amounts of the orders (in taker asset baseUnits) that you wish to fill.
     * @param   takerAddress          The user Ethereum address who would like to fill these orders. Must be available via the supplied
     *                                Provider provided at instantiation.
     * @param   sendTxOpts  Optional arguments for sending the transaction
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async batchFillOrdersNoThrowAsync(
        orders: Order[],
        takerAssetFillAmounts: BigNumber[],
        signatures: string[],
        txData: TxData,
        sendTxOpts?: Partial<SendTransactionOpts>,
    ): Promise<string> {
        return this._batchFillAsync(
            ExchangeFunctionName.BatchFillOrdersNoThrow,
            orders,
            takerAssetFillAmounts,
            signatures,
            txData,
            sendTxOpts,
        );
    }
    /**
     * Batch version of fillOrKillOrderAsync. Executes multiple fills atomically in a single transaction.
     * @param   signedOrders          An array of signed orders to fill.
     * @param   takerAssetFillAmounts The amounts of the orders (in taker asset baseUnits) that you wish to fill.
     * @param   takerAddress          The user Ethereum address who would like to fill these orders. Must be available via the supplied
     *                                Provider provided at instantiation.
     * @param   sendTxOpts  Optional arguments for sending the transaction
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async batchFillOrKillOrdersAsync(
        orders: Order[],
        takerAssetFillAmounts: BigNumber[],
        signatures: string[],
        txData: TxData,
        sendTxOpts?: Partial<SendTransactionOpts>,
    ): Promise<string> {
        return this._batchFillAsync(
            ExchangeFunctionName.BatchFillOrKillOrders,
            orders,
            takerAssetFillAmounts,
            signatures,
            txData,
            sendTxOpts,
        );
    }

    public async marketBuyOrdersFillOrKillAsync(
        orders: Order[],
        takerAssetFillAmount: BigNumber,
        signatures: string[],
        txData: TxData,
        sendTxOpts: SendTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        return this._marketBuySellOrdersAsync(
            ExchangeFunctionName.MarketBuyOrdersFillOrKill,
            orders,
            takerAssetFillAmount,
            signatures,
            txData,
            sendTxOpts,
        );
    }

    /**
     * No throw version of marketBuyOrdersFillOrKillAsync
     * @param   signedOrders         An array of signed orders to fill.
     * @param   makerAssetFillAmount Maker asset fill amount.
     * @param   takerAddress         The user Ethereum address who would like to fill these orders. Must be available via the supplied
     *                               Provider provided at instantiation.
     * @param   orderTransactionOpts Optional arguments this method accepts.
     * @return  Transaction hash.
     */

    public async marketBuyOrdersNoThrowAsync(
        orders: Order[],
        takerAssetFillAmount: BigNumber,
        signatures: string[],
        txData: TxData,
        sendTxOpts: SendTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        return this._marketBuySellOrdersAsync(
            ExchangeFunctionName.MarketBuyOrdersNoThrow,
            orders,
            takerAssetFillAmount,
            signatures,
            txData,
            sendTxOpts,
        );
    }

    public async marketSellOrdersFillOrKillAsync(
        orders: Order[],
        takerAssetFillAmount: BigNumber,
        signatures: string[],
        txData: TxData,
        sendTxOpts: SendTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        return this._marketBuySellOrdersAsync(
            ExchangeFunctionName.MarketSellOrdersFillOrKill,
            orders,
            takerAssetFillAmount,
            signatures,
            txData,
            sendTxOpts,
        );
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
    public async marketSellOrdersNoThrowAsync(
        orders: Order[],
        takerAssetFillAmount: BigNumber,
        signatures: string[],
        txData: TxData,
        sendTxOpts: SendTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        return this._marketBuySellOrdersAsync(
            ExchangeFunctionName.MarketSellOrdersNoThrow,
            orders,
            takerAssetFillAmount,
            signatures,
            txData,
            sendTxOpts,
        );
    }

    public async matchOrdersAsync(
        leftOrder: Order,
        rightOrder: Order,
        leftSignature: string,
        rightSignature: string,
        txData: TxData,
        sendTxOpts: SendTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('leftOrder', leftOrder, schemas.orderSchema);
        assert.doesConformToSchema('rightOrder', rightOrder, schemas.orderSchema);
        return this._executeTxThroughCoordinatorAsync(
            ExchangeFunctionName.MatchOrders,
            txData,
            sendTxOpts,
            [leftOrder, rightOrder],
            leftOrder,
            rightOrder,
            leftSignature,
            rightSignature,
        );
    }
    public async matchOrdersWithMaximalFillAsync(
        leftOrder: Order,
        rightOrder: Order,
        leftSignature: string,
        rightSignature: string,
        txData: TxData,
        sendTxOpts: SendTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('leftOrder', leftOrder, schemas.orderSchema);
        assert.doesConformToSchema('rightOrder', rightOrder, schemas.orderSchema);
        return this._executeTxThroughCoordinatorAsync(
            ExchangeFunctionName.MatchOrdersWithMaximalFill,
            txData,
            sendTxOpts,
            [leftOrder, rightOrder],
            leftOrder,
            rightOrder,
            leftSignature,
            rightSignature,
        );
    }
    public async batchMatchOrdersAsync(
        leftOrders: Order[],
        rightOrders: Order[],
        leftSignatures: string[],
        rightSignatures: string[],
        txData: TxData,
        sendTxOpts: SendTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('leftOrders', leftOrders, schemas.ordersSchema);
        assert.doesConformToSchema('rightOrders', rightOrders, schemas.ordersSchema);
        return this._executeTxThroughCoordinatorAsync(
            ExchangeFunctionName.MatchOrders,
            txData,
            sendTxOpts,
            leftOrders.concat(rightOrders),
            leftOrders,
            rightOrders,
            leftSignatures,
            rightSignatures,
        );
    }
    public async batchMatchOrdersWithMaximalFillAsync(
        leftOrders: Order[],
        rightOrders: Order[],
        leftSignatures: string[],
        rightSignatures: string[],
        txData: TxData,
        sendTxOpts: SendTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('leftOrders', leftOrders, schemas.ordersSchema);
        assert.doesConformToSchema('rightOrders', rightOrders, schemas.ordersSchema);
        return this._executeTxThroughCoordinatorAsync(
            ExchangeFunctionName.MatchOrdersWithMaximalFill,
            txData,
            sendTxOpts,
            leftOrders.concat(rightOrders),
            leftOrders,
            rightOrders,
            leftSignatures,
            rightSignatures,
        );
    }

    /**
     * Cancels an order on-chain by submitting an Ethereum transaction.
     * @param   order           An object that conforms to the Order or SignedOrder interface. The order you would like to cancel.
     * @param   orderTransactionOpts Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    public async hardCancelOrderAsync(
        order: Order,
        txData: TxData,
        sendTxOpts: SendTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('order', order, schemas.orderSchema);
        return this._executeTxThroughCoordinatorAsync(
            ExchangeFunctionName.CancelOrder,
            txData,
            sendTxOpts,
            [order],
            order,
        );
    }

    /**
     * Batch version of hardCancelOrderAsync. Cancels orders on-chain by submitting an Ethereum transaction.
     * Executes multiple cancels atomically in a single transaction.
     * @param   orders                An array of orders to cancel.
     * @param   sendTxOpts  Optional arguments for sending the transaction
     * @return  Transaction hash.
     */
    public async batchHardCancelOrdersAsync(
        orders: Order[],
        txData: TxData,
        sendTxOpts: SendTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('orders', orders, schemas.ordersSchema);
        return this._executeTxThroughCoordinatorAsync(
            ExchangeFunctionName.BatchCancelOrders,
            txData,
            sendTxOpts,
            orders,
            orders,
        );
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
    public async hardCancelOrdersUpToAsync(
        targetOrderEpoch: BigNumber,
        txData: TxData,
        sendTxOpts: SendTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.isBigNumber('targetOrderEpoch', targetOrderEpoch);
        return this._executeTxThroughCoordinatorAsync(
            ExchangeFunctionName.CancelOrdersUpTo,
            txData,
            sendTxOpts,
            [],
            targetOrderEpoch,
        );
    }
    /**
     * Soft cancel a given order.
     * Soft cancels are recorded only on coordinator operator servers and do not involve an Ethereum transaction.
     * See [soft cancels](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/coordinator-specification.md#soft-cancels).
     * @param   order           An object that conforms to the Order or SignedOrder interface. The order you would like to cancel.
     * @return  CoordinatorServerCancellationResponse. See [Cancellation Response](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/coordinator-specification.md#response).
     */
    public async softCancelAsync(order: Order): Promise<CoordinatorServerCancellationResponse> {
        assert.doesConformToSchema('order', order, schemas.orderSchema);
        assert.isETHAddressHex('feeRecipientAddress', order.feeRecipientAddress);
        assert.isSenderAddressAsync('makerAddress', order.makerAddress, this._web3Wrapper);

        const data = this._exchangeInstance.cancelOrder(order).getABIEncodedTransactionData();
        const transaction = await this._generateSignedZeroExTransactionAsync(data, order.makerAddress);
        const endpoint = await this._getServerEndpointOrThrowAsync(order);

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
    public async batchSoftCancelAsync(orders: SignedOrder[]): Promise<CoordinatorServerCancellationResponse[]> {
        assert.doesConformToSchema('orders', orders, schemas.ordersSchema);
        const makerAddress = getMakerAddressOrThrow(orders);
        assert.isSenderAddressAsync('makerAddress', makerAddress, this._web3Wrapper);
        const data = this._exchangeInstance.batchCancelOrders(orders).getABIEncodedTransactionData();
        const transaction = await this._generateSignedZeroExTransactionAsync(data, makerAddress);

        // make server requests
        const errorResponses: CoordinatorServerResponse[] = [];
        const successResponses: CoordinatorServerCancellationResponse[] = [];
        const serverEndpointsToOrders = await this._mapServerEndpointsToOrdersAsync(orders);
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
     * Recovers the address of a signer given a hash and signature.
     * @param hash Any 32 byte hash.
     * @param signature Proof that the hash has been signed by signer.
     * @returns Signer address.
     */
    public async getSignerAddressAsync(hash: string, signature: string): Promise<string> {
        assert.isHexString('hash', hash);
        assert.isHexString('signature', signature);
        const signerAddress = await this._contractInstance.getSignerAddress(hash, signature).callAsync();
        return signerAddress;
    }

    private async _marketBuySellOrdersAsync(
        exchangeFn: ExchangeFunctionName,
        orders: Order[],
        assetFillAmount: BigNumber,
        signatures: string[],
        txData: TxData,
        sendTxOpts: SendTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('orders', orders, schemas.ordersSchema);
        assert.isBigNumber('assetFillAmount', assetFillAmount);
        return this._executeTxThroughCoordinatorAsync(
            exchangeFn,
            txData,
            sendTxOpts,
            orders,
            orders,
            assetFillAmount,
            signatures,
        );
    }

    private async _batchFillAsync(
        exchangeFn: ExchangeFunctionName,
        orders: Order[],
        takerAssetFillAmounts: BigNumber[],
        signatures: string[],
        txData: TxData,
        sendTxOpts: SendTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('orders', orders, schemas.ordersSchema);
        takerAssetFillAmounts.forEach(takerAssetFillAmount =>
            assert.isValidBaseUnitAmount('takerAssetFillAmount', takerAssetFillAmount),
        );
        return this._executeTxThroughCoordinatorAsync(
            exchangeFn,
            txData,
            sendTxOpts,
            orders,
            orders,
            takerAssetFillAmounts,
            signatures,
        );
    }

    private async _executeTxThroughCoordinatorAsync(
        exchangeFn: ExchangeFunctionName,
        txData: TxData,
        sendTxOpts: Partial<SendTransactionOpts>,
        ordersNeedingApprovals: Order[],
        ...args: any[] // tslint:disable-line:trailing-comma
    ): Promise<string> {
        assert.isETHAddressHex('takerAddress', txData.from);
        await assert.isSenderAddressAsync('takerAddress', txData.from, this._web3Wrapper);

        // get ABI encoded transaction data for the desired exchange method
        const data = (this._exchangeInstance as any)[exchangeFn](...args).getABIEncodedTransactionData();

        // generate and sign a ZeroExTransaction
        const signedZrxTx = await this._generateSignedZeroExTransactionAsync(data, txData.from);

        // get approval signatures from registered coordinator operators
        const approvalSignatures = await this._getApprovalsAsync(signedZrxTx, ordersNeedingApprovals, txData.from);

        // execute the transaction through the Coordinator Contract
        const txHash = this._contractInstance
            .executeTransaction(signedZrxTx, txData.from, signedZrxTx.signature, approvalSignatures)
            .sendTransactionAsync(txData, sendTxOpts);
        return txHash;
    }

    private async _generateSignedZeroExTransactionAsync(
        data: string,
        signerAddress: string,
    ): Promise<SignedZeroExTransaction> {
        const oneMinute = 1 * 60;
        const transaction: ZeroExTransaction = {
            salt: generatePseudoRandomSalt(),
            signerAddress,
            data,
            domain: {
                verifyingContract: this.exchangeAddress,
                chainId: await this._web3Wrapper.getChainIdAsync(),
            },
            expirationTimeSeconds: new BigNumber(Math.floor(Date.now() / 1000) + oneMinute),
            gasPrice: new BigNumber(1),
        };
        const signedZrxTx = await signatureUtils.ecSignTransactionAsync(
            this._web3Wrapper.getProvider(),
            transaction,
            transaction.signerAddress,
        );
        return signedZrxTx;
    }

    private async _getApprovalsAsync(
        transaction: SignedZeroExTransaction,
        orders: Order[],
        txOrigin: string,
    ): Promise<string[]> {
        const coordinatorOrders = orders.filter(o => o.senderAddress === this.address);
        if (coordinatorOrders.length === 0) {
            return [];
        }
        const serverEndpointsToOrders = await this._mapServerEndpointsToOrdersAsync(coordinatorOrders);

        // make server requests
        const errorResponses: CoordinatorServerResponse[] = [];
        const approvalResponses: CoordinatorServerResponse[] = [];
        for (const endpoint of Object.keys(serverEndpointsToOrders)) {
            const response = await this._executeServerRequestAsync(transaction, txOrigin, endpoint);
            if (response.isError) {
                errorResponses.push(response);
            } else {
                approvalResponses.push(response);
            }
        }

        // if no errors
        if (errorResponses.length === 0) {
            // concatenate all approval responses
            return approvalResponses.reduce(
                (accumulator, response) =>
                    accumulator.concat((response.body as CoordinatorServerApprovalResponse).signatures),
                [] as string[],
            );
        } else {
            // format errors and approvals
            // concatenate approvals
            const notCoordinatorOrders = orders.filter(o => o.senderAddress !== this.address);
            const approvedOrdersNested = approvalResponses.map(resp => {
                const endpoint = resp.coordinatorOperator;
                return serverEndpointsToOrders[endpoint];
            });
            const approvedOrders = flatten(approvedOrdersNested.concat(notCoordinatorOrders));

            // lookup orders with errors
            const errorsWithOrders = errorResponses.map(resp => {
                const endpoint = resp.coordinatorOperator;
                return {
                    ...resp,
                    orders: serverEndpointsToOrders[endpoint],
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
    }

    private async _getServerEndpointOrThrowAsync(order: Order): Promise<string> {
        const cached = this._feeRecipientToEndpoint[order.feeRecipientAddress];
        const endpoint =
            cached !== undefined
                ? cached
                : await _fetchServerEndpointOrThrowAsync(order.feeRecipientAddress, this._registryInstance);
        return endpoint;

        async function _fetchServerEndpointOrThrowAsync(
            feeRecipient: string,
            registryInstance: CoordinatorRegistryContract,
        ): Promise<string> {
            const coordinatorOperatorEndpoint = await registryInstance.getCoordinatorEndpoint(feeRecipient).callAsync();
            if (coordinatorOperatorEndpoint === '' || coordinatorOperatorEndpoint === undefined) {
                throw new Error(
                    `No Coordinator server endpoint found in Coordinator Registry for feeRecipientAddress: ${feeRecipient}. Registry contract address: [${
                        registryInstance.address
                    }] Order: [${JSON.stringify(order)}]`,
                );
            }
            return coordinatorOperatorEndpoint;
        }
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
        const response = await fetchAsync(`${endpoint}/v2/request_transaction?chainId=${this.chainId}`, {
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

    private async _mapServerEndpointsToOrdersAsync(
        coordinatorOrders: Order[],
    ): Promise<{ [endpoint: string]: Order[] }> {
        const groupByFeeRecipient: { [feeRecipient: string]: Order[] } = {};
        for (const order of coordinatorOrders) {
            const feeRecipient = order.feeRecipientAddress;
            if (groupByFeeRecipient[feeRecipient] === undefined) {
                groupByFeeRecipient[feeRecipient] = [] as Order[];
            }
            groupByFeeRecipient[feeRecipient].push(order);
        }
        const serverEndpointsToOrders: { [endpoint: string]: Order[] } = {};
        for (const orders of Object.values(groupByFeeRecipient)) {
            const endpoint = await this._getServerEndpointOrThrowAsync(orders[0]);
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
