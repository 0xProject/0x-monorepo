import { ExchangeContract, ExchangeEventArgs, ExchangeEvents } from '@0x/abi-gen-wrappers';
import { Exchange } from '@0x/contract-artifacts';
import { schemas } from '@0x/json-schemas';
import {
    assetDataUtils,
    BalanceAndProxyAllowanceLazyStore,
    ExchangeTransferSimulator,
    orderCalculationUtils,
    orderHashUtils,
    OrderStateUtils,
    OrderValidationUtils,
} from '@0x/order-utils';
import { AssetProxyId, Order, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { BlockParamLiteral, ContractAbi, LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { AssetBalanceAndProxyAllowanceFetcher } from '../fetchers/asset_balance_and_proxy_allowance_fetcher';
import { OrderFilledCancelledFetcher } from '../fetchers/order_filled_cancelled_fetcher';
import { methodOptsSchema } from '../schemas/method_opts_schema';
import { orderTxOptsSchema } from '../schemas/order_tx_opts_schema';
import { txOptsSchema } from '../schemas/tx_opts_schema';
import { validateOrderFillableOptsSchema } from '../schemas/validate_order_fillable_opts_schema';
import {
    BlockRange,
    EventCallback,
    ExchangeWrapperError,
    IndexedFilterValues,
    MethodOpts,
    OrderInfo,
    OrderTransactionOpts,
    ValidateOrderFillableOpts,
} from '../types';
import { assert } from '../utils/assert';
import { _getDefaultContractAddresses } from '../utils/contract_addresses';
import { decorators } from '../utils/decorators';
import { TransactionEncoder } from '../utils/transaction_encoder';

import { ERC20TokenWrapper } from './erc20_token_wrapper';
import { ERC721TokenWrapper } from './erc721_token_wrapper';

/**
 * This class includes all the functionality related to calling methods, sending transactions and subscribing to
 * events of the 0x V2 Exchange smart contract.
 */
export class ExchangeWrapper {
    public abi: ContractAbi = Exchange.compilerOutput.abi;
    public address: string;
    public zrxTokenAddress: string;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _exchangeContract: ExchangeContract;
    private readonly _blockPollingIntervalMs?: number;
    private readonly _erc721TokenWrapper: ERC721TokenWrapper;
    private readonly _erc20TokenWrapper: ERC20TokenWrapper;
    /**
     * Instantiate ExchangeWrapper
     * @param web3Wrapper Web3Wrapper instance to use.
     * @param networkId Desired networkId.
     * @param erc20TokenWrapper ERC20TokenWrapper instance to use.
     * @param erc721TokenWrapper ERC721TokenWrapper instance to use.
     * @param address The address of the Exchange contract. If undefined, will
     * default to the known address corresponding to the networkId.
     * @param zrxTokenAddress The address of the ZRXToken contract. If
     * undefined, will default to the known address corresponding to the
     * networkId.
     * @param blockPollingIntervalMs The block polling interval to use for active subscriptions.
     */
    constructor(
        web3Wrapper: Web3Wrapper,
        networkId: number,
        erc20TokenWrapper: ERC20TokenWrapper,
        erc721TokenWrapper: ERC721TokenWrapper,
        address?: string,
        zrxTokenAddress?: string,
        blockPollingIntervalMs?: number,
    ) {
        this._web3Wrapper = web3Wrapper;
        this._erc20TokenWrapper = erc20TokenWrapper;
        this._erc721TokenWrapper = erc721TokenWrapper;
        this._blockPollingIntervalMs = blockPollingIntervalMs;
        this.address = address === undefined ? _getDefaultContractAddresses(networkId).exchange : address;
        this.zrxTokenAddress =
            zrxTokenAddress === undefined ? _getDefaultContractAddresses(networkId).zrxToken : zrxTokenAddress;
        this._exchangeContract = new ExchangeContract(
            this.address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
    }
    /**
     * Retrieve the address of an asset proxy by signature.
     * @param   proxyId        The 4 bytes signature of an asset proxy
     * @param   methodOpts     Optional arguments this method accepts.
     * @return  The address of an asset proxy for a given signature
     */
    public async getAssetProxyBySignatureAsync(proxyId: AssetProxyId, methodOpts: MethodOpts = {}): Promise<string> {
        assert.doesBelongToStringEnum('proxyId', proxyId, AssetProxyId);
        assert.doesConformToSchema('methodOpts', methodOpts, methodOptsSchema);

        const callData = {};
        const assetProxy = await this._exchangeContract.getAssetProxy.callAsync(
            proxyId,
            callData,
            methodOpts.defaultBlock,
        );
        return assetProxy;
    }
    /**
     * Retrieve the takerAssetAmount of an order that has already been filled.
     * @param   orderHash    The hex encoded orderHash for which you would like to retrieve the filled takerAssetAmount.
     * @param   methodOpts   Optional arguments this method accepts.
     * @return  The amount of the order (in taker asset base units) that has already been filled.
     */
    public async getFilledTakerAssetAmountAsync(orderHash: string, methodOpts: MethodOpts = {}): Promise<BigNumber> {
        assert.doesConformToSchema('orderHash', orderHash, schemas.orderHashSchema);
        assert.doesConformToSchema('methodOpts', methodOpts, methodOptsSchema);

        const callData = {};
        const filledTakerAssetAmountInBaseUnits = await this._exchangeContract.filled.callAsync(
            orderHash,
            callData,
            methodOpts.defaultBlock,
        );
        return filledTakerAssetAmountInBaseUnits;
    }
    /**
     * Retrieve the exchange contract version
     * @param   methodOpts   Optional arguments this method accepts.
     * @return  Version
     */
    public async getVersionAsync(methodOpts: MethodOpts = {}): Promise<string> {
        assert.doesConformToSchema('methodOpts', methodOpts, methodOptsSchema);
        const callData = {};
        const version = await this._exchangeContract.VERSION.callAsync(callData, methodOpts.defaultBlock);
        return version;
    }
    /**
     * Retrieve the set order epoch for a given makerAddress & senderAddress pair.
     * Orders can be bulk cancelled by setting the order epoch to a value lower then the salt value of orders one wishes to cancel.
     * @param   makerAddress  Maker address
     * @param   senderAddress Sender address
     * @param   methodOpts    Optional arguments this method accepts.
     * @return  Order epoch. Defaults to 0.
     */
    public async getOrderEpochAsync(
        makerAddress: string,
        senderAddress: string,
        methodOpts: MethodOpts = {},
    ): Promise<BigNumber> {
        assert.isETHAddressHex('makerAddress', makerAddress);
        assert.isETHAddressHex('senderAddress', senderAddress);
        assert.doesConformToSchema('methodOpts', methodOpts, methodOptsSchema);
        const callData = {};
        const orderEpoch = await this._exchangeContract.orderEpoch.callAsync(
            makerAddress,
            senderAddress,
            callData,
            methodOpts.defaultBlock,
        );
        return orderEpoch;
    }
    /**
     * Check if an order has been cancelled. Order cancellations are binary
     * @param   orderHash    The hex encoded orderHash for which you would like to retrieve the cancelled takerAmount.
     * @param   methodOpts   Optional arguments this method accepts.
     * @return  Whether the order has been cancelled.
     */
    public async isCancelledAsync(orderHash: string, methodOpts: MethodOpts = {}): Promise<boolean> {
        assert.doesConformToSchema('orderHash', orderHash, schemas.orderHashSchema);
        assert.doesConformToSchema('methodOpts', methodOpts, methodOptsSchema);
        const callData = {};
        const isCancelled = await this._exchangeContract.cancelled.callAsync(
            orderHash,
            callData,
            methodOpts.defaultBlock,
        );
        return isCancelled;
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
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        const normalizedTakerAddress = takerAddress.toLowerCase();

        if (orderTransactionOpts.shouldValidate) {
            await this._exchangeContract.fillOrder.callAsync(signedOrder, takerAssetFillAmount, signedOrder.signature, {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            });
        }

        const txHash = await this._exchangeContract.fillOrder.sendTransactionAsync(
            signedOrder,
            takerAssetFillAmount,
            signedOrder.signature,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            },
        );
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
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        const normalizedTakerAddress = takerAddress.toLowerCase();

        if (orderTransactionOpts.shouldValidate) {
            await this._exchangeContract.fillOrderNoThrow.callAsync(
                signedOrder,
                takerAssetFillAmount,
                signedOrder.signature,
                {
                    from: normalizedTakerAddress,
                    gas: orderTransactionOpts.gasLimit,
                    gasPrice: orderTransactionOpts.gasPrice,
                    nonce: orderTransactionOpts.nonce,
                },
            );
        }
        const txHash = await this._exchangeContract.fillOrderNoThrow.sendTransactionAsync(
            signedOrder,
            takerAssetFillAmount,
            signedOrder.signature,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            },
        );
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
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        const normalizedTakerAddress = takerAddress.toLowerCase();

        if (orderTransactionOpts.shouldValidate) {
            await this._exchangeContract.fillOrKillOrder.callAsync(
                signedOrder,
                takerAssetFillAmount,
                signedOrder.signature,
                {
                    from: normalizedTakerAddress,
                    gas: orderTransactionOpts.gasLimit,
                    gasPrice: orderTransactionOpts.gasPrice,
                    nonce: orderTransactionOpts.nonce,
                },
            );
        }
        const txHash = await this._exchangeContract.fillOrKillOrder.sendTransactionAsync(
            signedOrder,
            takerAssetFillAmount,
            signedOrder.signature,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            },
        );
        return txHash;
    }
    /**
     * Executes a 0x transaction. Transaction messages exist for the purpose of calling methods on the Exchange contract
     * in the context of another address (see [ZEIP18](https://github.com/0xProject/ZEIPs/issues/18)).
     * This is especially useful for implementing filter contracts.
     * @param   salt                  Salt
     * @param   signerAddress         Signer address
     * @param   data                  Transaction data
     * @param   signature             Signature
     * @param   senderAddress         Sender address
     * @param   orderTransactionOpts  Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async executeTransactionAsync(
        salt: BigNumber,
        signerAddress: string,
        data: string,
        signature: string,
        senderAddress: string,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.isBigNumber('salt', salt);
        assert.isETHAddressHex('signerAddress', signerAddress);
        assert.isHexString('data', data);
        assert.isHexString('signature', signature);
        await assert.isSenderAddressAsync('senderAddress', senderAddress, this._web3Wrapper);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        const normalizedSenderAddress = senderAddress.toLowerCase();

        if (orderTransactionOpts.shouldValidate) {
            await this._exchangeContract.executeTransaction.callAsync(salt, signerAddress, data, signature, {
                from: normalizedSenderAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            });
        }
        const txHash = await this._exchangeContract.executeTransaction.sendTransactionAsync(
            salt,
            signerAddress,
            data,
            signature,
            {
                from: normalizedSenderAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            },
        );
        return txHash;
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
        _.forEach(takerAssetFillAmounts, takerAssetFillAmount =>
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount),
        );
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        const normalizedTakerAddress = takerAddress.toLowerCase();

        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        if (orderTransactionOpts.shouldValidate) {
            await this._exchangeContract.batchFillOrders.callAsync(signedOrders, takerAssetFillAmounts, signatures, {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            });
        }
        const txHash = await this._exchangeContract.batchFillOrders.sendTransactionAsync(
            signedOrders,
            takerAssetFillAmounts,
            signatures,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            },
        );
        return txHash;
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
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        const normalizedTakerAddress = takerAddress.toLowerCase();

        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        if (orderTransactionOpts.shouldValidate) {
            await this._exchangeContract.marketBuyOrders.callAsync(signedOrders, makerAssetFillAmount, signatures, {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            });
        }
        const txHash = await this._exchangeContract.marketBuyOrders.sendTransactionAsync(
            signedOrders,
            makerAssetFillAmount,
            signatures,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            },
        );
        return txHash;
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
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        const normalizedTakerAddress = takerAddress.toLowerCase();

        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        if (orderTransactionOpts.shouldValidate) {
            await this._exchangeContract.marketSellOrders.callAsync(signedOrders, takerAssetFillAmount, signatures, {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            });
        }
        const txHash = await this._exchangeContract.marketSellOrders.sendTransactionAsync(
            signedOrders,
            takerAssetFillAmount,
            signatures,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            },
        );
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
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        const normalizedTakerAddress = takerAddress.toLowerCase();

        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        if (orderTransactionOpts.shouldValidate) {
            await this._exchangeContract.marketBuyOrdersNoThrow.callAsync(
                signedOrders,
                makerAssetFillAmount,
                signatures,
                {
                    from: normalizedTakerAddress,
                    gas: orderTransactionOpts.gasLimit,
                    gasPrice: orderTransactionOpts.gasPrice,
                    nonce: orderTransactionOpts.nonce,
                },
            );
        }
        const txHash = await this._exchangeContract.marketBuyOrdersNoThrow.sendTransactionAsync(
            signedOrders,
            makerAssetFillAmount,
            signatures,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            },
        );
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
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        const normalizedTakerAddress = takerAddress.toLowerCase();

        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        if (orderTransactionOpts.shouldValidate) {
            await this._exchangeContract.marketSellOrdersNoThrow.callAsync(
                signedOrders,
                takerAssetFillAmount,
                signatures,
                {
                    from: normalizedTakerAddress,
                    gas: orderTransactionOpts.gasLimit,
                    gasPrice: orderTransactionOpts.gasPrice,
                    nonce: orderTransactionOpts.nonce,
                },
            );
        }
        const txHash = await this._exchangeContract.marketSellOrdersNoThrow.sendTransactionAsync(
            signedOrders,
            takerAssetFillAmount,
            signatures,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            },
        );
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
        _.forEach(takerAssetFillAmounts, takerAssetFillAmount =>
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount),
        );
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        const normalizedTakerAddress = takerAddress.toLowerCase();

        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        if (orderTransactionOpts.shouldValidate) {
            await this._exchangeContract.batchFillOrdersNoThrow.callAsync(
                signedOrders,
                takerAssetFillAmounts,
                signatures,
                {
                    from: normalizedTakerAddress,
                    gas: orderTransactionOpts.gasLimit,
                    gasPrice: orderTransactionOpts.gasPrice,
                    nonce: orderTransactionOpts.nonce,
                },
            );
        }
        const txHash = await this._exchangeContract.batchFillOrdersNoThrow.sendTransactionAsync(
            signedOrders,
            takerAssetFillAmounts,
            signatures,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            },
        );
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
        _.forEach(takerAssetFillAmounts, takerAssetFillAmount =>
            assert.isBigNumber('takerAssetFillAmount', takerAssetFillAmount),
        );
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        const normalizedTakerAddress = takerAddress.toLowerCase();

        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        if (orderTransactionOpts.shouldValidate) {
            await this._exchangeContract.batchFillOrKillOrders.callAsync(
                signedOrders,
                takerAssetFillAmounts,
                signatures,
                {
                    from: normalizedTakerAddress,
                    gas: orderTransactionOpts.gasLimit,
                    gasPrice: orderTransactionOpts.gasPrice,
                    nonce: orderTransactionOpts.nonce,
                },
            );
        }
        const txHash = await this._exchangeContract.batchFillOrKillOrders.sendTransactionAsync(
            signedOrders,
            takerAssetFillAmounts,
            signatures,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            },
        );
        return txHash;
    }
    /**
     * Batch version of cancelOrderAsync. Executes multiple cancels atomically in a single transaction.
     * @param   orders                An array of orders to cancel.
     * @param   orderTransactionOpts  Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async batchCancelOrdersAsync(
        orders: Array<Order | SignedOrder>,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.doesConformToSchema('orders', orders, schemas.ordersSchema);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        const makerAddresses = _.map(orders, order => order.makerAddress);
        const makerAddress = makerAddresses[0];
        await assert.isSenderAddressAsync('makerAddress', makerAddress, this._web3Wrapper);
        const normalizedMakerAddress = makerAddress.toLowerCase();

        if (orderTransactionOpts.shouldValidate) {
            await this._exchangeContract.batchCancelOrders.callAsync(orders, {
                from: normalizedMakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            });
        }
        const txHash = await this._exchangeContract.batchCancelOrders.sendTransactionAsync(orders, {
            from: normalizedMakerAddress,
            gas: orderTransactionOpts.gasLimit,
            gasPrice: orderTransactionOpts.gasPrice,
            nonce: orderTransactionOpts.nonce,
        });
        return txHash;
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
        await assert.isSenderAddressAsync('takerAddress', takerAddress, this._web3Wrapper);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        const normalizedTakerAddress = takerAddress.toLowerCase();
        if (
            rightSignedOrder.makerAssetData !== leftSignedOrder.takerAssetData ||
            rightSignedOrder.takerAssetData !== leftSignedOrder.makerAssetData
        ) {
            throw new Error(ExchangeWrapperError.AssetDataMismatch);
        }
        if (orderTransactionOpts.shouldValidate) {
            await this._exchangeContract.matchOrders.callAsync(
                leftSignedOrder,
                rightSignedOrder,
                leftSignedOrder.signature,
                rightSignedOrder.signature,
                {
                    from: normalizedTakerAddress,
                    gas: orderTransactionOpts.gasLimit,
                    gasPrice: orderTransactionOpts.gasPrice,
                    nonce: orderTransactionOpts.nonce,
                },
            );
        }
        const txHash = await this._exchangeContract.matchOrders.sendTransactionAsync(
            leftSignedOrder,
            rightSignedOrder,
            leftSignedOrder.signature,
            rightSignedOrder.signature,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            },
        );
        return txHash;
    }
    /**
     * Approves a hash on-chain using any valid signature type.
     * After presigning a hash, the preSign signature type will become valid for that hash and signer.
     * @param hash          Hash to pre-sign
     * @param signerAddress Address that should have signed the given hash.
     * @param signature     Proof that the hash has been signed by signer.
     * @param senderAddress Address that should send the transaction.
     * @param orderTransactionOpts Optional arguments this method accepts.
     * @returns Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async preSignAsync(
        hash: string,
        signerAddress: string,
        signature: string,
        senderAddress: string,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.isHexString('hash', hash);
        assert.isETHAddressHex('signerAddress', signerAddress);
        assert.isHexString('signature', signature);
        await assert.isSenderAddressAsync('senderAddress', senderAddress, this._web3Wrapper);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        const normalizedTakerAddress = senderAddress.toLowerCase();
        if (orderTransactionOpts.shouldValidate) {
            await this._exchangeContract.preSign.callAsync(hash, signerAddress, signature, {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            });
        }
        const txHash = await this._exchangeContract.preSign.sendTransactionAsync(hash, signerAddress, signature, {
            from: normalizedTakerAddress,
            gas: orderTransactionOpts.gasLimit,
            gasPrice: orderTransactionOpts.gasPrice,
            nonce: orderTransactionOpts.nonce,
        });
        return txHash;
    }
    /**
     * Checks if the signature is valid.
     * @param hash          Hash to pre-sign
     * @param signerAddress Address that should have signed the given hash.
     * @param signature     Proof that the hash has been signed by signer.
     * @param methodOpts    Optional arguments this method accepts.
     * @returns If the signature is valid
     */
    @decorators.asyncZeroExErrorHandler
    public async isValidSignatureAsync(
        hash: string,
        signerAddress: string,
        signature: string,
        methodOpts: MethodOpts = {},
    ): Promise<boolean> {
        assert.isHexString('hash', hash);
        assert.isETHAddressHex('signerAddress', signerAddress);
        assert.isHexString('signature', signature);
        assert.doesConformToSchema('methodOpts', methodOpts, methodOptsSchema);
        const callData = {};
        const isValidSignature = await this._exchangeContract.isValidSignature.callAsync(
            hash,
            signerAddress,
            signature,
            callData,
            methodOpts.defaultBlock,
        );
        return isValidSignature;
    }
    /**
     * Checks if the validator is allowed by the signer.
     * @param validatorAddress  Address of a validator
     * @param signerAddress     Address of a signer
     * @param methodOpts        Optional arguments this method accepts.
     * @returns If the validator is allowed
     */
    @decorators.asyncZeroExErrorHandler
    public async isAllowedValidatorAsync(
        signerAddress: string,
        validatorAddress: string,
        methodOpts: MethodOpts = {},
    ): Promise<boolean> {
        assert.isETHAddressHex('signerAddress', signerAddress);
        assert.isETHAddressHex('validatorAddress', validatorAddress);
        if (methodOpts !== undefined) {
            assert.doesConformToSchema('methodOpts', methodOpts, methodOptsSchema);
        }
        const normalizedSignerAddress = signerAddress.toLowerCase();
        const normalizedValidatorAddress = validatorAddress.toLowerCase();
        const callData = {};
        const isValidSignature = await this._exchangeContract.allowedValidators.callAsync(
            normalizedSignerAddress,
            normalizedValidatorAddress,
            callData,
            methodOpts.defaultBlock,
        );
        return isValidSignature;
    }
    /**
     * Check whether the hash is pre-signed on-chain.
     * @param hash          Hash to check if pre-signed
     * @param signerAddress Address that should have signed the given hash.
     * @param methodOpts    Optional arguments this method accepts.
     * @returns Whether the hash is pre-signed.
     */
    @decorators.asyncZeroExErrorHandler
    public async isPreSignedAsync(hash: string, signerAddress: string, methodOpts: MethodOpts = {}): Promise<boolean> {
        assert.isHexString('hash', hash);
        assert.isETHAddressHex('signerAddress', signerAddress);
        if (methodOpts !== undefined) {
            assert.doesConformToSchema('methodOpts', methodOpts, methodOptsSchema);
        }

        const callData = {};
        const isPreSigned = await this._exchangeContract.preSigned.callAsync(
            hash,
            signerAddress,
            callData,
            methodOpts.defaultBlock,
        );
        return isPreSigned;
    }
    /**
     * Checks if transaction is already executed.
     * @param transactionHash  Transaction hash to check
     * @param signerAddress    Address that should have signed the given hash.
     * @param methodOpts       Optional arguments this method accepts.
     * @returns If transaction is already executed.
     */
    @decorators.asyncZeroExErrorHandler
    public async isTransactionExecutedAsync(transactionHash: string, methodOpts: MethodOpts = {}): Promise<boolean> {
        assert.isHexString('transactionHash', transactionHash);
        if (methodOpts !== undefined) {
            assert.doesConformToSchema('methodOpts', methodOpts, methodOptsSchema);
        }
        const callData = {};
        const isExecuted = await this._exchangeContract.transactions.callAsync(
            transactionHash,
            callData,
            methodOpts.defaultBlock,
        );
        return isExecuted;
    }
    /**
     * Get order info
     * @param order         Order
     * @param methodOpts    Optional arguments this method accepts.
     * @returns Order info
     */
    @decorators.asyncZeroExErrorHandler
    public async getOrderInfoAsync(order: Order | SignedOrder, methodOpts: MethodOpts = {}): Promise<OrderInfo> {
        assert.doesConformToSchema('order', order, schemas.orderSchema);
        if (methodOpts !== undefined) {
            assert.doesConformToSchema('methodOpts', methodOpts, methodOptsSchema);
        }
        const callData = {};
        const orderInfo = await this._exchangeContract.getOrderInfo.callAsync(order, callData, methodOpts.defaultBlock);
        return orderInfo;
    }
    /**
     * Get order info for multiple orders
     * @param orders         Orders
     * @param methodOpts    Optional arguments this method accepts.
     * @returns Array of Order infos
     */
    @decorators.asyncZeroExErrorHandler
    public async getOrdersInfoAsync(
        orders: Array<Order | SignedOrder>,
        methodOpts: MethodOpts = {},
    ): Promise<OrderInfo[]> {
        assert.doesConformToSchema('orders', orders, schemas.ordersSchema);
        if (methodOpts !== undefined) {
            assert.doesConformToSchema('methodOpts', methodOpts, methodOptsSchema);
        }
        const callData = {};
        const ordersInfo = await this._exchangeContract.getOrdersInfo.callAsync(
            orders,
            callData,
            methodOpts.defaultBlock,
        );
        return ordersInfo;
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
        await assert.isSenderAddressAsync('order.maker', order.makerAddress, this._web3Wrapper);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        const normalizedMakerAddress = order.makerAddress.toLowerCase();

        if (orderTransactionOpts.shouldValidate) {
            await this._exchangeContract.cancelOrder.callAsync(order, {
                from: normalizedMakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            });
        }
        const txHash = await this._exchangeContract.cancelOrder.sendTransactionAsync(order, {
            from: normalizedMakerAddress,
            gas: orderTransactionOpts.gasLimit,
            gasPrice: orderTransactionOpts.gasPrice,
            nonce: orderTransactionOpts.nonce,
        });
        return txHash;
    }
    /**
     * Sets the signature validator approval
     * @param   validatorAddress        Validator contract address.
     * @param   isApproved              Boolean value to set approval to.
     * @param   senderAddress           Sender address.
     * @param   orderTransactionOpts    Optional arguments this method accepts.
     * @return  Transaction hash.
     */
    @decorators.asyncZeroExErrorHandler
    public async setSignatureValidatorApprovalAsync(
        validatorAddress: string,
        isApproved: boolean,
        senderAddress: string,
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.isETHAddressHex('validatorAddress', validatorAddress);
        assert.isBoolean('isApproved', isApproved);
        await assert.isSenderAddressAsync('senderAddress', senderAddress, this._web3Wrapper);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        const normalizedSenderAddress = senderAddress.toLowerCase();

        if (orderTransactionOpts.shouldValidate) {
            await this._exchangeContract.setSignatureValidatorApproval.callAsync(validatorAddress, isApproved, {
                from: normalizedSenderAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            });
        }
        const txHash = await this._exchangeContract.setSignatureValidatorApproval.sendTransactionAsync(
            validatorAddress,
            isApproved,
            {
                from: normalizedSenderAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            },
        );
        return txHash;
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
        orderTransactionOpts: OrderTransactionOpts = { shouldValidate: true },
    ): Promise<string> {
        assert.isBigNumber('targetOrderEpoch', targetOrderEpoch);
        await assert.isSenderAddressAsync('senderAddress', senderAddress, this._web3Wrapper);
        assert.doesConformToSchema('orderTransactionOpts', orderTransactionOpts, orderTxOptsSchema, [txOptsSchema]);
        const normalizedSenderAddress = senderAddress.toLowerCase();

        if (orderTransactionOpts.shouldValidate) {
            await this._exchangeContract.cancelOrdersUpTo.callAsync(targetOrderEpoch, {
                from: normalizedSenderAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
                nonce: orderTransactionOpts.nonce,
            });
        }
        const txHash = await this._exchangeContract.cancelOrdersUpTo.sendTransactionAsync(targetOrderEpoch, {
            from: normalizedSenderAddress,
            gas: orderTransactionOpts.gasLimit,
            gasPrice: orderTransactionOpts.gasPrice,
            nonce: orderTransactionOpts.nonce,
        });
        return txHash;
    }
    /**
     * Subscribe to an event type emitted by the Exchange contract.
     * @param   eventName           The exchange contract event you would like to subscribe to.
     * @param   indexFilterValues   An object where the keys are indexed args returned by the event and
     *                              the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param   callback            Callback that gets called when a log is added/removed
     * @param   isVerbose           Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends ExchangeEventArgs>(
        eventName: ExchangeEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
        isVerbose: boolean = false,
    ): string {
        assert.doesBelongToStringEnum('eventName', eventName, ExchangeEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const subscriptionToken = this._exchangeContract.subscribe<ArgsType>(
            eventName,
            indexFilterValues,
            callback,
            isVerbose,
            this._blockPollingIntervalMs,
        );
        return subscriptionToken;
    }
    /**
     * Cancel a subscription
     * @param   subscriptionToken Subscription token returned by `subscribe()`
     */
    public unsubscribe(subscriptionToken: string): void {
        this._exchangeContract.unsubscribe(subscriptionToken);
    }
    /**
     * Cancels all existing subscriptions
     */
    public unsubscribeAll(): void {
        this._exchangeContract.unsubscribeAll();
    }
    /**
     * Gets historical logs without creating a subscription
     * @param   eventName           The exchange contract event you would like to subscribe to.
     * @param   blockRange          Block range to get logs from.
     * @param   indexFilterValues   An object where the keys are indexed args returned by the event and
     *                              the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return  Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends ExchangeEventArgs>(
        eventName: ExchangeEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.doesBelongToStringEnum('eventName', eventName, ExchangeEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const logs = await this._exchangeContract.getLogsAsync<ArgsType>(eventName, blockRange, indexFilterValues);
        return logs;
    }
    /**
     * Validate if the supplied order is fillable, and throw if it isn't
     * @param signedOrder SignedOrder of interest
     * @param opts ValidateOrderFillableOpts options (e.g expectedFillTakerTokenAmount.
     * If it isn't supplied, we check if the order is fillable for the remaining amount.
     * To check if the order is fillable for a non-zero amount, set `validateRemainingOrderAmountIsFillable` to false.)
     */
    public async validateOrderFillableOrThrowAsync(
        signedOrder: SignedOrder,
        opts: ValidateOrderFillableOpts = {},
    ): Promise<void> {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        assert.doesConformToSchema('opts', opts, validateOrderFillableOptsSchema);

        const balanceAllowanceFetcher = new AssetBalanceAndProxyAllowanceFetcher(
            this._erc20TokenWrapper,
            this._erc721TokenWrapper,
            BlockParamLiteral.Latest,
        );
        const balanceAllowanceStore = new BalanceAndProxyAllowanceLazyStore(balanceAllowanceFetcher);
        const exchangeTradeSimulator = new ExchangeTransferSimulator(balanceAllowanceStore);
        const filledCancelledFetcher = new OrderFilledCancelledFetcher(this, BlockParamLiteral.Latest);

        let fillableTakerAssetAmount;
        const shouldValidateRemainingOrderAmountIsFillable =
            opts.validateRemainingOrderAmountIsFillable === undefined
                ? true
                : opts.validateRemainingOrderAmountIsFillable;
        if (opts.expectedFillTakerTokenAmount) {
            // If the caller has specified a taker fill amount, we use this for all validation
            fillableTakerAssetAmount = opts.expectedFillTakerTokenAmount;
        } else if (shouldValidateRemainingOrderAmountIsFillable) {
            // Default behaviour is to validate the amount left on the order.
            const filledTakerTokenAmount = await this.getFilledTakerAssetAmountAsync(
                orderHashUtils.getOrderHashHex(signedOrder),
            );
            fillableTakerAssetAmount = signedOrder.takerAssetAmount.minus(filledTakerTokenAmount);
        } else {
            const orderStateUtils = new OrderStateUtils(balanceAllowanceStore, filledCancelledFetcher);
            // Calculate the taker amount fillable given the maker balance and allowance
            const orderRelevantState = await orderStateUtils.getOpenOrderRelevantStateAsync(signedOrder);
            fillableTakerAssetAmount = orderRelevantState.remainingFillableTakerAssetAmount;
        }

        const orderValidationUtils = new OrderValidationUtils(filledCancelledFetcher, this._web3Wrapper.getProvider());
        await orderValidationUtils.validateOrderFillableOrThrowAsync(
            exchangeTradeSimulator,
            signedOrder,
            this.getZRXAssetData(),
            fillableTakerAssetAmount,
        );
        const makerTransferAmount = orderCalculationUtils.getMakerFillAmount(signedOrder, fillableTakerAssetAmount);
        await this.validateMakerTransferThrowIfInvalidAsync(
            signedOrder,
            makerTransferAmount,
            opts.simulationTakerAddress,
        );
    }
    /**
     * Validate the transfer from the maker to the taker. This is simulated on-chain
     * via an eth_call. If this call fails, the asset is currently nontransferable.
     * @param signedOrder SignedOrder of interest
     * @param makerAssetAmount Amount to transfer from the maker
     * @param takerAddress The address to transfer to, defaults to signedOrder.takerAddress
     */
    public async validateMakerTransferThrowIfInvalidAsync(
        signedOrder: SignedOrder,
        makerAssetAmount: BigNumber,
        takerAddress?: string,
    ): Promise<void> {
        const networkId = await this._web3Wrapper.getNetworkIdAsync();
        await OrderValidationUtils.validateMakerTransferThrowIfInvalidAsync(
            networkId,
            this._web3Wrapper.getProvider(),
            signedOrder,
            makerAssetAmount,
            takerAddress,
        );
    }
    /**
     * Validate a call to FillOrder and throw if it wouldn't succeed
     * @param signedOrder SignedOrder of interest
     * @param fillTakerAssetAmount Amount we'd like to fill the order for
     * @param takerAddress The taker of the order
     */
    public async validateFillOrderThrowIfInvalidAsync(
        signedOrder: SignedOrder,
        fillTakerAssetAmount: BigNumber,
        takerAddress: string,
    ): Promise<void> {
        const balanceAllowanceFetcher = new AssetBalanceAndProxyAllowanceFetcher(
            this._erc20TokenWrapper,
            this._erc721TokenWrapper,
            BlockParamLiteral.Latest,
        );
        const balanceAllowanceStore = new BalanceAndProxyAllowanceLazyStore(balanceAllowanceFetcher);
        const exchangeTradeSimulator = new ExchangeTransferSimulator(balanceAllowanceStore);

        const filledCancelledFetcher = new OrderFilledCancelledFetcher(this, BlockParamLiteral.Latest);
        const orderValidationUtils = new OrderValidationUtils(filledCancelledFetcher, this._web3Wrapper.getProvider());
        await orderValidationUtils.validateFillOrderThrowIfInvalidAsync(
            exchangeTradeSimulator,
            this._web3Wrapper.getProvider(),
            signedOrder,
            fillTakerAssetAmount,
            takerAddress,
            this.getZRXAssetData(),
        );
    }
    /**
     * Returns the ZRX asset data used by the exchange contract.
     * @return ZRX asset data
     */
    public getZRXAssetData(): string {
        const zrxAssetData = assetDataUtils.encodeERC20AssetData(this.zrxTokenAddress);
        return zrxAssetData;
    }
    /**
     * Returns a Transaction Encoder. Transaction messages exist for the purpose of calling methods on the Exchange contract
     * in the context of another address.
     * @return TransactionEncoder
     */
    public async transactionEncoderAsync(): Promise<TransactionEncoder> {
        const encoder = new TransactionEncoder(this._exchangeContract);
        return encoder;
    }
} // tslint:disable:max-file-line-count
