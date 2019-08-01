import { schemas } from '@0x/json-schemas';
import { SignedOrder } from '@0x/types';
import { BigNumber, providerUtils } from '@0x/utils';
import { SupportedProvider, ZeroExProvider } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from './constants';
import { BasicOrderProvider } from './order_providers/basic_order_provider';
import { StandardRelayerAPIOrderProvider } from './order_providers/standard_relayer_api_order_provider';
import { SwapQuoteConsumer } from './quote_consumers/swap_quote_consumer';
import { SwapQuoter } from './swap_quoter';
import {
    AssetSwapperExecutionOptions,
    AssetSwapperGetOptions,
    AssetSwapperOpts,
    CalldataInfo,
    OrderProvider,
    SmartContractParams,
    SmartContractParamsInfo,
} from './types';
import { assert } from './utils/assert';

export class AssetSwapper {
    public readonly provider: ZeroExProvider;
    public readonly networkId: number;

    private readonly _swapQuoter: SwapQuoter;
    private readonly _swapQuoteConsumer: SwapQuoteConsumer;

    /**
     * Instantiates a new SwapQuoter instance given existing liquidity in the form of orders and feeOrders.
     * @param   supportedProvider       The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   orders                  A non-empty array of objects that conform to SignedOrder. All orders must have the same makerAssetData and takerAssetData.
     * @param   options                 Initialization options for the SwapQuoter. See type definition for details.
     *
     * @return  An instance of SwapQuoter
     */
    public static getAssetSwapperForProvidedOrders(
        supportedProvider: SupportedProvider,
        orders: SignedOrder[],
        options: Partial<AssetSwapperOpts> = {},
    ): AssetSwapper {
        assert.doesConformToSchema('orders', orders, schemas.signedOrdersSchema);
        assert.assert(orders.length !== 0, `Expected orders to contain at least one order`);
        const orderProvider = new BasicOrderProvider(orders);
        const assetSwapper = new AssetSwapper(supportedProvider, orderProvider, options);
        return assetSwapper;
    }

    /**
     * Instantiates a new SwapQuoter instance given a [Standard Relayer API](https://github.com/0xProject/standard-relayer-api) endpoint
     * @param   supportedProvider       The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   sraApiUrl               The standard relayer API base HTTP url you would like to source orders from.
     * @param   options                 Initialization options for the SwapQuoter. See type definition for details.
     *
     * @return  An instance of SwapQuoter
     */
    public static getAssetSwapperForStandardRelayerAPIUrl(
        supportedProvider: SupportedProvider,
        sraApiUrl: string,
        options: Partial<AssetSwapperOpts> = {},
    ): AssetSwapper {
        assert.isWebUri('sraApiUrl', sraApiUrl);
        const networkId = options.networkId || constants.DEFAULT_SWAP_QUOTER_OPTS.networkId;
        const orderProvider = new StandardRelayerAPIOrderProvider(sraApiUrl, networkId);
        const assetSwapper = new AssetSwapper(supportedProvider, orderProvider, options);
        return assetSwapper;
    }

    constructor(
        supportedProvider: SupportedProvider,
        orderProvider: OrderProvider,
        options: Partial<AssetSwapperOpts> = {},
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
        this.networkId = networkId;
        this._swapQuoter = new SwapQuoter(supportedProvider, orderProvider, options);
        this._swapQuoteConsumer = new SwapQuoteConsumer(supportedProvider, options);
    }

    public async getSellCalldataOrThrowAsync(
        makerAssetData: string,
        takerAssetData: string,
        takerAssetSellAmount: BigNumber,
        options: AssetSwapperGetOptions,
    ): Promise<CalldataInfo> {
        const quote = await this._swapQuoter.getMarketSellSwapQuoteForAssetDataAsync(
            makerAssetData,
            takerAssetData,
            takerAssetSellAmount,
            options,
        );
        return this._swapQuoteConsumer.getCalldataOrThrowAsync(quote, options);
    }

    public async getBuyCalldataOrThrowAsync(
        makerAssetData: string,
        takerAssetData: string,
        makerAssetBuyAmount: BigNumber,
        options: AssetSwapperGetOptions,
    ): Promise<CalldataInfo> {
        const quote = await this._swapQuoter.getMarketBuySwapQuoteForAssetDataAsync(
            makerAssetData,
            takerAssetData,
            makerAssetBuyAmount,
            options,
        );
        return this._swapQuoteConsumer.getCalldataOrThrowAsync(quote, options);
    }

    public async getSellSmartContractParamsOrThrowAsync(
        makerAssetData: string,
        takerAssetData: string,
        takerAssetSellAmount: BigNumber,
        options: AssetSwapperGetOptions,
    ): Promise<SmartContractParamsInfo<SmartContractParams>> {
        const quote = await this._swapQuoter.getMarketSellSwapQuoteForAssetDataAsync(
            makerAssetData,
            takerAssetData,
            takerAssetSellAmount,
            options,
        );
        return this._swapQuoteConsumer.getSmartContractParamsOrThrowAsync(quote, options);
    }

    public async getBuySmartContractParamsOrThrowAsync(
        makerAssetData: string,
        takerAssetData: string,
        makerAssetBuyAmount: BigNumber,
        options: AssetSwapperGetOptions,
    ): Promise<SmartContractParamsInfo<SmartContractParams>> {
        const quote = await this._swapQuoter.getMarketBuySwapQuoteForAssetDataAsync(
            makerAssetData,
            takerAssetData,
            makerAssetBuyAmount,
            options,
        );
        return this._swapQuoteConsumer.getSmartContractParamsOrThrowAsync(quote, options);
    }
    public async executeSellOrThrowAsync(
        makerAssetData: string,
        takerAssetData: string,
        takerAssetSellAmount: BigNumber,
        options: AssetSwapperExecutionOptions,
    ): Promise<string> {
        const quote = await this._swapQuoter.getMarketSellSwapQuoteForAssetDataAsync(
            makerAssetData,
            takerAssetData,
            takerAssetSellAmount,
        );
        return this._swapQuoteConsumer.executeSwapQuoteOrThrowAsync(quote, options);
    }

    public async executeBuyOrThrowAsync(
        makerAssetData: string,
        takerAssetData: string,
        makerAssetBuyAmount: BigNumber,
        options: AssetSwapperExecutionOptions,
    ): Promise<string> {
        const quote = await this._swapQuoter.getMarketBuySwapQuoteForAssetDataAsync(
            makerAssetData,
            takerAssetData,
            makerAssetBuyAmount,
            options,
        );
        return this._swapQuoteConsumer.executeSwapQuoteOrThrowAsync(quote, options);
    }
}
