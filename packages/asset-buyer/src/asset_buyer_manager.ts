import { HttpClient } from '@0xproject/connect';
import { ContractWrappers } from '@0xproject/contract-wrappers';
import { SignedOrder } from '@0xproject/order-utils';
import { ObjectMap } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Provider } from 'ethereum-types';
import * as _ from 'lodash';

import { AssetBuyer } from './asset_buyer';
import { constants } from './constants';
import { BasicOrderProvider } from './order_providers/basic_order_provider';
import { StandardRelayerAPIOrderProvider } from './order_providers/standard_relayer_api_order_provider';
import { assert } from './utils/assert';
import { assetDataUtils } from './utils/asset_data_utils';

import {
    AssetBuyerManagerError,
    AssetBuyerOpts,
    BuyQuote,
    BuyQuoteExecutionOpts,
    BuyQuoteRequestOpts,
    OrderProvider,
} from './types';

export class AssetBuyerManager {
    // Map of assetData to AssetBuyer for that assetData
    private readonly _assetBuyerMap: ObjectMap<AssetBuyer>;
    /**
     * Returns an array of all assetDatas available at the provided sraApiUrl
     * @param   sraApiUrl               The standard relayer API base HTTP url you would like to source orders from.
     * @param   pairedWithAssetData     Optional filter argument to return assetDatas that only pair with this assetData value.
     *
     * @return  An array of all assetDatas available at the provider sraApiUrl
     */
    public static async getAllAvailableAssetDatasAsync(
        sraApiUrl: string,
        pairedWithAssetData?: string,
    ): Promise<string[]> {
        const client = new HttpClient(sraApiUrl);
        const params = {
            assetDataA: pairedWithAssetData,
            perPage: constants.MAX_PER_PAGE,
        };
        const assetPairsResponse = await client.getAssetPairsAsync(params);
        return _.uniq(_.map(assetPairsResponse.records, pairsItem => pairsItem.assetDataB.assetData));
    }
    /**
     * Instantiates a new AssetBuyerManager instance with all available assetDatas at the provided sraApiUrl
     * @param   provider                The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   sraApiUrl               The standard relayer API base HTTP url you would like to source orders from.
     * @param   options                 Initialization options for an AssetBuyer. See type definition for details.
     *
     * @return  An promise of an instance of AssetBuyerManager
     */
    public static async getAssetBuyerManagerFromStandardRelayerApiAsync(
        provider: Provider,
        sraApiUrl: string,
        options: Partial<AssetBuyerOpts>,
    ): Promise<AssetBuyerManager> {
        const networkId = options.networkId || constants.MAINNET_NETWORK_ID;
        const contractWrappers = new ContractWrappers(provider, { networkId });
        const etherTokenAssetData = assetDataUtils.getEtherTokenAssetDataOrThrow(contractWrappers);
        const assetDatas = await AssetBuyerManager.getAllAvailableAssetDatasAsync(sraApiUrl, etherTokenAssetData);
        const orderProvider = new StandardRelayerAPIOrderProvider(sraApiUrl);
        return new AssetBuyerManager(provider, assetDatas, orderProvider, options);
    }
    /**
     * Instantiates a new AssetBuyerManager instance given existing liquidity in the form of orders and feeOrders.
     * @param   provider                The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   orders                  A non-empty array of objects that conform to SignedOrder. All orders must have the same makerAssetData and takerAssetData (WETH).
     * @param   feeOrders               A array of objects that conform to SignedOrder. All orders must have the same makerAssetData (ZRX) and takerAssetData (WETH). Defaults to an empty array.
     * @param   options                 Initialization options for an AssetBuyer. See type definition for details.
     *
     * @return  An instance of AssetBuyerManager
     */
    public static getAssetBuyerManagerFromProvidedOrders(
        provider: Provider,
        orders: SignedOrder[],
        feeOrders: SignedOrder[] = [],
        options: Partial<AssetBuyerOpts>,
    ): AssetBuyerManager {
        const assetDatas = _.map(orders, order => order.makerAssetData);
        const orderProvider = new BasicOrderProvider(_.concat(orders, feeOrders));
        return new AssetBuyerManager(provider, assetDatas, orderProvider, options);
    }
    /**
     * Instantiates a new AssetBuyerManager instance
     * @param   provider                The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   assetDatas              The assetDatas of the desired assets to buy (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   orderProvider           An object that conforms to OrderProvider, see type for definition.
     * @param   options                 Initialization options for an AssetBuyer. See type definition for details.
     *
     * @return  An instance of AssetBuyerManager
     */
    constructor(
        provider: Provider,
        assetDatas: string[],
        orderProvider: OrderProvider,
        options: Partial<AssetBuyerOpts>,
    ) {
        assert.assert(assetDatas.length > 0, `Expected 'assetDatas' to be a non-empty array.`);
        this._assetBuyerMap = _.reduce(
            assetDatas,
            (accAssetBuyerMap: ObjectMap<AssetBuyer>, assetData: string) => {
                accAssetBuyerMap[assetData] = new AssetBuyer(provider, assetData, orderProvider, options);
                return accAssetBuyerMap;
            },
            {},
        );
    }
    /**
     * Get an AssetBuyer for the provided assetData
     * @param   assetData   The desired assetData.
     *
     * @return  An instance of AssetBuyer
     */
    public getAssetBuyerFromAssetData(assetData: string): AssetBuyer {
        const assetBuyer = this._assetBuyerMap[assetData];
        if (_.isUndefined(assetBuyer)) {
            throw new Error(`${AssetBuyerManagerError.AssetBuyerNotFound}: For assetData ${assetData}`);
        }
        return assetBuyer;
    }
    /**
     * Get an AssetBuyer for the provided ERC20 tokenAddress
     * @param   tokenAddress    The desired tokenAddress.
     *
     * @return  An instance of AssetBuyer
     */
    public getAssetBuyerFromERC20TokenAddress(tokenAddress: string): AssetBuyer {
        const assetData = assetDataUtils.encodeERC20AssetData(tokenAddress);
        return this.getAssetBuyerFromAssetData(assetData);
    }
    /**
     * Get a list of all the assetDatas that the instance supports
     *
     * @return  An array of assetData strings
     */
    public getAssetDatas(): string[] {
        return _.keys(this._assetBuyerMap);
    }
    /**
     * Get a `BuyQuote` containing all information relevant to fulfilling a buy.
     * You can then pass the `BuyQuote` to `executeBuyQuoteAsync` to execute the buy.
     *
     * @param   assetData           The assetData that identifies the desired asset to buy.
     * @param   assetBuyAmount      The amount of asset to buy.
     * @param   options             Options for the execution of the BuyQuote. See type definition for more information.
     *
     * @return  An object that conforms to BuyQuote that satisfies the request. See type definition for more information.
     */
    public async getBuyQuoteAsync(
        assetData: string,
        assetBuyAmount: BigNumber,
        options: Partial<BuyQuoteRequestOpts>,
    ): Promise<BuyQuote> {
        return this.getAssetBuyerFromAssetData(assetData).getBuyQuoteAsync(assetBuyAmount, options);
    }
    /**
     * Given a BuyQuote and desired rate, attempt to execute the buy.
     * @param   buyQuote        An object that conforms to BuyQuote. See type definition for more information.
     * @param   rate            The desired rate to execute the buy at. Affects the amount of ETH sent with the transaction, defaults to buyQuote.maxRate.
     * @param   takerAddress    The address to perform the buy. Defaults to the first available address from the provider.
     * @param   feeRecipient    The address where affiliate fees are sent. Defaults to null address (0x000...000).
     *
     * @return  A promise of the txHash.
     */
    public async executeBuyQuoteAsync(buyQuote: BuyQuote, options: Partial<BuyQuoteExecutionOpts>): Promise<string> {
        return this.getAssetBuyerFromAssetData(buyQuote.assetData).executeBuyQuoteAsync(buyQuote, options);
    }
}
