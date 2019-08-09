import { ContractWrappers } from '@0x/contract-wrappers';
import { schemas } from '@0x/json-schemas';
import { SignedOrder } from '@0x/order-utils';
import { MarketOperation, ObjectMap } from '@0x/types';
import { BigNumber, providerUtils } from '@0x/utils';
import { SupportedProvider, ZeroExProvider } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from './constants';
import { BasicOrderProvider } from './order_providers/basic_order_provider';
import { StandardRelayerAPIOrderProvider } from './order_providers/standard_relayer_api_order_provider';
import {
    LiquidityForAssetData,
    LiquidityRequestOpts,
    MarketBuySwapQuote,
    MarketSellSwapQuote,
    OrderProvider,
    OrdersAndFillableAmounts,
    SwapQuote,
    SwapQuoteRequestOpts,
    SwapQuoterError,
    SwapQuoterOpts,
} from './types';

import { assert } from './utils/assert';
import { assetDataUtils } from './utils/asset_data_utils';
import { calculateLiquidity } from './utils/calculate_liquidity';
import { orderProviderResponseProcessor } from './utils/order_provider_response_processor';
import { swapQuoteCalculator } from './utils/swap_quote_calculator';

interface OrdersEntry {
    ordersAndFillableAmounts: OrdersAndFillableAmounts;
    lastRefreshTime: number;
}

export class SwapQuoter {
    public readonly provider: ZeroExProvider;
    public readonly orderProvider: OrderProvider;
    public readonly networkId: number;
    public readonly orderRefreshIntervalMs: number;
    public readonly expiryBufferMs: number;
    private readonly _contractWrappers: ContractWrappers;
    // cache of orders along with the time last updated keyed by assetData
    private readonly _ordersEntryMap: ObjectMap<OrdersEntry> = {};

    /**
     * Instantiates a new SwapQuoter instance given existing liquidity in the form of orders and feeOrders.
     * @param   supportedProvider       The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   orders                  A non-empty array of objects that conform to SignedOrder. All orders must have the same makerAssetData and takerAssetData.
     * @param   options                 Initialization options for the SwapQuoter. See type definition for details.
     *
     * @return  An instance of SwapQuoter
     */
    public static getSwapQuoterForProvidedOrders(
        supportedProvider: SupportedProvider,
        orders: SignedOrder[],
        options: Partial<SwapQuoterOpts> = {},
    ): SwapQuoter {
        assert.doesConformToSchema('orders', orders, schemas.signedOrdersSchema);
        assert.assert(orders.length !== 0, `Expected orders to contain at least one order`);
        const orderProvider = new BasicOrderProvider(orders);
        const swapQuoter = new SwapQuoter(supportedProvider, orderProvider, options);
        return swapQuoter;
    }

    /**
     * Instantiates a new SwapQuoter instance given a [Standard Relayer API](https://github.com/0xProject/standard-relayer-api) endpoint
     * @param   supportedProvider       The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   sraApiUrl               The standard relayer API base HTTP url you would like to source orders from.
     * @param   options                 Initialization options for the SwapQuoter. See type definition for details.
     *
     * @return  An instance of SwapQuoter
     */
    public static getSwapQuoterForStandardRelayerAPIUrl(
        supportedProvider: SupportedProvider,
        sraApiUrl: string,
        options: Partial<SwapQuoterOpts> = {},
    ): SwapQuoter {
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        assert.isWebUri('sraApiUrl', sraApiUrl);
        const networkId = options.networkId || constants.DEFAULT_SWAP_QUOTER_OPTS.networkId;
        const orderProvider = new StandardRelayerAPIOrderProvider(sraApiUrl, networkId);
        const swapQuoter = new SwapQuoter(provider, orderProvider, options);
        return swapQuoter;
    }

