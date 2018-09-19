import { HttpClient } from '@0xproject/connect';
import { ContractWrappers } from '@0xproject/contract-wrappers';
import { ObjectMap } from '@0xproject/types';
import { Provider } from 'ethereum-types';
import * as _ from 'lodash';

import { AssetBuyer } from './asset_buyer';
import { constants } from './constants';
import { assert } from './utils/assert';
import { assetDataUtils } from './utils/asset_data_utils';

import { OrderFetcher, StandardRelayerApiAssetBuyerManagerError } from './types';

export class StandardRelayerAPIAssetBuyerManager {
    // Map of assetData to AssetBuyer for that assetData
    public readonly assetBuyerMap: ObjectMap<AssetBuyer>;
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
     * Instantiates a new StandardRelayerAPIAssetBuyerManager instance with all available assetDatas at the provided sraApiUrl
     * @param   provider                The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   sraApiUrl               The standard relayer API base HTTP url you would like to source orders from.
     * @param   orderFetcher            An object that conforms to OrderFetcher, see type for definition.
     * @param   networkId               The ethereum network id. Defaults to 1 (mainnet).
     * @param   orderRefreshIntervalMs  The interval in ms that getBuyQuoteAsync should trigger an refresh of orders and order states.
     *                                  Defaults to 10000ms (10s).
     * @return  An promise of an instance of StandardRelayerAPIAssetBuyerManager
     */
    public static async getAssetBuyerManagerWithAllAvailableAssetDatasAsync(
        provider: Provider,
        sraApiUrl: string,
        orderFetcher: OrderFetcher,
        networkId: number = constants.MAINNET_NETWORK_ID,
        orderRefreshIntervalMs?: number,
    ): Promise<StandardRelayerAPIAssetBuyerManager> {
        const contractWrappers = new ContractWrappers(provider, { networkId });
        const etherTokenAssetData = assetDataUtils.getEtherTokenAssetData(contractWrappers);
        const assetDatas = await StandardRelayerAPIAssetBuyerManager.getAllAvailableAssetDatasAsync(
            sraApiUrl,
            etherTokenAssetData,
        );
        return new StandardRelayerAPIAssetBuyerManager(
            provider,
            assetDatas,
            orderFetcher,
            networkId,
            orderRefreshIntervalMs,
        );
    }
    /**
     * Instantiates a new StandardRelayerAPIAssetBuyerManager instance
     * @param   provider                The Provider instance you would like to use for interacting with the Ethereum network.
     * @param   assetDatas              The assetDatas of the desired assets to buy (for more info: https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
     * @param   orderFetcher            An object that conforms to OrderFetcher, see type for definition.
     * @param   networkId               The ethereum network id. Defaults to 1 (mainnet).
     * @param   orderRefreshIntervalMs  The interval in ms that getBuyQuoteAsync should trigger an refresh of orders and order states.
     *                                  Defaults to 10000ms (10s).
     * @return  An instance of StandardRelayerAPIAssetBuyerManager
     */
    constructor(
        provider: Provider,
        assetDatas: string[],
        orderFetcher: OrderFetcher,
        networkId?: number,
        orderRefreshIntervalMs?: number,
    ) {
        assert.assert(assetDatas.length > 0, `Expected 'assetDatas' to be a non-empty array.`);
        this.assetBuyerMap = _.reduce(
            assetDatas,
            (accAssetBuyerMap: ObjectMap<AssetBuyer>, assetData: string) => {
                accAssetBuyerMap[assetData] = new AssetBuyer(
                    provider,
                    assetData,
                    orderFetcher,
                    networkId,
                    orderRefreshIntervalMs,
                );
                return accAssetBuyerMap;
            },
            {},
        );
    }
    /**
     * Get a AssetBuyer for the provided assetData
     * @param   assetData   The desired assetData.
     *
     * @return  An instance of AssetBuyer
     */
    public getAssetBuyerFromAssetData(assetData: string): AssetBuyer {
        const assetBuyer = this.assetBuyerMap[assetData];
        if (_.isUndefined(assetBuyer)) {
            throw new Error(
                `${StandardRelayerApiAssetBuyerManagerError.AssetBuyerNotFound}: For assetData ${assetData}`,
            );
        }
        return assetBuyer;
    }
    /**
     * Get a AssetBuyer for the provided ERC20 tokenAddress
     * @param   tokenAddress    The desired tokenAddress.
     *
     * @return  An instance of AssetBuyer
     */
    public getAssetBuyerFromERC20TokenAddress(tokenAddress: string): AssetBuyer {
        const assetData = assetDataUtils.encodeERC20AssetData(tokenAddress);
        return this.getAssetBuyerFromAssetData(assetData);
    }
}
