import { ERC20BridgeSource, SwapQuoter } from '@0x/asset-swapper';
import { AssetProxyId } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';

import { DEFAULT_GAS_PRICE } from '../constants';
import { Asset } from '../types';

// TODO(dave4506) rather arbitrarily chosen
const ASSET_UNIT_TEST_AMOUNT = new BigNumber(100);

export const swapQuoterUtils = {
    isAssetLiquiditySupportedWithBridgeOrdersAsync: async (swapQuoter: SwapQuoter, asset: Asset): Promise<boolean> => {
        const baseUnitValue =
            asset.metaData.assetProxyId === AssetProxyId.ERC20
                ? Web3Wrapper.toBaseUnitAmount(ASSET_UNIT_TEST_AMOUNT, asset.metaData.decimals)
                : ASSET_UNIT_TEST_AMOUNT;

        const wethAssetData = await swapQuoter.getEtherTokenAssetDataOrThrowAsync();
        try {
            const quote = await swapQuoter.getMarketBuySwapQuoteForAssetDataAsync(
                asset.assetData,
                wethAssetData,
                baseUnitValue,
                {
                    gasPrice: DEFAULT_GAS_PRICE,
                    excludedSources: [ERC20BridgeSource.Native],
                },
            );
            return Promise.resolve(quote.orders.length !== 0);
        } catch (error) {
            return Promise.resolve(false);
        }
    },
};