    /**
     *
     * get the key for _orderEntryMap for maker + taker asset pair
     */
    private static _getOrdersEntryMapKey(makerAssetData: string, takerAssetData: string): string {
        return `${makerAssetData}_${takerAssetData}`;
    }
    /**
     * Instantiates a new SwapQuoter instance
     * @param   supportedProvider   The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   orderProvider       An object that conforms to OrderProvider, see type for definition.
     * @param   options             Initialization options for the SwapQuoter. See type definition for details.
     *
     * @return  An instance of SwapQuoter
     */
    constructor(
        supportedProvider: SupportedProvider,
        orderProvider: OrderProvider,
        options: Partial<SwapQuoterOpts> = {},
    ) {
        const { networkId, orderRefreshIntervalMs, expiryBufferMs } = _.merge(
            {},
            constants.DEFAULT_SWAP_QUOTER_OPTS,
            options,
        );
        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        assert.isValidOrderProvider('orderProvider', orderProvider);
        assert.isNumber('networkId', networkId);
        assert.isNumber('orderRefreshIntervalMs', orderRefreshIntervalMs);
        assert.isNumber('expiryBufferMs', expiryBufferMs);
        this.provider = provider;
        this.orderProvider = orderProvider;
        this.networkId = networkId;
        this.orderRefreshIntervalMs = orderRefreshIntervalMs;
        this.expiryBufferMs = expiryBufferMs;
        this._contractWrappers = new ContractWrappers(this.provider, {
            networkId,
        });
    }
    /**
     * Get a `SwapQuote` containing all information relevant to fulfilling a swap between a desired ERC20 token address and ERC20 owned by a provided address.
     * You can then pass the `SwapQuote` to a `SwapQuoteConsumer` to execute a buy, or process SwapQuote for on-chain consumption.
     * @param   makerAssetData           The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetData           The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetSellAmount     The amount of taker asset to swap for.
     * @param   options                  Options for the request. See type definition for more information.
     *
     * @return  An object that conforms to SwapQuote that satisfies the request. See type definition for more information.
     */
    public async getMarketSellSwapQuoteForAssetDataAsync(
        makerAssetData: string,
        takerAssetData: string,
        takerAssetSellAmount: BigNumber,
        options: Partial<SwapQuoteRequestOpts> = {},
    ): Promise<MarketSellSwapQuote> {
        assert.isBigNumber('takerAssetSellAmount', takerAssetSellAmount);
        return (await this._getSwapQuoteAsync(
            makerAssetData,
            takerAssetData,
            takerAssetSellAmount,
            MarketOperation.Sell,
            options,
        )) as MarketSellSwapQuote;
    }

    /**
     * Get a `SwapQuote` containing all information relevant to fulfilling a swap between a desired ERC20 token address and ERC20 owned by a provided address.
     * You can then pass the `SwapQuote` to a `SwapQuoteConsumer` to execute a buy, or process SwapQuote for on-chain consumption.
     * @param   makerAssetData           The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetData           The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   makerAssetBuyAmount     The amount of maker asset to swap for.
     * @param   options                  Options for the request. See type definition for more information.
     *
     * @return  An object that conforms to SwapQuote that satisfies the request. See type definition for more information.
     */
    public async getMarketBuySwapQuoteForAssetDataAsync(
        makerAssetData: string,
        takerAssetData: string,
        makerAssetBuyAmount: BigNumber,
        options: Partial<SwapQuoteRequestOpts> = {},
    ): Promise<MarketBuySwapQuote> {
        assert.isBigNumber('makerAssetBuyAmount', makerAssetBuyAmount);
        return (await this._getSwapQuoteAsync(
            makerAssetData,
            takerAssetData,
            makerAssetBuyAmount,
            MarketOperation.Buy,
            options,
        )) as MarketBuySwapQuote;
    }
    /**
     * Get a `SwapQuote` containing all information relevant to fulfilling a swap between a desired ERC20 token address and ERC20 owned by a provided address.
     * You can then pass the `SwapQuote` to a `SwapQuoteConsumer` to execute a buy, or process SwapQuote for on-chain consumption.
     * @param   makerTokenAddress       The address of the maker asset
     * @param   takerTokenAddress       The address of the taker asset
     * @param   makerAssetBuyAmount     The amount of maker asset to swap for.
     * @param   options                 Options for the request. See type definition for more information.
     *
     * @return  An object that conforms to SwapQuote that satisfies the request. See type definition for more information.
     */
    public async getMarketBuySwapQuoteAsync(
        makerTokenAddress: string,
        takerTokenAddress: string,
        makerAssetBuyAmount: BigNumber,
        options: Partial<SwapQuoteRequestOpts> = {},
    ): Promise<SwapQuote> {
        assert.isETHAddressHex('makerTokenAddress', makerTokenAddress);
        assert.isETHAddressHex('takerTokenAddress', takerTokenAddress);
        assert.isBigNumber('makerAssetBuyAmount', makerAssetBuyAmount);
        const makerAssetData = assetDataUtils.encodeERC20AssetData(makerTokenAddress);
        const takerAssetData = assetDataUtils.encodeERC20AssetData(takerTokenAddress);
        const swapQuote = this.getMarketBuySwapQuoteForAssetDataAsync(
            makerAssetData,
            takerAssetData,
            makerAssetBuyAmount,
            options,
        );
        return swapQuote;
    }

