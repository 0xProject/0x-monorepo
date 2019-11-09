import { ContractError, ContractWrappers, ForwarderError } from '@0x/contract-wrappers';
import { schemas } from '@0x/json-schemas';
import { assetDataUtils, SignedOrder } from '@0x/order-utils';
import { ObjectMap } from '@0x/types';
import { BigNumber, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { SupportedProvider, ZeroExProvider } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from './constants';
import { BasicOrderProvider } from './order_providers/basic_order_provider';
import { StandardRelayerAPIOrderProvider } from './order_providers/standard_relayer_api_order_provider';
import {
    AssetBuyerError,
    AssetBuyerOpts,
    BuyQuote,
    BuyQuoteExecutionOpts,
    BuyQuoteRequestOpts,
    LiquidityForAssetData,
    LiquidityRequestOpts,
    OrderProvider,
    OrdersAndFillableAmounts,
} from './types';
import { assert } from './utils/assert';
import { buyQuoteCalculator } from './utils/buy_quote_calculator';
import { calculateLiquidity } from './utils/calculate_liquidity';
import { numberPercentageToEtherTokenAmountPercentage } from './utils/number_percentage_to_ethertoken_amount_percentage';
import { orderProviderResponseProcessor } from './utils/order_provider_response_processor';

interface OrdersEntry {
    ordersAndFillableAmounts: OrdersAndFillableAmounts;
    lastRefreshTime: number;
}

export class AssetBuyer {
    public readonly provider: ZeroExProvider;
    public readonly orderProvider: OrderProvider;
    public readonly chainId: number;
    public readonly orderRefreshIntervalMs: number;
    public readonly expiryBufferSeconds: number;
    private readonly _contractWrappers: ContractWrappers;
    // cache of orders along with the time last updated keyed by assetData
    private readonly _ordersEntryMap: ObjectMap<OrdersEntry> = {};
    /**
     * Instantiates a new AssetBuyer instance given existing liquidity in the form of orders and feeOrders.
     * @param   supportedProvider       The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   orders                  A non-empty array of objects that conform to SignedOrder. All orders must have the same makerAssetData and takerAssetData (WETH).
     * @param   feeOrders               A array of objects that conform to SignedOrder. All orders must have the same makerAssetData (ZRX) and takerAssetData (WETH). Defaults to an empty array.
     * @param   options                 Initialization options for the AssetBuyer. See type definition for details.
     *
     * @return  An instance of AssetBuyer
     */
    public static getAssetBuyerForProvidedOrders(
        supportedProvider: SupportedProvider,
        orders: SignedOrder[],
        options: Partial<AssetBuyerOpts> = {},
    ): AssetBuyer {
        assert.doesConformToSchema('orders', orders, schemas.signedOrdersSchema);
        assert.assert(orders.length !== 0, `Expected orders to contain at least one order`);
        const orderProvider = new BasicOrderProvider(orders);
        const assetBuyer = new AssetBuyer(supportedProvider, orderProvider, options);
        return assetBuyer;
    }
    /**
     * Instantiates a new AssetBuyer instance given a [Standard Relayer API](https://github.com/0xProject/standard-relayer-api) endpoint
     * @param   supportedProvider       The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   sraApiUrl               The standard relayer API base HTTP url you would like to source orders from.
     * @param   options                 Initialization options for the AssetBuyer. See type definition for details.
     *
     * @return  An instance of AssetBuyer
     */
    public static getAssetBuyerForStandardRelayerAPIUrl(
        supportedProvider: SupportedProvider,
        sraApiUrl: string,
        options: Partial<AssetBuyerOpts> = {},
    ): AssetBuyer {
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        assert.isWebUri('sraApiUrl', sraApiUrl);
        const chainId = options.chainId || constants.DEFAULT_ASSET_BUYER_OPTS.chainId;
        // HACK: asset-buy will be deleted, but do not pass in chainId to allow everything to compile.
        const orderProvider = new StandardRelayerAPIOrderProvider(sraApiUrl);
        const assetBuyer = new AssetBuyer(provider, orderProvider, options);
        return assetBuyer;
    }
    /**
     * Instantiates a new AssetBuyer instance
     * @param   supportedProvider   The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   orderProvider       An object that conforms to OrderProvider, see type for definition.
     * @param   options             Initialization options for the AssetBuyer. See type definition for details.
     *
     * @return  An instance of AssetBuyer
     */
    constructor(
        supportedProvider: SupportedProvider,
        orderProvider: OrderProvider,
        options: Partial<AssetBuyerOpts> = {},
    ) {
        const { chainId, orderRefreshIntervalMs, expiryBufferSeconds } = _.merge(
            {},
            constants.DEFAULT_ASSET_BUYER_OPTS,
            options,
        );
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        assert.isValidOrderProvider('orderProvider', orderProvider);
        assert.isNumber('chainId', chainId);
        assert.isNumber('orderRefreshIntervalMs', orderRefreshIntervalMs);
        assert.isNumber('expiryBufferSeconds', expiryBufferSeconds);
        this.provider = provider;
        this.orderProvider = orderProvider;
        this.chainId = chainId;
        this.orderRefreshIntervalMs = orderRefreshIntervalMs;
        this.expiryBufferSeconds = expiryBufferSeconds;
        this._contractWrappers = new ContractWrappers(this.provider, {
            chainId,
        });
    }
    /**
     * Get a `BuyQuote` containing all information relevant to fulfilling a buy given a desired assetData.
     * You can then pass the `BuyQuote` to `executeBuyQuoteAsync` to execute the buy.
     * @param   assetData           The assetData of the desired asset to buy (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   assetBuyAmount      The amount of asset to buy.
     * @param   options             Options for the request. See type definition for more information.
     *
     * @return  An object that conforms to BuyQuote that satisfies the request. See type definition for more information.
     */
    public async getBuyQuoteAsync(
        assetData: string,
        assetBuyAmount: BigNumber,
        options: Partial<BuyQuoteRequestOpts> = {},
    ): Promise<BuyQuote> {
        const { feePercentage, shouldForceOrderRefresh, slippagePercentage } = _.merge(
            {},
            constants.DEFAULT_BUY_QUOTE_REQUEST_OPTS,
            options,
        );
        assert.isString('assetData', assetData);
        assert.isBigNumber('assetBuyAmount', assetBuyAmount);
        assert.isValidPercentage('feePercentage', feePercentage);
        assert.isBoolean('shouldForceOrderRefresh', shouldForceOrderRefresh);
        assert.isNumber('slippagePercentage', slippagePercentage);
        const zrxTokenAssetData = await this._getZrxTokenAssetDataOrThrowAsync();
        const isMakerAssetZrxToken = assetData === zrxTokenAssetData;
        // get the relevant orders for the makerAsset and fees
        // if the requested assetData is ZRX, don't get the fee info
        const [ordersAndFillableAmounts, feeOrdersAndFillableAmounts] = await Promise.all([
            this.getOrdersAndFillableAmountsAsync(assetData, shouldForceOrderRefresh),
            isMakerAssetZrxToken
                ? Promise.resolve(constants.EMPTY_ORDERS_AND_FILLABLE_AMOUNTS)
                : this.getOrdersAndFillableAmountsAsync(zrxTokenAssetData, shouldForceOrderRefresh),
            shouldForceOrderRefresh,
        ]);
        if (ordersAndFillableAmounts.orders.length === 0) {
            throw new Error(`${AssetBuyerError.AssetUnavailable}: For assetData ${assetData}`);
        }
        const buyQuote = buyQuoteCalculator.calculate(
            ordersAndFillableAmounts,
            feeOrdersAndFillableAmounts,
            assetBuyAmount,
            feePercentage,
            slippagePercentage,
            isMakerAssetZrxToken,
        );
        return buyQuote;
    }
    /**
     * Get a `BuyQuote` containing all information relevant to fulfilling a buy given a desired ERC20 token address.
     * You can then pass the `BuyQuote` to `executeBuyQuoteAsync` to execute the buy.
     * @param   tokenAddress        The ERC20 token address.
     * @param   assetBuyAmount      The amount of asset to buy.
     * @param   options             Options for the request. See type definition for more information.
     *
     * @return  An object that conforms to BuyQuote that satisfies the request. See type definition for more information.
     */
    public async getBuyQuoteForERC20TokenAddressAsync(
        tokenAddress: string,
        assetBuyAmount: BigNumber,
        options: Partial<BuyQuoteRequestOpts> = {},
    ): Promise<BuyQuote> {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.isBigNumber('assetBuyAmount', assetBuyAmount);
        const assetData = await this._contractWrappers.devUtils.encodeERC20AssetData.callAsync(tokenAddress);
        const buyQuote = this.getBuyQuoteAsync(assetData, assetBuyAmount, options);
        return buyQuote;
    }
    /**
     * Returns information about available liquidity for an asset
     * Does not factor in slippage or fees
     * @param   assetData           The assetData of the desired asset to buy (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   options             Options for the request. See type definition for more information.
     *
     * @return  An object that conforms to LiquidityForAssetData that satisfies the request. See type definition for more information.
     */
    public async getLiquidityForAssetDataAsync(
        assetData: string,
        options: Partial<LiquidityRequestOpts> = {},
    ): Promise<LiquidityForAssetData> {
        const shouldForceOrderRefresh =
            options.shouldForceOrderRefresh !== undefined ? options.shouldForceOrderRefresh : false;
        assert.isString('assetData', assetData);
        assetDataUtils.decodeAssetDataOrThrow(assetData);
        assert.isBoolean('options.shouldForceOrderRefresh', shouldForceOrderRefresh);

        const assetPairs = await this.orderProvider.getAvailableMakerAssetDatasAsync(assetData);
        const etherTokenAssetData = await this._getEtherTokenAssetDataOrThrowAsync();
        if (!assetPairs.includes(etherTokenAssetData)) {
            return {
                tokensAvailableInBaseUnits: new BigNumber(0),
                ethValueAvailableInWei: new BigNumber(0),
            };
        }

        const ordersAndFillableAmounts = await this.getOrdersAndFillableAmountsAsync(
            assetData,
            shouldForceOrderRefresh,
        );

        return calculateLiquidity(ordersAndFillableAmounts);
    }

    /**
     * Given a BuyQuote and desired rate, attempt to execute the buy.
     * @param   buyQuote        An object that conforms to BuyQuote. See type definition for more information.
     * @param   options         Options for the execution of the BuyQuote. See type definition for more information.
     *
     * @return  A promise of the txHash.
     */
    public async executeBuyQuoteAsync(
        buyQuote: BuyQuote,
        options: Partial<BuyQuoteExecutionOpts> = {},
    ): Promise<string> {
        const { ethAmount, takerAddress, feeRecipient, gasLimit, gasPrice } = _.merge(
            {},
            constants.DEFAULT_BUY_QUOTE_EXECUTION_OPTS,
            options,
        );
        assert.isValidBuyQuote('buyQuote', buyQuote);
        if (ethAmount !== undefined) {
            assert.isBigNumber('ethAmount', ethAmount);
        }
        if (takerAddress !== undefined) {
            assert.isETHAddressHex('takerAddress', takerAddress);
        }
        assert.isETHAddressHex('feeRecipient', feeRecipient);
        if (gasLimit !== undefined) {
            assert.isNumber('gasLimit', gasLimit);
        }
        if (gasPrice !== undefined) {
            assert.isBigNumber('gasPrice', gasPrice);
        }
        const { orders, feeOrders, feePercentage, assetBuyAmount, worstCaseQuoteInfo } = buyQuote; // tslint:disable-line:no-unused-variable
        // if no takerAddress is provided, try to get one from the provider
        let finalTakerAddress;
        if (takerAddress !== undefined) {
            finalTakerAddress = takerAddress;
        } else {
            const web3Wrapper = new Web3Wrapper(this.provider);
            const availableAddresses = await web3Wrapper.getAvailableAddressesAsync();
            const firstAvailableAddress = _.head(availableAddresses);
            if (firstAvailableAddress !== undefined) {
                finalTakerAddress = firstAvailableAddress;
            } else {
                throw new Error(AssetBuyerError.NoAddressAvailable);
            }
        }
        try {
            // format fee percentage
            const formattedFeePercentage = numberPercentageToEtherTokenAmountPercentage(feePercentage || 0);
            // if no ethAmount is provided, default to the worst ethAmount from buyQuote
            const value = ethAmount || worstCaseQuoteInfo.totalEthAmount;

            const txHash = await this._contractWrappers.forwarder.marketBuyOrdersWithEth.sendTransactionAsync(
                orders,
                assetBuyAmount,
                orders.map(o => o.signature),
                formattedFeePercentage,
                feeRecipient,
                {
                    value,
                    from: finalTakerAddress.toLowerCase(),
                    gas: gasLimit,
                    gasPrice,
                },
            );

            return txHash;
        } catch (err) {
            if (_.includes(err.message, ContractError.SignatureRequestDenied)) {
                throw new Error(AssetBuyerError.SignatureRequestDenied);
            } else if (_.includes(err.message, ForwarderError.CompleteFillFailed)) {
                throw new Error(AssetBuyerError.TransactionValueTooLow);
            } else {
                throw err;
            }
        }
    }
    /**
     * Get the asset data of all assets that are purchaseable with ether token (wETH) in the order provider passed in at init.
     *
     * @return  An array of asset data strings that can be purchased using wETH.
     */
    public async getAvailableAssetDatasAsync(): Promise<string[]> {
        const etherTokenAssetData = await this._getEtherTokenAssetDataOrThrowAsync();
        return this.orderProvider.getAvailableMakerAssetDatasAsync(etherTokenAssetData);
    }
    /**
     * Grab orders from the map, if there is a miss or it is time to refresh, fetch and process the orders
     * @param assetData                The assetData of the desired asset to buy (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param shouldForceOrderRefresh  If set to true, new orders and state will be fetched instead of waiting for the next orderRefreshIntervalMs.
     */
    public async getOrdersAndFillableAmountsAsync(
        assetData: string,
        shouldForceOrderRefresh: boolean,
    ): Promise<OrdersAndFillableAmounts> {
        // try to get ordersEntry from the map
        const ordersEntryIfExists = this._ordersEntryMap[assetData];
        // we should refresh if:
        // we do not have any orders OR
        // we are forced to OR
        // we have some last refresh time AND that time was sufficiently long ago
        const shouldRefresh =
            ordersEntryIfExists === undefined ||
            shouldForceOrderRefresh ||
            // tslint:disable:restrict-plus-operands
            ordersEntryIfExists.lastRefreshTime + this.orderRefreshIntervalMs < Date.now();
        if (!shouldRefresh) {
            const result = ordersEntryIfExists.ordersAndFillableAmounts;
            return result;
        }
        const etherTokenAssetData = await this._getEtherTokenAssetDataOrThrowAsync();
        const zrxTokenAssetData = await this._getZrxTokenAssetDataOrThrowAsync();
        // construct orderProvider request
        const orderProviderRequest = {
            makerAssetData: assetData,
            takerAssetData: etherTokenAssetData,
            chainId: this.chainId,
        };
        const request = orderProviderRequest;
        // get provider response
        const response = await this.orderProvider.getOrdersAsync(request);
        // since the order provider is an injected dependency, validate that it respects the API
        // ie. it should only return maker/taker assetDatas that are specified
        orderProviderResponseProcessor.throwIfInvalidResponse(response, request);
        // process the responses into one object
        const isMakerAssetZrxToken = assetData === zrxTokenAssetData;
        const ordersAndFillableAmounts = await orderProviderResponseProcessor.processAsync(
            response,
            isMakerAssetZrxToken,
            this.expiryBufferSeconds,
            this._contractWrappers.orderValidator,
        );
        const lastRefreshTime = Date.now();
        const updatedOrdersEntry = {
            ordersAndFillableAmounts,
            lastRefreshTime,
        };
        this._ordersEntryMap[assetData] = updatedOrdersEntry;
        return ordersAndFillableAmounts;
    }
    /**
     * Get the assetData that represents the WETH token.
     * Will throw if WETH does not exist for the current chain.
     */
    private async _getEtherTokenAssetDataOrThrowAsync(): Promise<string> {
        return this._contractWrappers.devUtils.encodeERC20AssetData.callAsync(
            this._contractWrappers.contractAddresses.etherToken,
        );
    }
    /**
     * Get the assetData that represents the ZRX token.
     * Will throw if ZRX does not exist for the current chain.
     */
    private async _getZrxTokenAssetDataOrThrowAsync(): Promise<string> {
        return this._contractWrappers.devUtils.encodeERC20AssetData.callAsync(
            this._contractWrappers.contractAddresses.zrxToken,
        );
    }
}
