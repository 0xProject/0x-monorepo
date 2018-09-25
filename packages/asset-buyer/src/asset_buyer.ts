import { ContractWrappers } from '@0xproject/contract-wrappers';
import { schemas } from '@0xproject/json-schemas';
import { SignedOrder } from '@0xproject/order-utils';
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
    AssetBuyerOrdersAndFillableAmounts,
    BuyQuote,
    BuyQuoteExecutionOpts,
    BuyQuoteRequestOpts,
    OrderProvider,
    OrderProviderResponse,
} from './types';

import { assert } from './utils/assert';
import { assetDataUtils } from './utils/asset_data_utils';
import { buyQuoteCalculator } from './utils/buy_quote_calculator';
import { orderProviderResponseProcessor } from './utils/order_provider_response_processor';

export class AssetBuyer {
    public readonly provider: Provider;
    public readonly assetData: string;
    public readonly orderProvider: OrderProvider;
    public readonly networkId: number;
    public readonly orderRefreshIntervalMs: number;
    public readonly expiryBufferSeconds: number;
    private readonly _contractWrappers: ContractWrappers;
    private _lastRefreshTimeIfExists?: number;
    private _currentOrdersAndFillableAmountsIfExists?: AssetBuyerOrdersAndFillableAmounts;
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
        options: Partial<AssetBuyerOpts>,
    ): AssetBuyer {
        assert.isWeb3Provider('provider', provider);
        assert.doesConformToSchema('orders', orders, schemas.signedOrdersSchema);
        assert.doesConformToSchema('feeOrders', feeOrders, schemas.signedOrdersSchema);
        assert.areValidProvidedOrders('orders', orders);
        assert.areValidProvidedOrders('feeOrders', feeOrders);
        assert.assert(orders.length !== 0, `Expected orders to contain at least one order`);
        const assetData = orders[0].makerAssetData;
        const orderProvider = new BasicOrderProvider(_.concat(orders, feeOrders));
        const assetBuyer = new AssetBuyer(provider, assetData, orderProvider, options);
        return assetBuyer;
    }
    /**
     * Instantiates a new AssetBuyer instance given the desired assetData and a [Standard Relayer API](https://github.com/0xProject/standard-relayer-api) endpoint
     * @param   provider                The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   assetData               The assetData that identifies the desired asset to buy.
     * @param   sraApiUrl               The standard relayer API base HTTP url you would like to source orders from.
     * @param   options                 Initialization options for the AssetBuyer. See type definition for details.
     *
     * @return  An instance of AssetBuyer
     */
    public static getAssetBuyerForAssetData(
        provider: Provider,
        assetData: string,
        sraApiUrl: string,
        options: Partial<AssetBuyerOpts>,
    ): AssetBuyer {
        assert.isWeb3Provider('provider', provider);
        assert.isHexString('assetData', assetData);
        assert.isWebUri('sraApiUrl', sraApiUrl);
        const orderProvider = new StandardRelayerAPIOrderProvider(sraApiUrl);
        const assetBuyer = new AssetBuyer(provider, assetData, orderProvider, options);
        return assetBuyer;
    }
    /**
     * Instantiates a new AssetBuyer instance given the desired ERC20 token address and a [Standard Relayer API](https://github.com/0xProject/standard-relayer-api) endpoint
     * @param   provider                The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   tokenAddress            The ERC20 token address that identifies the desired asset to buy.
     * @param   sraApiUrl               The standard relayer API base HTTP url you would like to source orders from.
     * @param   options                 Initialization options for the AssetBuyer. See type definition for details.
     *
     * @return  An instance of AssetBuyer
     */
    public static getAssetBuyerForERC20TokenAddress(
        provider: Provider,
        tokenAddress: string,
        sraApiUrl: string,
        options: Partial<AssetBuyerOpts>,
    ): AssetBuyer {
        assert.isWeb3Provider('provider', provider);
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.isWebUri('sraApiUrl', sraApiUrl);
        const assetData = assetDataUtils.encodeERC20AssetData(tokenAddress);
        const assetBuyer = AssetBuyer.getAssetBuyerForAssetData(provider, assetData, sraApiUrl, options);
        return assetBuyer;
    }
    /**
     * Instantiates a new AssetBuyer instance
     * @param   provider            The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   assetData           The assetData of the desired asset to buy (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   orderProvider       An object that conforms to OrderProvider, see type for definition.
     * @param   options             Initialization options for the AssetBuyer. See type definition for details.
     *
     * @return  An instance of AssetBuyer
     */
    constructor(provider: Provider, assetData: string, orderProvider: OrderProvider, options: Partial<AssetBuyerOpts>) {
        const { networkId, orderRefreshIntervalMs, expiryBufferSeconds } = {
            ...constants.DEFAULT_ASSET_BUYER_OPTS,
            ...options,
        };
        assert.isWeb3Provider('provider', provider);
        assert.isString('assetData', assetData);
        assert.isValidOrderProvider('orderProvider', orderProvider);
        assert.isNumber('networkId', networkId);
        assert.isNumber('orderRefreshIntervalMs', orderRefreshIntervalMs);
        assert.isNumber('expiryBufferSeconds', expiryBufferSeconds);
        this.provider = provider;
        this.assetData = assetData;
        this.orderProvider = orderProvider;
        this.networkId = networkId;
        this.expiryBufferSeconds = expiryBufferSeconds;
        this.orderRefreshIntervalMs = orderRefreshIntervalMs;
        this._contractWrappers = new ContractWrappers(this.provider, {
            networkId,
        });
    }
    /**
     * Get a `BuyQuote` containing all information relevant to fulfilling a buy.
     * You can then pass the `BuyQuote` to `executeBuyQuoteAsync` to execute the buy.
     * @param   assetBuyAmount      The amount of asset to buy.
     * @param   options             Options for the request. See type definition for more information.
     *
     * @return  An object that conforms to BuyQuote that satisfies the request. See type definition for more information.
     */
    public async getBuyQuoteAsync(assetBuyAmount: BigNumber, options: Partial<BuyQuoteRequestOpts>): Promise<BuyQuote> {
        const { feePercentage, shouldForceOrderRefresh, slippagePercentage } = {
            ...constants.DEFAULT_BUY_QUOTE_REQUEST_OPTS,
            ...options,
        };
        assert.isBigNumber('assetBuyAmount', assetBuyAmount);
        assert.isValidPercentage('feePercentage', feePercentage);
        assert.isBoolean('shouldForceOrderRefresh', shouldForceOrderRefresh);
        // we should refresh if:
        // we do not have any orders OR
        // we are forced to OR
        // we have some last refresh time AND that time was sufficiently long ago
        const shouldRefresh =
            _.isUndefined(this._currentOrdersAndFillableAmountsIfExists) ||
            shouldForceOrderRefresh ||
            (!_.isUndefined(this._lastRefreshTimeIfExists) &&
                this._lastRefreshTimeIfExists + this.orderRefreshIntervalMs < Date.now());
        let ordersAndFillableAmounts: AssetBuyerOrdersAndFillableAmounts;
        if (shouldRefresh) {
            ordersAndFillableAmounts = await this._getLatestOrdersAndFillableAmountsAsync();
            this._lastRefreshTimeIfExists = Date.now();
            this._currentOrdersAndFillableAmountsIfExists = ordersAndFillableAmounts;
        } else {
            // it is safe to cast to AssetBuyerOrdersAndFillableAmounts because shouldRefresh catches the undefined case above
            ordersAndFillableAmounts = this
                ._currentOrdersAndFillableAmountsIfExists as AssetBuyerOrdersAndFillableAmounts;
        }
        const buyQuote = buyQuoteCalculator.calculate(
            ordersAndFillableAmounts,
            assetBuyAmount,
            feePercentage,
            slippagePercentage,
        );
        return buyQuote;
    }
    /**
     * Given a BuyQuote and desired rate, attempt to execute the buy.
     * @param   buyQuote        An object that conforms to BuyQuote. See type definition for more information.
     * @param   options         Options for the execution of the BuyQuote. See type definition for more information.
     *
     * @return  A promise of the txHash.
     */
    public async executeBuyQuoteAsync(buyQuote: BuyQuote, options: Partial<BuyQuoteExecutionOpts>): Promise<string> {
        const { rate, takerAddress, feeRecipient } = {
            ...constants.DEFAULT_BUY_QUOTE_EXECUTION_OPTS,
            ...options,
        };
        assert.isValidBuyQuote('buyQuote', buyQuote);
        if (!_.isUndefined(rate)) {
            assert.isBigNumber('rate', rate);
        }
        if (!_.isUndefined(takerAddress)) {
            assert.isETHAddressHex('takerAddress', takerAddress);
        }
        assert.isETHAddressHex('feeRecipient', feeRecipient);
        const { orders, feeOrders, feePercentage, assetBuyAmount, maxRate } = buyQuote;
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
        // if no rate is provided, default to the maxRate from buyQuote
        const desiredRate = rate || maxRate;
        // calculate how much eth is required to buy assetBuyAmount at the desired rate
        const ethAmount = assetBuyAmount.dividedToIntegerBy(desiredRate);
        const txHash = await this._contractWrappers.forwarder.marketBuyOrdersWithEthAsync(
            orders,
            assetBuyAmount,
            finalTakerAddress,
            ethAmount,
            feeOrders,
            feePercentage,
            feeRecipient,
        );
        return txHash;
    }
    /**
     * Ask the order Provider for orders and process them.
     */
    private async _getLatestOrdersAndFillableAmountsAsync(): Promise<AssetBuyerOrdersAndFillableAmounts> {
        const etherTokenAssetData = this._getEtherTokenAssetDataOrThrow();
        const zrxTokenAssetData = this._getZrxTokenAssetDataOrThrow();
        // construct order Provider requests
        const targetOrderProviderRequest = {
            makerAssetData: this.assetData,
            takerAssetData: etherTokenAssetData,
            networkId: this.networkId,
        };
        const feeOrderProviderRequest = {
            makerAssetData: zrxTokenAssetData,
            takerAssetData: etherTokenAssetData,
            networkId: this.networkId,
        };
        const requests = [targetOrderProviderRequest, feeOrderProviderRequest];
        // fetch orders and possible fillable amounts
        const [targetOrderProviderResponse, feeOrderProviderResponse] = await Promise.all(
            _.map(requests, async request => this.orderProvider.getOrdersAsync(request)),
        );
        // since the order provider is an injected dependency, validate that it respects the API
        // ie. it should only return maker/taker assetDatas that are specified
        orderProviderResponseProcessor.throwIfInvalidResponse(targetOrderProviderResponse, targetOrderProviderRequest);
        orderProviderResponseProcessor.throwIfInvalidResponse(feeOrderProviderResponse, feeOrderProviderRequest);
        // process the responses into one object
        const ordersAndFillableAmounts = await orderProviderResponseProcessor.processAsync(
            targetOrderProviderResponse,
            feeOrderProviderResponse,
            zrxTokenAssetData,
            this.expiryBufferSeconds,
            this._contractWrappers.orderValidator,
        );
        return ordersAndFillableAmounts;
    }
    /**
     * Get the assetData that represents the WETH token.
     * Will throw if WETH does not exist for the current network.
     */
    private _getEtherTokenAssetDataOrThrow(): string {
        return assetDataUtils.getEtherTokenAssetDataOrThrow(this._contractWrappers);
    }
    /**
     * Get the assetData that represents the ZRX token.
     * Will throw if ZRX does not exist for the current network.
     */
    private _getZrxTokenAssetDataOrThrow(): string {
        return assetDataUtils.getZrxTokenAssetDataOrThrow(this._contractWrappers);
    }
}
