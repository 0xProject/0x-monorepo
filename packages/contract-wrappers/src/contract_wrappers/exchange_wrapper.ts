import { artifacts, wrappers } from '@0xproject/contracts';
import { schemas } from '@0xproject/json-schemas';
import {
    assetDataUtils,
    BalanceAndProxyAllowanceLazyStore,
    ExchangeTransferSimulator,
    OrderValidationUtils,
} from '@0xproject/order-utils';
import { AssetProxyId, Order, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { BlockParamLiteral, ContractAbi, LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { AssetBalanceAndProxyAllowanceFetcher } from '../fetchers/asset_balance_and_proxy_allowance_fetcher';
import { OrderFilledCancelledFetcher } from '../fetchers/order_filled_cancelled_fetcher';
import { methodOptsSchema } from '../schemas/method_opts_schema';
import { orderTxOptsSchema } from '../schemas/order_tx_opts_schema';
import { txOptsSchema } from '../schemas/tx_opts_schema';
import {
    BlockRange,
    EventCallback,
    ExchangeWrapperError,
    IndexedFilterValues,
    MethodOpts,
    OrderInfo,
    OrderStatus,
    OrderTransactionOpts,
    ValidateOrderFillableOpts,
} from '../types';
import { assert } from '../utils/assert';
import { decorators } from '../utils/decorators';
import { TransactionEncoder } from '../utils/transaction_encoder';

import { ContractWrapper } from './contract_wrapper';
import { ERC20TokenWrapper } from './erc20_token_wrapper';
import { ERC721TokenWrapper } from './erc721_token_wrapper';

/**
 * This class includes all the functionality related to calling methods, sending transactions and subscribing to
 * events of the 0x V2 Exchange smart contract.
 */
export class ExchangeWrapper extends ContractWrapper {
    public abi: ContractAbi = artifacts.Exchange.compilerOutput.abi;
    private _exchangeContractIfExists?: wrappers.ExchangeContract;
    private _erc721TokenWrapper: ERC721TokenWrapper;
    private _erc20TokenWrapper: ERC20TokenWrapper;
    private _contractAddressIfExists?: string;
    private _zrxContractAddressIfExists?: string;
    /**
     * Instantiate ExchangeWrapper
     * @param web3Wrapper Web3Wrapper instance to use
     * @param networkId Desired networkId
     * @param contractAddressIfExists The exchange contract address to use. This is usually pulled from
     * the artifacts but needs to be specified when using with your own custom testnet.
     * @param zrxContractAddressIfExists The ZRXToken contract address to use. This is usually pulled from
     * the artifacts but needs to be specified when using with your own custom testnet.
     * @param blockPollingIntervalMs The block polling interval to use for active subscriptions
     */
    constructor(
        web3Wrapper: Web3Wrapper,
        networkId: number,
        erc20TokenWrapper: ERC20TokenWrapper,
        erc721TokenWrapper: ERC721TokenWrapper,
        contractAddressIfExists?: string,
        zrxContractAddressIfExists?: string,
        blockPollingIntervalMs?: number,
    ) {
        super(web3Wrapper, networkId, blockPollingIntervalMs);
        this._erc20TokenWrapper = erc20TokenWrapper;
        this._erc721TokenWrapper = erc721TokenWrapper;
        this._contractAddressIfExists = contractAddressIfExists;
        this._zrxContractAddressIfExists = zrxContractAddressIfExists;
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
        const exchangeContract = await this._getExchangeContractAsync();

        const txData = {};
        const assetProxy = await exchangeContract.getAssetProxy.callAsync(proxyId, txData, methodOpts.defaultBlock);
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
        const exchangeContract = await this._getExchangeContractAsync();

        const txData = {};
        const filledTakerAssetAmountInBaseUnits = await exchangeContract.filled.callAsync(
            orderHash,
            txData,
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
        const exchangeContract = await this._getExchangeContractAsync();

        const txData = {};
        const version = await exchangeContract.VERSION.callAsync(txData, methodOpts.defaultBlock);
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
        const exchangeContract = await this._getExchangeContractAsync();

        const txData = {};
        const orderEpoch = await exchangeContract.orderEpoch.callAsync(
            makerAddress,
            senderAddress,
            txData,
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
        const exchangeContract = await this._getExchangeContractAsync();

        const txData = {};
        const isCancelled = await exchangeContract.cancelled.callAsync(orderHash, txData, methodOpts.defaultBlock);
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

        const exchangeInstance = await this._getExchangeContractAsync();
        if (orderTransactionOpts.shouldValidate) {
            await exchangeInstance.fillOrder.callAsync(signedOrder, takerAssetFillAmount, signedOrder.signature, {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
            });
        }

        const txHash = await exchangeInstance.fillOrder.sendTransactionAsync(
            signedOrder,
            takerAssetFillAmount,
            signedOrder.signature,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
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

        const exchangeInstance = await this._getExchangeContractAsync();
        if (orderTransactionOpts.shouldValidate) {
            await exchangeInstance.fillOrderNoThrow.callAsync(
                signedOrder,
                takerAssetFillAmount,
                signedOrder.signature,
                {
                    from: normalizedTakerAddress,
                    gas: orderTransactionOpts.gasLimit,
                    gasPrice: orderTransactionOpts.gasPrice,
                },
            );
        }
        const txHash = await exchangeInstance.fillOrderNoThrow.sendTransactionAsync(
            signedOrder,
            takerAssetFillAmount,
            signedOrder.signature,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
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

        const exchangeInstance = await this._getExchangeContractAsync();
        if (orderTransactionOpts.shouldValidate) {
            await exchangeInstance.fillOrKillOrder.callAsync(signedOrder, takerAssetFillAmount, signedOrder.signature, {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
            });
        }
        const txHash = await exchangeInstance.fillOrKillOrder.sendTransactionAsync(
            signedOrder,
            takerAssetFillAmount,
            signedOrder.signature,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
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

        const exchangeInstance = await this._getExchangeContractAsync();
        if (orderTransactionOpts.shouldValidate) {
            await exchangeInstance.executeTransaction.callAsync(salt, signerAddress, data, signature, {
                from: normalizedSenderAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
            });
        }
        const txHash = await exchangeInstance.executeTransaction.sendTransactionAsync(
            salt,
            signerAddress,
            data,
            signature,
            {
                from: normalizedSenderAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
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

        const exchangeInstance = await this._getExchangeContractAsync();
        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        if (orderTransactionOpts.shouldValidate) {
            await exchangeInstance.batchFillOrders.callAsync(signedOrders, takerAssetFillAmounts, signatures, {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
            });
        }
        const txHash = await exchangeInstance.batchFillOrders.sendTransactionAsync(
            signedOrders,
            takerAssetFillAmounts,
            signatures,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
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

        const exchangeInstance = await this._getExchangeContractAsync();
        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        if (orderTransactionOpts.shouldValidate) {
            await exchangeInstance.marketBuyOrders.callAsync(signedOrders, makerAssetFillAmount, signatures, {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
            });
        }
        const txHash = await exchangeInstance.marketBuyOrders.sendTransactionAsync(
            signedOrders,
            makerAssetFillAmount,
            signatures,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
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

        const exchangeInstance = await this._getExchangeContractAsync();
        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        if (orderTransactionOpts.shouldValidate) {
            await exchangeInstance.marketSellOrders.callAsync(signedOrders, takerAssetFillAmount, signatures, {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
            });
        }
        const txHash = await exchangeInstance.marketSellOrders.sendTransactionAsync(
            signedOrders,
            takerAssetFillAmount,
            signatures,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
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

        const exchangeInstance = await this._getExchangeContractAsync();
        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        if (orderTransactionOpts.shouldValidate) {
            await exchangeInstance.marketBuyOrdersNoThrow.callAsync(signedOrders, makerAssetFillAmount, signatures, {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
            });
        }
        const txHash = await exchangeInstance.marketBuyOrdersNoThrow.sendTransactionAsync(
            signedOrders,
            makerAssetFillAmount,
            signatures,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
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

        const exchangeInstance = await this._getExchangeContractAsync();
        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        if (orderTransactionOpts.shouldValidate) {
            await exchangeInstance.marketSellOrdersNoThrow.callAsync(signedOrders, takerAssetFillAmount, signatures, {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
            });
        }
        const txHash = await exchangeInstance.marketSellOrdersNoThrow.sendTransactionAsync(
            signedOrders,
            takerAssetFillAmount,
            signatures,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
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

        const exchangeInstance = await this._getExchangeContractAsync();
        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        if (orderTransactionOpts.shouldValidate) {
            await exchangeInstance.batchFillOrdersNoThrow.callAsync(signedOrders, takerAssetFillAmounts, signatures, {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
            });
        }
        const txHash = await exchangeInstance.batchFillOrdersNoThrow.sendTransactionAsync(
            signedOrders,
            takerAssetFillAmounts,
            signatures,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
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

        const exchangeInstance = await this._getExchangeContractAsync();
        const signatures = _.map(signedOrders, signedOrder => signedOrder.signature);
        if (orderTransactionOpts.shouldValidate) {
            await exchangeInstance.batchFillOrKillOrders.callAsync(signedOrders, takerAssetFillAmounts, signatures, {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
            });
        }
        const txHash = await exchangeInstance.batchFillOrKillOrders.sendTransactionAsync(
            signedOrders,
            takerAssetFillAmounts,
            signatures,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
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

        const exchangeInstance = await this._getExchangeContractAsync();
        if (orderTransactionOpts.shouldValidate) {
            await exchangeInstance.batchCancelOrders.callAsync(orders, {
                from: normalizedMakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
            });
        }
        const txHash = await exchangeInstance.batchCancelOrders.sendTransactionAsync(orders, {
            from: normalizedMakerAddress,
            gas: orderTransactionOpts.gasLimit,
            gasPrice: orderTransactionOpts.gasPrice,
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
        } else {
            // Smart contracts assigns the asset data from the left order to the right one so we can save gas on reducing the size of call data
            rightSignedOrder.makerAssetData = '0x';
            rightSignedOrder.takerAssetData = '0x';
        }
        const exchangeInstance = await this._getExchangeContractAsync();
        if (orderTransactionOpts.shouldValidate) {
            await exchangeInstance.matchOrders.callAsync(
                leftSignedOrder,
                rightSignedOrder,
                leftSignedOrder.signature,
                rightSignedOrder.signature,
                {
                    from: normalizedTakerAddress,
                    gas: orderTransactionOpts.gasLimit,
                    gasPrice: orderTransactionOpts.gasPrice,
                },
            );
        }
        const txHash = await exchangeInstance.matchOrders.sendTransactionAsync(
            leftSignedOrder,
            rightSignedOrder,
            leftSignedOrder.signature,
            rightSignedOrder.signature,
            {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
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
        const exchangeInstance = await this._getExchangeContractAsync();
        if (orderTransactionOpts.shouldValidate) {
            await exchangeInstance.preSign.callAsync(hash, signerAddress, signature, {
                from: normalizedTakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
            });
        }
        const txHash = await exchangeInstance.preSign.sendTransactionAsync(hash, signerAddress, signature, {
            from: normalizedTakerAddress,
            gas: orderTransactionOpts.gasLimit,
            gasPrice: orderTransactionOpts.gasPrice,
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
        const exchangeInstance = await this._getExchangeContractAsync();
        const txData = {};
        const isValidSignature = await exchangeInstance.isValidSignature.callAsync(
            hash,
            signerAddress,
            signature,
            txData,
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
        if (!_.isUndefined(methodOpts)) {
            assert.doesConformToSchema('methodOpts', methodOpts, methodOptsSchema);
        }
        const normalizedSignerAddress = signerAddress.toLowerCase();
        const normalizedValidatorAddress = validatorAddress.toLowerCase();
        const exchangeInstance = await this._getExchangeContractAsync();
        const txData = {};
        const isValidSignature = await exchangeInstance.allowedValidators.callAsync(
            normalizedSignerAddress,
            normalizedValidatorAddress,
            txData,
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
        if (!_.isUndefined(methodOpts)) {
            assert.doesConformToSchema('methodOpts', methodOpts, methodOptsSchema);
        }
        const exchangeInstance = await this._getExchangeContractAsync();

        const txData = {};
        const isPreSigned = await exchangeInstance.preSigned.callAsync(
            hash,
            signerAddress,
            txData,
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
        if (!_.isUndefined(methodOpts)) {
            assert.doesConformToSchema('methodOpts', methodOpts, methodOptsSchema);
        }
        const exchangeInstance = await this._getExchangeContractAsync();
        const txData = {};
        const isExecuted = await exchangeInstance.transactions.callAsync(
            transactionHash,
            txData,
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
        if (!_.isUndefined(methodOpts)) {
            assert.doesConformToSchema('methodOpts', methodOpts, methodOptsSchema);
        }
        const exchangeInstance = await this._getExchangeContractAsync();
        const txData = {};
        const orderInfo = await exchangeInstance.getOrderInfo.callAsync(order, txData, methodOpts.defaultBlock);
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
        if (!_.isUndefined(methodOpts)) {
            assert.doesConformToSchema('methodOpts', methodOpts, methodOptsSchema);
        }
        const exchangeInstance = await this._getExchangeContractAsync();
        const txData = {};
        const ordersInfo = await exchangeInstance.getOrdersInfo.callAsync(orders, txData, methodOpts.defaultBlock);
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

        const exchangeInstance = await this._getExchangeContractAsync();
        if (orderTransactionOpts.shouldValidate) {
            await exchangeInstance.cancelOrder.callAsync(order, {
                from: normalizedMakerAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
            });
        }
        const txHash = await exchangeInstance.cancelOrder.sendTransactionAsync(order, {
            from: normalizedMakerAddress,
            gas: orderTransactionOpts.gasLimit,
            gasPrice: orderTransactionOpts.gasPrice,
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

        const exchangeInstance = await this._getExchangeContractAsync();
        if (orderTransactionOpts.shouldValidate) {
            await exchangeInstance.setSignatureValidatorApproval.callAsync(validatorAddress, isApproved, {
                from: normalizedSenderAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
            });
        }
        const txHash = await exchangeInstance.setSignatureValidatorApproval.sendTransactionAsync(
            validatorAddress,
            isApproved,
            {
                from: normalizedSenderAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
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

        const exchangeInstance = await this._getExchangeContractAsync();
        if (orderTransactionOpts.shouldValidate) {
            await exchangeInstance.cancelOrdersUpTo.callAsync(targetOrderEpoch, {
                from: normalizedSenderAddress,
                gas: orderTransactionOpts.gasLimit,
                gasPrice: orderTransactionOpts.gasPrice,
            });
        }
        const txHash = await exchangeInstance.cancelOrdersUpTo.sendTransactionAsync(targetOrderEpoch, {
            from: normalizedSenderAddress,
            gas: orderTransactionOpts.gasLimit,
            gasPrice: orderTransactionOpts.gasPrice,
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
    public subscribe<ArgsType extends wrappers.ExchangeEventArgs>(
        eventName: wrappers.ExchangeEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
        isVerbose: boolean = false,
    ): string {
        assert.doesBelongToStringEnum('eventName', eventName, wrappers.ExchangeEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const exchangeContractAddress = this.getContractAddress();
        const subscriptionToken = this._subscribe<ArgsType>(
            exchangeContractAddress,
            eventName,
            indexFilterValues,
            artifacts.Exchange.compilerOutput.abi,
            callback,
            isVerbose,
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
        super._unsubscribeAll();
    }
    /**
     * Gets historical logs without creating a subscription
     * @param   eventName           The exchange contract event you would like to subscribe to.
     * @param   blockRange          Block range to get logs from.
     * @param   indexFilterValues   An object where the keys are indexed args returned by the event and
     *                              the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return  Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends wrappers.ExchangeEventArgs>(
        eventName: wrappers.ExchangeEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.doesBelongToStringEnum('eventName', eventName, wrappers.ExchangeEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const exchangeContractAddress = this.getContractAddress();
        const logs = await this._getLogsAsync<ArgsType>(
            exchangeContractAddress,
            eventName,
            blockRange,
            indexFilterValues,
            artifacts.Exchange.compilerOutput.abi,
        );
        return logs;
    }
    /**
     * Validate if the supplied order is fillable, and throw if it isn't
     * @param signedOrder SignedOrder of interest
     * @param opts ValidateOrderFillableOpts options (e.g expectedFillTakerTokenAmount.
     * If it isn't supplied, we check if the order is fillable for a non-zero amount)
     */
    public async validateOrderFillableOrThrowAsync(
        signedOrder: SignedOrder,
        opts: ValidateOrderFillableOpts = {},
    ): Promise<void> {
        const balanceAllowanceFetcher = new AssetBalanceAndProxyAllowanceFetcher(
            this._erc20TokenWrapper,
            this._erc721TokenWrapper,
            BlockParamLiteral.Latest,
        );
        const balanceAllowanceStore = new BalanceAndProxyAllowanceLazyStore(balanceAllowanceFetcher);
        const exchangeTradeSimulator = new ExchangeTransferSimulator(balanceAllowanceStore);

        const expectedFillTakerTokenAmountIfExists = opts.expectedFillTakerTokenAmount;
        const filledCancelledFetcher = new OrderFilledCancelledFetcher(this, BlockParamLiteral.Latest);
        const orderValidationUtils = new OrderValidationUtils(filledCancelledFetcher);
        await orderValidationUtils.validateOrderFillableOrThrowAsync(
            exchangeTradeSimulator,
            signedOrder,
            this.getZRXAssetData(),
            expectedFillTakerTokenAmountIfExists,
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
        const orderValidationUtils = new OrderValidationUtils(filledCancelledFetcher);
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
     * Retrieves the Ethereum address of the Exchange contract deployed on the network
     * that the user-passed web3 provider is connected to.
     * @returns The Ethereum address of the Exchange contract being used.
     */
    public getContractAddress(): string {
        const contractAddress = this._getContractAddress(artifacts.Exchange, this._contractAddressIfExists);
        return contractAddress;
    }
    /**
     * Returns the ZRX token address used by the exchange contract.
     * @return Address of ZRX token
     */
    public getZRXTokenAddress(): string {
        const contractAddress = this._getContractAddress(artifacts.ZRXToken, this._zrxContractAddressIfExists);
        return contractAddress;
    }
    /**
     * Returns the ZRX asset data used by the exchange contract.
     * @return ZRX asset data
     */
    public getZRXAssetData(): string {
        const zrxTokenAddress = this.getZRXTokenAddress();
        const zrxAssetData = assetDataUtils.encodeERC20AssetData(zrxTokenAddress);
        return zrxAssetData;
    }
    /**
     * Returns a Transaction Encoder. Transaction messages exist for the purpose of calling methods on the Exchange contract
     * in the context of another address.
     * @return TransactionEncoder
     */
    public async transactionEncoderAsync(): Promise<TransactionEncoder> {
        const exchangeInstance = await this._getExchangeContractAsync();
        const encoder = new TransactionEncoder(exchangeInstance);
        return encoder;
    }
    // tslint:disable:no-unused-variable
    private _invalidateContractInstances(): void {
        this.unsubscribeAll();
        delete this._exchangeContractIfExists;
    }
    // tslint:enable:no-unused-variable
    private async _getExchangeContractAsync(): Promise<wrappers.ExchangeContract> {
        if (!_.isUndefined(this._exchangeContractIfExists)) {
            return this._exchangeContractIfExists;
        }
        const [abi, address] = await this._getContractAbiAndAddressFromArtifactsAsync(
            artifacts.Exchange,
            this._contractAddressIfExists,
        );
        const contractInstance = new wrappers.ExchangeContract(
            abi,
            address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        this._exchangeContractIfExists = contractInstance;
        return this._exchangeContractIfExists;
    }
} // tslint:disable:max-file-line-count