    /**
     * Get a `SwapQuote` containing all information relevant to fulfilling a swap between a desired ERC20 token address and ERC20 owned by a provided address.
     * You can then pass the `SwapQuote` to a `SwapQuoteConsumer` to execute a buy, or process SwapQuote for on-chain consumption.
     * @param   makerTokenAddress       The address of the maker asset
     * @param   takerTokenAddress       The address of the taker asset
     * @param   takerAssetSellAmount     The amount of taker asset to sell.
     * @param   options                  Options for the request. See type definition for more information.
     *
     * @return  An object that conforms to SwapQuote that satisfies the request. See type definition for more information.
     */
    public async getMarketSellSwapQuoteAsync(
        makerTokenAddress: string,
        takerTokenAddress: string,
        takerAssetSellAmount: BigNumber,
        options: Partial<SwapQuoteRequestOpts> = {},
    ): Promise<SwapQuote> {
        assert.isETHAddressHex('makerTokenAddress', makerTokenAddress);
        assert.isETHAddressHex('takerTokenAddress', takerTokenAddress);
        assert.isBigNumber('takerAssetSellAmount', takerAssetSellAmount);
        const makerAssetData = assetDataUtils.encodeERC20AssetData(makerTokenAddress);
        const takerAssetData = assetDataUtils.encodeERC20AssetData(takerTokenAddress);
        const swapQuote = this.getMarketSellSwapQuoteForAssetDataAsync(
            makerAssetData,
            takerAssetData,
            takerAssetSellAmount,
            options,
        );
        return swapQuote;
    }

    /**
     * Returns information about available liquidity for an asset
     * Does not factor in slippage or fees
     * @param   makerAssetData      The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetData      The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   options             Options for the request. See type definition for more information.
     *
     * @return  An object that conforms to LiquidityForAssetData that satisfies the request. See type definition for more information.
     */
    public async getLiquidityForMakerTakerAssetDataPairAsync(
        makerAssetData: string,
        takerAssetData: string,
        options: Partial<LiquidityRequestOpts> = {},
    ): Promise<LiquidityForAssetData> {
        const { shouldForceOrderRefresh } = _.merge({}, constants.DEFAULT_LIQUIDITY_REQUEST_OPTS, options);
        assert.isString('makerAssetData', makerAssetData);
        assert.isString('takerAssetData', takerAssetData);
        assetDataUtils.decodeAssetDataOrThrow(makerAssetData);
        assetDataUtils.decodeAssetDataOrThrow(takerAssetData);
        assert.isBoolean('options.shouldForceOrderRefresh', shouldForceOrderRefresh);

        const assetPairs = await this.orderProvider.getAvailableMakerAssetDatasAsync(takerAssetData);
        if (!assetPairs.includes(makerAssetData)) {
            return {
                makerTokensAvailableInBaseUnits: new BigNumber(0),
                takerTokensAvailableInBaseUnits: new BigNumber(0),
            };
        }

        const ordersAndFillableAmounts = await this.getOrdersAndFillableAmountsAsync(
            makerAssetData,
            takerAssetData,
            shouldForceOrderRefresh,
        );

        return calculateLiquidity(ordersAndFillableAmounts);
    }

