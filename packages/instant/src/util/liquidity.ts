import { assert } from '@0x/assert';
import { HttpClient } from '@0x/connect';
import { assetDataUtils } from '@0x/order-utils';

import { Network } from '../types';

// TODO: move to constants
const MAINNET_WETH_ASSET_DATA = '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

export const checkErc20TokenLiquidityAsync = async (sraApiUrl: string, erc20TokenAddress: string) => {
    assert.isWebUri('sraApiUrl', sraApiUrl);
    assert.isETHAddressHex('erc20TokenAddress', erc20TokenAddress);

    const tokenAssetData = assetDataUtils.encodeERC20AssetData(erc20TokenAddress);
    const httpClient = new HttpClient(sraApiUrl);
    const response = await httpClient.getAssetPairsAsync({
        networkId: Network.Mainnet,
        assetDataA: MAINNET_WETH_ASSET_DATA,
        assetDataB: tokenAssetData,
        perPage: 1000,
    });
    const supported = response.records.length > 0;
    return { supported };
};
