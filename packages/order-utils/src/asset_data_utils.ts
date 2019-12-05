import { IAssetDataContract } from '@0x/contract-wrappers';
import { AssetData, AssetProxyId } from '@0x/types';
import { BigNumber, hexUtils, NULL_ADDRESS } from '@0x/utils';

const fakeProvider = { isEIP1193: true } as any;
const assetDataEncoder = new IAssetDataContract(NULL_ADDRESS, fakeProvider);

export const assetDataUtils = {
    encodeERC20AssetData(tokenAddress: string): string {
        return assetDataEncoder.ERC20Token(tokenAddress).getABIEncodedTransactionData();
    },
    encodeERC20BridgeAssetData(tokenAddress: string, bridgeAddress: string, bridgeData: string): string {
        return assetDataEncoder.ERC20Bridge(tokenAddress, bridgeAddress, bridgeData).getABIEncodedTransactionData();
    },
    encodeERC721AssetData(tokenAddress: string, tokenId: BigNumber): string {
        return assetDataEncoder.ERC721Token(tokenAddress, tokenId).getABIEncodedTransactionData();
    },
    encodeERC1155AssetData(
        tokenAddress: string,
        tokenIds: BigNumber[],
        tokenValues: BigNumber[],
        callbackData: string,
    ): string {
        return assetDataEncoder
            .ERC1155Assets(tokenAddress, tokenIds, tokenValues, callbackData)
            .getABIEncodedTransactionData();
    },
    encodeMultiAssetData(values: BigNumber[], nestedAssetData: string[]): string {
        return assetDataEncoder.MultiAsset(values, nestedAssetData).getABIEncodedTransactionData();
    },
    encodeStaticCallAssetData(
        staticCallTargetAddress: string,
        staticCallData: string,
        expectedReturnDataHash: string,
    ): string {
        return assetDataEncoder
            .StaticCall(staticCallTargetAddress, staticCallData, expectedReturnDataHash)
            .getABIEncodedTransactionData();
    },
    /**
     * Decode any assetData into its corresponding assetData object
     * @param assetData Hex encoded assetData string to decode
     * @return Either a ERC20, ERC20Bridge, ERC721, ERC1155, StaticCall, or MultiAsset assetData object
     */
    decodeAssetDataOrThrow(assetData: string): AssetData {
        const assetProxyId = hexUtils.slice(assetData, 0, 4); // tslint:disable-line:custom-no-magic-numbers
        switch (assetProxyId) {
            case AssetProxyId.ERC20: {
                const tokenAddress = assetDataEncoder.getABIDecodedTransactionData<string>('ERC20Token', assetData);
                return {
                    assetProxyId,
                    tokenAddress,
                };
            }
            case AssetProxyId.ERC20Bridge: {
                const [tokenAddress, bridgeAddress, bridgeData] = assetDataEncoder.getABIDecodedTransactionData<
                    [string, string, string]
                >('ERC20Bridge', assetData);
                return {
                    assetProxyId,
                    tokenAddress,
                    bridgeAddress,
                    bridgeData,
                };
            }
            case AssetProxyId.ERC721: {
                const [tokenAddress, tokenId] = assetDataEncoder.getABIDecodedTransactionData<[string, BigNumber]>(
                    'ERC721Token',
                    assetData,
                );
                return {
                    assetProxyId,
                    tokenAddress,
                    tokenId,
                };
            }
            case AssetProxyId.ERC1155: {
                const [tokenAddress, tokenIds, tokenValues, callbackData] = assetDataEncoder.getABIDecodedTransactionData<
                    [string, BigNumber[], BigNumber[], string]
                >('ERC1155Assets', assetData);
                return {
                    assetProxyId,
                    tokenAddress,
                    tokenIds,
                    tokenValues,
                    callbackData,
                };
            }
            case AssetProxyId.MultiAsset: {
                const [amounts, nestedAssetData] = assetDataEncoder.getABIDecodedTransactionData<
                    [BigNumber[], string[]]
                >('MultiAsset', assetData);
                return {
                    assetProxyId,
                    amounts,
                    nestedAssetData,
                };
            }
            case AssetProxyId.StaticCall:
                const [callTarget, staticCallData, callResultHash] = assetDataEncoder.getABIDecodedTransactionData<
                    [string, string, string]
                >('StaticCall', assetData);
                return {
                    assetProxyId,
                    callTarget,
                    staticCallData,
                    callResultHash,
                };
            default:
                throw new Error(`Unhandled asset proxy ID: ${assetProxyId}`);
        }
    },
};