    /**
     * Get the asset data of all assets that can be used to purchase makerAssetData in the order provider passed in at init.
     *
     * @return  An array of asset data strings that can purchase makerAssetData.
     */
    public async getAvailableTakerAssetDatasAsync(makerAssetData: string): Promise<string[]> {
        assert.isString('makerAssetData', makerAssetData);
        assetDataUtils.decodeAssetDataOrThrow(makerAssetData);
        return this.orderProvider.getAvailableTakerAssetDatasAsync(makerAssetData);
    }

    /**
     * Get the asset data of all assets that are purchaseable with takerAssetData in the order provider passed in at init.
     *
     * @return  An array of asset data strings that are purchaseable with takerAssetData.
     */
    public async getAvailableMakerAssetDatasAsync(takerAssetData: string): Promise<string[]> {
        assert.isString('takerAssetData', takerAssetData);
        assetDataUtils.decodeAssetDataOrThrow(takerAssetData);
        return this.orderProvider.getAvailableMakerAssetDatasAsync(takerAssetData);
    }

    /**
     * Validates the taker + maker asset pair is available from the order provider provided to `SwapQuote`.
     *
     * @return  A boolean on if the taker, maker pair exists
     */
    public async isTakerMakerAssetDataPairAvailableAsync(
        makerAssetData: string,
        takerAssetData: string,
    ): Promise<boolean> {
        assert.isString('makerAssetData', makerAssetData);
        assert.isString('takerAssetData', takerAssetData);
        assetDataUtils.decodeAssetDataOrThrow(makerAssetData);
        assetDataUtils.decodeAssetDataOrThrow(takerAssetData);
        const availableMakerAssetDatas = await this.getAvailableMakerAssetDatasAsync(takerAssetData);
        return _.includes(availableMakerAssetDatas, makerAssetData);
    }

    /**
     * Grab orders from the map, if there is a miss or it is time to refresh, fetch and process the orders
     * @param   makerAssetData      The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetData      The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   shouldForceOrderRefresh  If set to true, new orders and state will be fetched instead of waiting for the next orderRefreshIntervalMs.
     */
    public async getOrdersAndFillableAmountsAsync(
        makerAssetData: string,
        takerAssetData: string,
        shouldForceOrderRefresh: boolean,
    ): Promise<OrdersAndFillableAmounts> {
        assert.isString('makerAssetData', makerAssetData);
        assert.isString('takerAssetData', takerAssetData);
        assetDataUtils.decodeAssetDataOrThrow(makerAssetData);
        assetDataUtils.decodeAssetDataOrThrow(takerAssetData);
        // try to get ordersEntry from the map
        const ordersEntryIfExists = this._ordersEntryMap[
            SwapQuoter._getOrdersEntryMapKey(makerAssetData, takerAssetData)
        ];
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
        const zrxTokenAssetData = this._getZrxTokenAssetDataOrThrow();
        // construct orderProvider request
        const orderProviderRequest = {
            makerAssetData,
            takerAssetData,
            networkId: this.networkId,
        };
        const request = orderProviderRequest;
        // get provider response
        const response = await this.orderProvider.getOrdersAsync(request);
        // since the order provider is an injected dependency, validate that it respects the API
        // ie. it should only return maker/taker assetDatas that are specified
        orderProviderResponseProcessor.throwIfInvalidResponse(response, request);
        // process the responses into one object
        const isMakerAssetZrxToken = makerAssetData === zrxTokenAssetData;
        const ordersAndFillableAmounts = await orderProviderResponseProcessor.processAsync(
            response,
            isMakerAssetZrxToken,
            this.expiryBufferMs,
            this._contractWrappers.orderValidator,
        );
        const lastRefreshTime = Date.now();
        const updatedOrdersEntry = {
            ordersAndFillableAmounts,
            lastRefreshTime,
        };
        this._ordersEntryMap[SwapQuoter._getOrdersEntryMapKey(makerAssetData, takerAssetData)] = updatedOrdersEntry;
        return ordersAndFillableAmounts;
    }

