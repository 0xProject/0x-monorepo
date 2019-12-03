import { IAssetDataContract } from '@0x/contract-wrappers';
import { AssetData, AssetProxyId } from '@0x/types';
import { BigNumber, hexSlice, NULL_ADDRESS } from '@0x/utils';

const fakeProvider = { isEIP1193: true } as any;
const assetDataDecoder = new IAssetDataContract(NULL_ADDRESS, fakeProvider);

/**
 * Decode any assetData into its corresponding assetData object
 * @param assetData Hex encoded assetData string to decode
 * @return Either a ERC20, ERC20Bridge, ERC721, ERC1155, StaticCall, or MultiAsset assetData object
 */
export function decodeAssetDataOrThrow(assetData: string): AssetData {
    const assetProxyId = hexSlice(assetData, 0, 4); // tslint:disable-line:custom-no-magic-numbers
    switch (assetProxyId) {
        case AssetProxyId.ERC20: {
            const tokenAddress = assetDataDecoder.getABIDecodedTransactionData<string>('ERC20Token', assetData);
            return {
                assetProxyId,
                tokenAddress,
            };
        }
        case AssetProxyId.ERC20Bridge: {
            const [tokenAddress, bridgeAddress, bridgeData] = assetDataDecoder.getABIDecodedTransactionData<
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
            const [tokenAddress, tokenId] = assetDataDecoder.getABIDecodedTransactionData<[string, BigNumber]>(
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
            const [tokenAddress, tokenIds, tokenValues] = assetDataDecoder.getABIDecodedTransactionData<
                [string, BigNumber[], BigNumber[]]
            >('ERC1155Assets', assetData);
            return {
                assetProxyId,
                tokenAddress,
                tokenIds,
                tokenValues,
            };
        }
        case AssetProxyId.MultiAsset: {
            const [amounts, nestedAssetData] = assetDataDecoder.getABIDecodedTransactionData<[BigNumber[], string[]]>(
                'MultiAsset',
                assetData,
            );
            return {
                assetProxyId,
                amounts,
                nestedAssetData,
            };
        }
        case AssetProxyId.StaticCall:
            const [callTarget, staticCallData, callResultHash] = assetDataDecoder.getABIDecodedTransactionData<
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
}
