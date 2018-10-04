import { ContractWrappers } from '@0xproject/contract-wrappers';
import { schemas } from '@0xproject/json-schemas';
import { SignedOrder } from '@0xproject/order-utils';
import { ObjectMap } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider } from 'ethereum-types';
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
    OrderProvider,
    OrderProviderResponse,
    OrdersAndFillableAmounts,
} from './types';

import { assert } from './utils/assert';
import { assetDataUtils } from './utils/asset_data_utils';
import { buyQuoteCalculator } from './utils/buy_quote_calculator';
import { orderProviderResponseProcessor } from './utils/order_provider_response_processor';

interface OrdersEntry {
    ordersAndFillableAmounts: OrdersAndFillableAmounts;
    lastRefreshTime: number;
}

export class AssetBuyer {
    public readonly provider: Provider;
    public readonly orderProvider: OrderProvider;
    public readonly networkId: number;
    public readonly orderRefreshIntervalMs: number;
    public readonly expiryBufferSeconds: number;
    private readonly _contractWrappers: ContractWrappers;
    // cache of orders along with the time last updated keyed by assetData
    private readonly _ordersEntryMap: ObjectMap<OrdersEntry> = {};
    /**
     * Instantiates a new AssetBuyer instance given existing liquidity in the form of orders and feeOrders.
     * @param   provider                The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   orders                  A non-empty array of objects that conform to SignedOrder. All orders must have the same makerAssetData and takerAssetData (WETH).
     * @param   feeOrders               A array of objects that conform to SignedOrder. All orders must have the same makerAssetData (ZRX) and takerAssetData (WETH). Defaults to an empty array.
     * @param   options                 Initialization options for the AssetBuyer. See type definition for details.
     *
     * @return  An instance of AssetBuyer
     */
    public static getAssetBuyerForProvidedOrders(
        provider: Provider,
        orders: SignedOrder[],
        feeOrders: SignedOrder[] = [],
        options: Partial<AssetBuyerOpts> = {},
    ): AssetBuyer {
        assert.isWeb3Provider('provider', provider);
        assert.doesConformToSchema('orders', orders, schemas.signedOrdersSchema);
        assert.doesConformToSchema('feeOrders', feeOrders, schemas.signedOrdersSchema);
        assert.areValidProvidedOrders('orders', orders);
        assert.areValidProvidedOrders('feeOrders', feeOrders);
        assert.assert(orders.length !== 0, `Expected orders to contain at least one order`);
        const orderProvider = new BasicOrderProvider(_.concat(orders, feeOrders));
        const assetBuyer = new AssetBuyer(provider, orderProvider, options);
        return assetBuyer;
    }
    /**
     * Instantiates a new AssetBuyer instance given a [Standard Relayer API](https://github.com/0xProject/standard-relayer-api) endpoint
     * @param   provider                The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   sraApiUrl               The standard relayer API base HTTP url you would like to source orders from.
     * @param   options                 Initialization options for the AssetBuyer. See type definition for details.
     *
     * @return  An instance of AssetBuyer
     */
    public static getAssetBuyerForStandardRelayerAPIUrl(
        provider: Provider,
        sraApiUrl: string,
        options: Partial<AssetBuyerOpts> = {},
    ): AssetBuyer {
        assert.isWeb3Provider('provider', provider);
        assert.isWebUri('sraApiUrl', sraApiUrl);
        const orderProvider = new StandardRelayerAPIOrderProvider(sraApiUrl);
        const assetBuyer = new AssetBuyer(provider, orderProvider, options);
        return assetBuyer;
    }
    /**
     * Instantiates a new AssetBuyer instance
     * @param   provider            The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   orderProvider       An object that conforms to OrderProvider, see type for definition.
     * @param   options             Initialization options for the AssetBuyer. See type definition for details.
     *
     * @return  An instance of AssetBuyer
     */
    constructor(provider: Provider, orderProvider: OrderProvider, options: Partial<AssetBuyerOpts> = {}) {
        const { networkId, orderRefreshIntervalMs, expiryBufferSeconds } = {
            ...constants.DEFAULT_ASSET_BUYER_OPTS,
            ...options,
        };
        assert.isWeb3Provider('provider', provider);
        assert.isValidOrderProvider('orderProvider', orderProvider);
        assert.isNumber('networkId', networkId);
        assert.isNumber('orderRefreshIntervalMs', orderRefreshIntervalMs);
        assert.isNumber('expiryBufferSeconds', expiryBufferSeconds);
        this.provider = provider;
        this.orderProvider = orderProvider;
        this.networkId = networkId;
        this.orderRefreshIntervalMs = orderRefreshIntervalMs;
        this.expiryBufferSeconds = expiryBufferSeconds;
        this._contractWrappers = new ContractWrappers(this.provider, {
            networkId,
            // TODO(albrow): Load in real contract addresses here.
            contractAddresses: {
                erc20Proxy: '',
                erc721Proxy: '',
                zrxToken: '',
                etherToken: '',
                exchange: '',
                assetProxyOwner: '',
                forwarder: '',
                orderValidator: '',
            },
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
        const { feePercentage, shouldForceOrderRefresh, slippagePercentage } = {
            ...constants.DEFAULT_BUY_QUOTE_REQUEST_OPTS,
            ...options,
        };
        assert.isString('assetData', assetData);
        assert.isBigNumber('assetBuyAmount', assetBuyAmount);
        assert.isValidPercentage('feePercentage', feePercentage);
        assert.isBoolean('shouldForceOrderRefresh', shouldForceOrderRefresh);
        assert.isNumber('slippagePercentage', slippagePercentage);
        const zrxTokenAssetData = this._getZrxTokenAssetDataOrThrow();
        const [ordersAndFillableAmounts, feeOrdersAndFillableAmounts] = await Promise.all([
            this._getOrdersAndFillableAmountsAsync(assetData, shouldForceOrderRefresh),
            this._getOrdersAndFillableAmountsAsync(zrxTokenAssetData, shouldForceOrderRefresh),
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
        const assetData = assetDataUtils.encodeERC20AssetData(tokenAddress);
        const buyQuote = this.getBuyQuoteAsync(assetData, assetBuyAmount, options);
        return buyQuote;
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
        const { ethAmount, takerAddress, feeRecipient, gasLimit, gasPrice } = {
            ...constants.DEFAULT_BUY_QUOTE_EXECUTION_OPTS,
            ...options,
        };
        assert.isValidBuyQuote('buyQuote', buyQuote);
        if (!_.isUndefined(ethAmount)) {
            assert.isBigNumber('ethAmount', ethAmount);
        }
        if (!_.isUndefined(takerAddress)) {
            assert.isETHAddressHex('takerAddress', takerAddress);
        }
        assert.isETHAddressHex('feeRecipient', feeRecipient);
        const { orders, feeOrders, feePercentage, assetBuyAmount, worstCaseQuoteInfo } = buyQuote;
        // if no takerAddress is provided, try to get one from the provider
        let finalTakerAddress;
        if (!_.isUndefined(takerAddress)) {
            finalTakerAddress = takerAddress;
        } else {
            const web3Wrapper = new Web3Wrapper(this.provider);
            const availableAddresses = await web3Wrapper.getAvailableAddressesAsync();
            const firstAvailableAddress = _.head(availableAddresses);
            if (!_.isUndefined(firstAvailableAddress)) {
                finalTakerAddress = firstAvailableAddress;
            } else {
                throw new Error(AssetBuyerError.NoAddressAvailable);
            }
        }
        // if no ethAmount is provided, default to the worst ethAmount from buyQuote
        const txHash = await this._contractWrappers.forwarder.marketBuyOrdersWithEthAsync(
            orders,
            assetBuyAmount,
            finalTakerAddress,
            ethAmount || worstCaseQuoteInfo.totalEthAmount,
            feeOrders,
            feePercentage,
            feeRecipient,
            {
                gasLimit,
                gasPrice,
            },
        );
        return txHash;
    }
    /**
     * Grab orders from the map, if there is a miss or it is time to refresh, fetch and process the orders
     */
    private async _getOrdersAndFillableAmountsAsync(
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
            _.isUndefined(ordersEntryIfExists) ||
            shouldForceOrderRefresh ||
            // tslint:disable:restrict-plus-operands
            ordersEntryIfExists.lastRefreshTime + this.orderRefreshIntervalMs < Date.now();
        if (!shouldRefresh) {
            const result = ordersEntryIfExists.ordersAndFillableAmounts;
            return result;
        }
        const etherTokenAssetData = this._getEtherTokenAssetDataOrThrow();
        const zrxTokenAssetData = this._getZrxTokenAssetDataOrThrow();
        // construct orderProvider request
        const orderProviderRequest = {
            makerAssetData: assetData,
            takerAssetData: etherTokenAssetData,
            networkId: this.networkId,
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
     * Will throw if WETH does not exist for the current network.
     */
    private _getEtherTokenAssetDataOrThrow(): string {
        return assetDataUtils.getEtherTokenAssetData(this._contractWrappers);
    }
    /**
     * Get the assetData that represents the ZRX token.
     * Will throw if ZRX does not exist for the current network.
     */
    private _getZrxTokenAssetDataOrThrow(): string {
        return this._contractWrappers.exchange.getZRXAssetData();
    }
}