    /**
     * Util function to check if takerAddress's allowance is enough for 0x exchange contracts to conduct the swap specified by the swapQuote.
     * @param swapQuote The swapQuote in question to check enough allowance enabled for 0x exchange contracts to conduct the swap.
     * @param takerAddress The address of the taker of the provided swapQuote
     */
    public async isTakerAddressAllowanceEnoughForBestAndWorstQuoteInfoAsync(
        swapQuote: SwapQuote,
        takerAddress: string,
    ): Promise<[boolean, boolean]> {
        const orderValidatorWrapper = this._contractWrappers.orderValidator;
        const balanceAndAllowance = await orderValidatorWrapper.getBalanceAndAllowanceAsync(
            takerAddress,
            swapQuote.takerAssetData,
        );
        return [
            balanceAndAllowance.allowance.isGreaterThanOrEqualTo(swapQuote.bestCaseQuoteInfo.totalTakerTokenAmount),
            balanceAndAllowance.allowance.isGreaterThanOrEqualTo(swapQuote.worstCaseQuoteInfo.totalTakerTokenAmount),
        ];
    }

    /**
     * Get the assetData that represents the ZRX token.
     * Will throw if ZRX does not exist for the current network.
     */
    private _getZrxTokenAssetDataOrThrow(): string {
        return this._contractWrappers.exchange.getZRXAssetData();
    }

    /**
     * General function for getting swap quote, conditionally uses different logic per specified marketOperation
     */
    private async _getSwapQuoteAsync(
        makerAssetData: string,
        takerAssetData: string,
        assetFillAmount: BigNumber,
        marketOperation: MarketOperation,
        options: Partial<SwapQuoteRequestOpts>,
    ): Promise<SwapQuote> {
        const { shouldForceOrderRefresh, slippagePercentage, shouldDisableRequestingFeeOrders } = _.merge(
            {},
            constants.DEFAULT_SWAP_QUOTE_REQUEST_OPTS,
            options,
        );
        assert.isString('makerAssetData', makerAssetData);
        assert.isString('takerAssetData', takerAssetData);
        assert.isBoolean('shouldForceOrderRefresh', shouldForceOrderRefresh);
        assert.isNumber('slippagePercentage', slippagePercentage);
        const zrxTokenAssetData = this._getZrxTokenAssetDataOrThrow();
        const isMakerAssetZrxToken = makerAssetData === zrxTokenAssetData;
        // get the relevant orders for the makerAsset and fees
        // if the requested assetData is ZRX, don't get the fee info
        const [ordersAndFillableAmounts, feeOrdersAndFillableAmounts] = await Promise.all([
            this.getOrdersAndFillableAmountsAsync(makerAssetData, takerAssetData, shouldForceOrderRefresh),
            shouldDisableRequestingFeeOrders || isMakerAssetZrxToken
                ? Promise.resolve(constants.EMPTY_ORDERS_AND_FILLABLE_AMOUNTS)
                : this.getOrdersAndFillableAmountsAsync(zrxTokenAssetData, takerAssetData, shouldForceOrderRefresh),
            shouldForceOrderRefresh,
        ]);

        if (ordersAndFillableAmounts.orders.length === 0) {
            throw new Error(
                `${
                    SwapQuoterError.AssetUnavailable
                }: For makerAssetdata ${makerAssetData} and takerAssetdata ${takerAssetData}`,
            );
        }

        let swapQuote: SwapQuote;

        if (marketOperation === MarketOperation.Buy) {
            swapQuote = swapQuoteCalculator.calculateMarketBuySwapQuote(
                ordersAndFillableAmounts,
                feeOrdersAndFillableAmounts,
                assetFillAmount,
                slippagePercentage,
                isMakerAssetZrxToken,
                shouldDisableRequestingFeeOrders,
            );
        } else {
            swapQuote = swapQuoteCalculator.calculateMarketSellSwapQuote(
                ordersAndFillableAmounts,
                feeOrdersAndFillableAmounts,
                assetFillAmount,
                slippagePercentage,
                isMakerAssetZrxToken,
                shouldDisableRequestingFeeOrders,
            );
        }

        return swapQuote;
    }
}
