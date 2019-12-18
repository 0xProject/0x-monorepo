import { DydxBridgeData, dydxBridgeDataEncoder } from '@0x/contracts-asset-proxy';
import { IAssetDataContract } from '@0x/contract-wrappers';
import {
    AssetData,
    AssetProxyId,
    MultiAssetData,
    MultiAssetDataWithRecursiveDecoding,
    SingleAssetData,
} from '@0x/types';
import { BigNumber, hexUtils, NULL_ADDRESS } from '@0x/utils';
import * as _ from 'lodash';

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
    encodeDydxBridgeData(bridgeData: DydxBridgeData): string {
        return dydxBridgeDataEncoder.encode({bridgeData});
    },
    decodeDydxBridgeData(bridgeData: string): DydxBridgeData {
        return dydxBridgeDataEncoder.decode(bridgeData);
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
                const [
                    tokenAddress,
                    tokenIds,
                    tokenValues,
                    callbackData,
                ] = assetDataEncoder.getABIDecodedTransactionData<[string, BigNumber[], BigNumber[], string]>(
                    'ERC1155Assets',
                    assetData,
                );
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

                const multiAssetData: MultiAssetData = {
                    assetProxyId,
                    amounts,
                    nestedAssetData,
                };
                return multiAssetData;
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
    /**
     * Decodes a MultiAsset assetData hex string into its corresponding amounts and decoded nestedAssetData elements (all nested elements are flattened)
     * @param assetData Hex encoded assetData string to decode
     * @return An object containing the decoded amounts and nestedAssetData
     */
    decodeMultiAssetDataRecursively(assetData: string): MultiAssetDataWithRecursiveDecoding {
        const decodedAssetData = assetDataUtils.decodeAssetDataOrThrow(assetData) as MultiAssetData; // tslint:disable-line:no-unnecessary-type-assertion
        if (decodedAssetData.assetProxyId !== AssetProxyId.MultiAsset) {
            throw new Error(`Not a MultiAssetData. Use 'decodeAssetDataOrThrow' instead`);
        }
        const amounts: any[] = [];
        const decodedNestedAssetData = decodedAssetData.nestedAssetData.map((nestedAssetDataElement, index) => {
            const decodedNestedAssetDataElement = assetDataUtils.decodeAssetDataOrThrow(nestedAssetDataElement);
            if (decodedNestedAssetDataElement.assetProxyId === AssetProxyId.MultiAsset) {
                const recursivelyDecodedAssetData = assetDataUtils.decodeMultiAssetDataRecursively(
                    nestedAssetDataElement,
                );
                amounts.push(
                    recursivelyDecodedAssetData.amounts.map(amountElement =>
                        amountElement.times(decodedAssetData.amounts[index]),
                    ),
                );
                return recursivelyDecodedAssetData.nestedAssetData;
            } else {
                amounts.push(decodedAssetData.amounts[index]);
                return decodedNestedAssetDataElement;
            }
        });
        const flattenedAmounts = _.flattenDeep(amounts);
        const flattenedDecodedNestedAssetData = _.flattenDeep(decodedNestedAssetData);
        return {
            assetProxyId: decodedAssetData.assetProxyId,
            amounts: flattenedAmounts,
            // tslint:disable-next-line:no-unnecessary-type-assertion
            nestedAssetData: flattenedDecodedNestedAssetData as SingleAssetData[],
        };
    },
};
