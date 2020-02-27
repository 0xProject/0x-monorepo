import { SignedOrder } from '@0x/order-utils';
import { MeshOrderProviderOpts, Orderbook, SRAPollingOrderProviderOpts } from '@0x/orderbook';
import { BigNumber } from '@0x/utils';
import { SupportedProvider, ZeroExProvider } from 'ethereum-types';
import { LiquidityForTakerMakerAssetDataPair, MarketBuySwapQuote, MarketSellSwapQuote, OrderPrunerPermittedFeeTypes, SignedOrderWithFillableAmounts, SwapQuote, SwapQuoteRequestOpts, SwapQuoterOpts } from './types';
export declare class SwapQuoter {
    readonly provider: ZeroExProvider;
    readonly orderbook: Orderbook;
    readonly expiryBufferMs: number;
    readonly chainId: number;
    readonly permittedOrderFeeTypes: Set<OrderPrunerPermittedFeeTypes>;
    private readonly _contractAddresses;
    private readonly _protocolFeeUtils;
    private readonly _swapQuoteCalculator;
    private readonly _devUtilsContract;
    private readonly _marketOperationUtils;
    private readonly _orderStateUtils;
    /**
     * Instantiates a new SwapQuoter instance given existing liquidity in the form of orders and feeOrders.
     * @param   supportedProvider   The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   orders              A non-empty array of objects that conform to SignedOrder. All orders must have the same makerAssetData and takerAssetData.
     * @param   options             Initialization options for the SwapQuoter. See type definition for details.
     *
     * @return  An instance of SwapQuoter
     */
    static getSwapQuoterForProvidedOrders(supportedProvider: SupportedProvider, orders: SignedOrder[], options?: Partial<SwapQuoterOpts>): SwapQuoter;
    /**
     * Instantiates a new SwapQuoter instance given a [Standard Relayer API](https://github.com/0xProject/standard-relayer-api) endpoint
     * @param   supportedProvider  The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   sraApiUrl          The standard relayer API base HTTP url you would like to source orders from.
     * @param   options            Initialization options for the SwapQuoter. See type definition for details.
     *
     * @return  An instance of SwapQuoter
     */
    static getSwapQuoterForStandardRelayerAPIUrl(supportedProvider: SupportedProvider, sraApiUrl: string, options?: Partial<SwapQuoterOpts & SRAPollingOrderProviderOpts>): SwapQuoter;
    /**
     * Instantiates a new SwapQuoter instance given a [Standard Relayer API](https://github.com/0xProject/standard-relayer-api) endpoint
     * and a websocket endpoint. This is more effecient than `getSwapQuoterForStandardRelayerAPIUrl` when requesting multiple quotes.
     * @param   supportedProvider    The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   sraApiUrl            The standard relayer API base HTTP url you would like to source orders from.
     * @param   sraWebsocketApiUrl   The standard relayer API Websocket url you would like to subscribe to.
     * @param   options              Initialization options for the SwapQuoter. See type definition for details.
     *
     * @return  An instance of SwapQuoter
     */
    static getSwapQuoterForStandardRelayerAPIWebsocket(supportedProvider: SupportedProvider, sraApiUrl: string, sraWebsocketAPIUrl: string, options?: Partial<SwapQuoterOpts>): SwapQuoter;
    /**
     * Instantiates a new SwapQuoter instance given a 0x Mesh endpoint. This pulls all available liquidity stored in Mesh
     * @param   supportedProvider The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   meshEndpoint      The standard relayer API base HTTP url you would like to source orders from.
     * @param   options           Initialization options for the SwapQuoter. See type definition for details.
     *
     * @return  An instance of SwapQuoter
     */
    static getSwapQuoterForMeshEndpoint(supportedProvider: SupportedProvider, meshEndpoint: string, options?: Partial<SwapQuoterOpts & MeshOrderProviderOpts>): SwapQuoter;
    /**
     * Instantiates a new SwapQuoter instance
     * @param   supportedProvider   The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   orderbook           An object that conforms to Orderbook, see type for definition.
     * @param   options             Initialization options for the SwapQuoter. See type definition for details.
     *
     * @return  An instance of SwapQuoter
     */
    constructor(supportedProvider: SupportedProvider, orderbook: Orderbook, options?: Partial<SwapQuoterOpts>);
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
    getMarketSellSwapQuoteForAssetDataAsync(makerAssetData: string, takerAssetData: string, takerAssetSellAmount: BigNumber, options?: Partial<SwapQuoteRequestOpts>): Promise<MarketSellSwapQuote>;
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
    getMarketBuySwapQuoteForAssetDataAsync(makerAssetData: string, takerAssetData: string, makerAssetBuyAmount: BigNumber, options?: Partial<SwapQuoteRequestOpts>): Promise<MarketBuySwapQuote>;
    getBatchMarketBuySwapQuoteForAssetDataAsync(makerAssetDatas: string[], takerAssetData: string, makerAssetBuyAmount: BigNumber[], options?: Partial<SwapQuoteRequestOpts>): Promise<Array<MarketBuySwapQuote | undefined>>;
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
    getMarketBuySwapQuoteAsync(makerTokenAddress: string, takerTokenAddress: string, makerAssetBuyAmount: BigNumber, options?: Partial<SwapQuoteRequestOpts>): Promise<MarketBuySwapQuote>;
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
    getMarketSellSwapQuoteAsync(makerTokenAddress: string, takerTokenAddress: string, takerAssetSellAmount: BigNumber, options?: Partial<SwapQuoteRequestOpts>): Promise<MarketSellSwapQuote>;
    /**
     * Returns information about available liquidity for an asset
     * Does not factor in slippage or fees
     * @param   makerAssetData      The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetData      The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     *
     * @return  An object that conforms to LiquidityForTakerMakerAssetDataPair that satisfies the request. See type definition for more information.
     */
    getLiquidityForMakerTakerAssetDataPairAsync(makerAssetData: string, takerAssetData: string): Promise<LiquidityForTakerMakerAssetDataPair>;
    /**
     * Get the asset data of all assets that can be used to purchase makerAssetData in the order provider passed in at init.
     *
     * @return  An array of asset data strings that can purchase makerAssetData.
     */
    getAvailableTakerAssetDatasAsync(makerAssetData: string): Promise<string[]>;
    /**
     * Get the asset data of all assets that are purchaseable with takerAssetData in the order provider passed in at init.
     *
     * @return  An array of asset data strings that are purchaseable with takerAssetData.
     */
    getAvailableMakerAssetDatasAsync(takerAssetData: string): Promise<string[]>;
    /**
     * Validates the taker + maker asset pair is available from the order provider provided to `SwapQuote`.
     * @param   makerAssetData      The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetData      The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     *
     * @return  A boolean on if the taker, maker pair exists
     */
    isTakerMakerAssetDataPairAvailableAsync(makerAssetData: string, takerAssetData: string): Promise<boolean>;
    /**
     * Grab orders from the order provider, prunes for valid orders with provided OrderPruner options
     * @param   makerAssetData      The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetData      The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     */
    getSignedOrdersWithFillableAmountsAsync(makerAssetData: string, takerAssetData: string): Promise<SignedOrderWithFillableAmounts[]>;
    /**
     * Util function to check if takerAddress's allowance is enough for 0x exchange contracts to conduct the swap specified by the swapQuote.
     * @param swapQuote The swapQuote in question to check enough allowance enabled for 0x exchange contracts to conduct the swap.
     * @param takerAddress The address of the taker of the provided swapQuote
     */
    isSwapQuoteFillableByTakerAddressAsync(swapQuote: SwapQuote, takerAddress: string): Promise<[boolean, boolean]>;
    /**
     * Destroys any subscriptions or connections.
     */
    destroyAsync(): Promise<void>;
    /**
     * Utility function to get assetData for Ether token.
     */
    getEtherTokenAssetDataOrThrowAsync(): Promise<string>;
    /**
     * Grab orders from the order provider, prunes for valid orders with provided OrderPruner options
     * @param   makerAssetData      The makerAssetData of the desired asset to swap for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   takerAssetData      The takerAssetData of the asset to swap makerAssetData for (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     */
    private _getSignedOrdersAsync;
    /**
     * General function for getting swap quote, conditionally uses different logic per specified marketOperation
     */
    private _getSwapQuoteAsync;
}
//# sourceMappingURL=swap_quoter.d.ts.map