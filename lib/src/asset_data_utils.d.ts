import { AssetData, ERC1155AssetData, ERC20AssetData, ERC20BridgeAssetData, ERC721AssetData, MultiAssetData, MultiAssetDataWithRecursiveDecoding, StaticCallAssetData } from '@0x/types';
import { BigNumber } from '@0x/utils';
export declare const assetDataUtils: {
    encodeERC20AssetData(tokenAddress: string): string;
    encodeERC20BridgeAssetData(tokenAddress: string, bridgeAddress: string, bridgeData: string): string;
    encodeERC721AssetData(tokenAddress: string, tokenId: BigNumber): string;
    encodeERC1155AssetData(tokenAddress: string, tokenIds: BigNumber[], tokenValues: BigNumber[], callbackData: string): string;
    encodeMultiAssetData(values: BigNumber[], nestedAssetData: string[]): string;
    encodeStaticCallAssetData(staticCallTargetAddress: string, staticCallData: string, expectedReturnDataHash: string): string;
    /**
     * Decode any assetData into its corresponding assetData object
     * @param assetData Hex encoded assetData string to decode
     * @return Either a ERC20, ERC20Bridge, ERC721, ERC1155, StaticCall, or MultiAsset assetData object
     */
    decodeAssetDataOrThrow(assetData: string): AssetData;
    /**
     * Decodes a MultiAsset assetData hex string into its corresponding amounts and decoded nestedAssetData elements (all nested elements are flattened)
     * @param assetData Hex encoded assetData string to decode
     * @return An object containing the decoded amounts and nestedAssetData
     */
    decodeMultiAssetDataRecursively(assetData: string): MultiAssetDataWithRecursiveDecoding;
    isERC20TokenAssetData(assetData: AssetData): assetData is ERC20AssetData;
    isERC20BridgeAssetData(assetData: AssetData): assetData is ERC20BridgeAssetData;
    isERC1155TokenAssetData(assetData: AssetData): assetData is ERC1155AssetData;
    isERC721TokenAssetData(assetData: AssetData): assetData is ERC721AssetData;
    isMultiAssetData(assetData: AssetData): assetData is MultiAssetData;
    isStaticCallAssetData(assetData: AssetData): assetData is StaticCallAssetData;
};
//# sourceMappingURL=asset_data_utils.d.ts.map