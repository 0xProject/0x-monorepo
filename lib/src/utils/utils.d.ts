import { AssetData, ERC20AssetData, ERC20BridgeAssetData, Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
export declare const utils: {
    numberPercentageToEtherTokenAmountPercentage(percentage: number): BigNumber;
    isOrderTakerFeePayableWithMakerAsset<T extends Order>(order: T): boolean;
    isOrderTakerFeePayableWithTakerAsset<T extends Order>(order: T): boolean;
    getAdjustedMakerAndTakerAmountsFromTakerFees<T extends Order>(order: T): [BigNumber, BigNumber];
    isExactAssetData(expectedAssetData: string, actualAssetData: string): boolean;
    /**
     * Compare the Asset Data for equivalency. Expected is the asset data the user provided (wanted),
     * actual is the asset data found or created.
     */
    isAssetDataEquivalent(expectedAssetData: string, actualAssetData: string): boolean;
    isERC20EquivalentAssetData(assetData: AssetData): assetData is ERC20AssetData | ERC20BridgeAssetData;
};
//# sourceMappingURL=utils.d.ts.map