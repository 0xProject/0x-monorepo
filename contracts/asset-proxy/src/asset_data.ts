import { AssetProxyId } from '@0x/types';
import { BigNumber, hexUtils } from '@0x/utils';

import { IAssetDataContract } from './wrappers';

const assetDataIface = new IAssetDataContract(
    '0x0000000000000000000000000000000000000000',
    { isEIP1193: true } as any,
);

/**
 * Get the proxy ID from encoded asset data.
 */
export function getAssetDataProxyId(encoded: string): AssetProxyId {
    // tslint:disable-next-line: no-unnecessary-type-assertion
    return hexUtils.slice(encoded, 0, 4) as AssetProxyId;
}

/**
 * Decode ERC20 asset data.
 */
export function decodeERC20AssetData(encoded: string): string {
    return assetDataIface.getABIDecodedTransactionData<string>('ERC20Token', encoded);
}

/**
 * Decode ERC721 asset data.
 */
export function decodeERC721AssetData(encoded: string): [string, BigNumber] {
    return assetDataIface.getABIDecodedTransactionData<[string, BigNumber]>('ERC721Token', encoded);
}

/**
 * Decode ERC1155 asset data.
 */
export function decodeERC1155AssetData(encoded: string): [string, BigNumber[], BigNumber[], string] {
    return assetDataIface
        .getABIDecodedTransactionData<[string, BigNumber[], BigNumber[], string]>('ERC1155Assets', encoded);
}

/**
 * Decode MultiAsset asset data.
 */
export function decodeMultiAssetData(encoded: string): [BigNumber[], string[]] {
    return assetDataIface.getABIDecodedTransactionData<[BigNumber[], string[]]>('MultiAsset', encoded);
}

/**
 * Decode StaticCall asset data.
 */
export function decodeStaticCallAssetData(encoded: string): [string, string, string] {
    return assetDataIface.getABIDecodedTransactionData<[string, string, string]>('StaticCall', encoded);
}

/**
 * Decode ERC20Bridge asset data.
 */
export function decodeERC20BridgeAssetData(encoded: string): [string, string, string] {
    return assetDataIface.getABIDecodedTransactionData<[string, string, string]>('ERC20Bridge', encoded);
}

/**
 * Encode ERC20 asset data.
 */
export function encodeERC20AssetData(tokenAddress: string): string {
    return assetDataIface.ERC20Token(tokenAddress).getABIEncodedTransactionData();
}

/**
 * Encode ERC721 asset data.
 */
export function encodeERC721AssetData(tokenAddress: string, tokenId: BigNumber): string {
    return assetDataIface.ERC721Token(tokenAddress, tokenId).getABIEncodedTransactionData();
}

/**
 * Encode ERC1155 asset data.
 */
export function encodeERC1155AssetData(
    tokenAddress: string,
    tokenIds: BigNumber[],
    values: BigNumber[],
    callbackData: string,
): string {
    return assetDataIface.ERC1155Assets(
        tokenAddress,
        tokenIds,
        values,
        callbackData,
    ).getABIEncodedTransactionData();
}

/**
 * Encode MultiAsset asset data.
 */
export function encodeMultiAssetData(values: BigNumber[], nestedAssetData: string[]): string {
    return assetDataIface.MultiAsset(values, nestedAssetData).getABIEncodedTransactionData();
}

/**
 * Encode StaticCall asset data.
 */
export function encodeStaticCallAssetData(
    staticCallTargetAddress: string,
    staticCallData: string,
    expectedReturnDataHash: string,
): string {
    return assetDataIface.StaticCall(
        staticCallTargetAddress,
        staticCallData,
        expectedReturnDataHash,
    ).getABIEncodedTransactionData();
}

/**
 * Encode ERC20Bridge asset data.
 */
export function encodeERC20BridgeAssetData(
    tokenAddress: string,
    bridgeAddress: string,
    bridgeData: string,
): string {
    return assetDataIface.ERC20Bridge(
        tokenAddress,
        bridgeAddress,
        bridgeData,
    ).getABIEncodedTransactionData();
}
