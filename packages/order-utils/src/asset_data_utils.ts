import {
    AssetProxyId,
    ERC20AssetData,
    ERC721AssetData,
    MultiAssetData,
    MultiAssetDataWithRecursiveDecoding,
    SingleAssetData,
} from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { constants } from './constants';

const encodingRules: AbiEncoder.EncodingRules = { shouldOptimize: true };
const decodingRules: AbiEncoder.DecodingRules = { shouldConvertStructsToObjects: true };

export const assetDataUtils = {
    /**
     * Encodes an ERC20 token address into a hex encoded assetData string, usable in the makerAssetData or
     * takerAssetData fields in a 0x order.
     * @param tokenAddress  The ERC20 token address to encode
     * @return The hex encoded assetData string
     */
    encodeERC20AssetData(tokenAddress: string): string {
        const abiEncoder = new AbiEncoder.Method(constants.ERC20_METHOD_ABI);
        const args = [tokenAddress];
        const assetData = abiEncoder.encode(args, encodingRules);
        return assetData;
    },
    /**
     * Decodes an ERC20 assetData hex string into it's corresponding ERC20 tokenAddress & assetProxyId
     * @param assetData Hex encoded assetData string to decode
     * @return An object containing the decoded tokenAddress & assetProxyId
     */
    decodeERC20AssetData(assetData: string): ERC20AssetData {
        assetDataUtils.assertIsERC20AssetData(assetData);
        const assetProxyId = assetDataUtils.decodeAssetProxyId(assetData);
        const abiEncoder = new AbiEncoder.Method(constants.ERC20_METHOD_ABI);
        const decodedAssetData = abiEncoder.decode(assetData, decodingRules);
        return {
            assetProxyId,
            // TODO(abandeali1): fix return types for `AbiEncoder.Method.decode` so that we can remove type assertion
            tokenAddress: (decodedAssetData as any).tokenContract,
        };
    },
    /**
     * Encodes an ERC721 token address into a hex encoded assetData string, usable in the makerAssetData or
     * takerAssetData fields in a 0x order.
     * @param tokenAddress  The ERC721 token address to encode
     * @param tokenId  The ERC721 tokenId to encode
     * @return The hex encoded assetData string
     */
    encodeERC721AssetData(tokenAddress: string, tokenId: BigNumber): string {
        const abiEncoder = new AbiEncoder.Method(constants.ERC721_METHOD_ABI);
        const args = [tokenAddress, tokenId];
        const assetData = abiEncoder.encode(args, encodingRules);
        return assetData;
    },
    /**
     * Decodes an ERC721 assetData hex string into it's corresponding ERC721 tokenAddress, tokenId & assetProxyId
     * @param assetData Hex encoded assetData string to decode
     * @return An object containing the decoded tokenAddress, tokenId & assetProxyId
     */
    decodeERC721AssetData(assetData: string): ERC721AssetData {
        assetDataUtils.assertIsERC721AssetData(assetData);
        const assetProxyId = assetDataUtils.decodeAssetProxyId(assetData);
        const abiEncoder = new AbiEncoder.Method(constants.ERC721_METHOD_ABI);
        const decodedAssetData = abiEncoder.decode(assetData, decodingRules);
        return {
            assetProxyId,
            // TODO(abandeali1): fix return types for `AbiEncoder.Method.decode` so that we can remove type assertion
            tokenAddress: (decodedAssetData as any).tokenContract,
            tokenId: (decodedAssetData as any).tokenId,
        };
    },
    /**
     * Encodes assetData for multiple AssetProxies into a single hex encoded assetData string, usable in the makerAssetData or
     * takerAssetData fields in a 0x order.
     * @param amounts Amounts of each asset that correspond to a single unit within an order.
     * @param nestedAssetData assetData strings that correspond to a valid assetProxyId.
     * @return The hex encoded assetData string
     */
    encodeMultiAssetData(amounts: BigNumber[], nestedAssetData: string[]): string {
        if (amounts.length !== nestedAssetData.length) {
            throw new Error(
                `Invalid MultiAsset arguments. Expected length of 'amounts' (${
                    amounts.length
                }) to equal length of 'nestedAssetData' (${nestedAssetData.length})`,
            );
        }
        _.forEach(nestedAssetData, assetDataElement => assetDataUtils.validateAssetDataOrThrow(assetDataElement));
        const abiEncoder = new AbiEncoder.Method(constants.MULTI_ASSET_METHOD_ABI);
        const args = [amounts, nestedAssetData];
        const assetData = abiEncoder.encode(args, encodingRules);
        return assetData;
    },
    /**
     * Encodes assetData for multiple AssetProxies into a single hex encoded assetData string, usable in the makerAssetData or
     * takerAssetData fields in a 0x order.

     * @return The hex encoded assetData string
     */
    encodeERC1155AssetData(tokenAddress: string, tokenIds: BigNumber[], tokenValues: BigNumber[], callbackData: string): string {
        const abiEncoder = AbiEncoder.createMethod('ERC1155Token', ['address','uint256[]','uint256[]','bytes']);
        const args = [tokenAddress, tokenIds, tokenValues, callbackData];
        const assetData = abiEncoder.encode(args, encodingRules);
        return assetData;
    },
    /**
     * Decodes a MultiAsset assetData hex string into it's corresponding amounts and nestedAssetData
     * @param assetData Hex encoded assetData string to decode
     * @return An object containing the decoded amounts and nestedAssetData
     */
    decodeMultiAssetData(assetData: string): MultiAssetData {
        assetDataUtils.assertIsMultiAssetData(assetData);
        const assetProxyId = assetDataUtils.decodeAssetProxyId(assetData);
        const abiEncoder = new AbiEncoder.Method(constants.MULTI_ASSET_METHOD_ABI);
        const decodedAssetData = abiEncoder.decode(assetData, decodingRules);
        // TODO(abandeali1): fix return types for `AbiEncoder.Method.decode` so that we can remove type assertion
        const amounts = (decodedAssetData as any).amounts;
        const nestedAssetData = (decodedAssetData as any).nestedAssetData;
        if (amounts.length !== nestedAssetData.length) {
            throw new Error(
                `Invalid MultiAsset assetData. Expected length of 'amounts' (${
                    amounts.length
                }) to equal length of 'nestedAssetData' (${nestedAssetData.length})`,
            );
        }
        return {
            assetProxyId,
            amounts,
            nestedAssetData,
        };
    },
    /**
     * Decodes a MultiAsset assetData hex string into it's corresponding amounts and decoded nestedAssetData elements (all nested elements are flattened)
     * @param assetData Hex encoded assetData string to decode
     * @return An object containing the decoded amounts and nestedAssetData
     */
    decodeMultiAssetDataRecursively(assetData: string): MultiAssetDataWithRecursiveDecoding {
        const decodedAssetData = assetDataUtils.decodeMultiAssetData(assetData);
        const amounts: any[] = [];
        const decodedNestedAssetData = _.map(
            decodedAssetData.nestedAssetData as string[],
            (nestedAssetDataElement, index) => {
                const decodedNestedAssetDataElement = assetDataUtils.decodeAssetDataOrThrow(nestedAssetDataElement);
                if (decodedNestedAssetDataElement.assetProxyId === AssetProxyId.MultiAsset) {
                    const recursivelyDecodedAssetData = assetDataUtils.decodeMultiAssetDataRecursively(
                        nestedAssetDataElement,
                    );
                    amounts.push(
                        _.map(recursivelyDecodedAssetData.amounts, amountElement =>
                            amountElement.times(decodedAssetData.amounts[index]),
                        ),
                    );
                    return recursivelyDecodedAssetData.nestedAssetData;
                } else {
                    amounts.push(decodedAssetData.amounts[index]);
                    return decodedNestedAssetDataElement as SingleAssetData;
                }
            },
        );
        const flattenedAmounts = _.flattenDeep(amounts);
        const flattenedDecodedNestedAssetData = _.flattenDeep(decodedNestedAssetData);
        return {
            assetProxyId: decodedAssetData.assetProxyId,
            amounts: flattenedAmounts,
            // tslint:disable-next-line:no-unnecessary-type-assertion
            nestedAssetData: flattenedDecodedNestedAssetData as SingleAssetData[],
        };
    },
    /**
     * Decode and return the assetProxyId from the assetData
     * @param assetData Hex encoded assetData string to decode
     * @return The assetProxyId
     */
    decodeAssetProxyId(assetData: string): AssetProxyId {
        if (assetData.length < constants.SELECTOR_CHAR_LENGTH_WITH_PREFIX) {
            throw new Error(
                `Could not decode assetData. Expected length of encoded data to be at least 10. Got ${
                    assetData.length
                }`,
            );
        }
        const assetProxyId = assetData.slice(0, constants.SELECTOR_CHAR_LENGTH_WITH_PREFIX);
        if (
            assetProxyId !== AssetProxyId.ERC20 &&
            assetProxyId !== AssetProxyId.ERC721 &&
            assetProxyId !== AssetProxyId.ERC1155 && 
            assetProxyId !== AssetProxyId.MultiAsset
        ) {
            throw new Error(`Invalid assetProxyId: ${assetProxyId}`);
        }
        return assetProxyId;
    },
    /**
     * Checks if the decoded asset data is valid ERC20 data
     * @param decodedAssetData The decoded asset data to check
     */
    isERC20AssetData(decodedAssetData: SingleAssetData | MultiAssetData): decodedAssetData is ERC20AssetData {
        return decodedAssetData.assetProxyId === AssetProxyId.ERC20;
    },
    /**
     * Checks if the decoded asset data is valid ERC721 data
     * @param decodedAssetData The decoded asset data to check
     */
    isERC721AssetData(decodedAssetData: SingleAssetData | MultiAssetData): decodedAssetData is ERC721AssetData {
        return decodedAssetData.assetProxyId === AssetProxyId.ERC721;
    },
    /**
     * Checks if the decoded asset data is valid MultiAsset data
     * @param decodedAssetData The decoded asset data to check
     */
    isMultiAssetData(decodedAssetData: SingleAssetData | MultiAssetData): decodedAssetData is MultiAssetData {
        return decodedAssetData.assetProxyId === AssetProxyId.MultiAsset;
    },
    isER1155AssetData(decodedAssetData: SingleAssetData | MultiAssetData): decodedAssetData is MultiAssetData {
        return decodedAssetData.assetProxyId === AssetProxyId.MultiAsset;
    },
    /**
     * Throws if the length or assetProxyId are invalid for the ERC20Proxy.
     * @param assetData Hex encoded assetData string
     */
    assertIsERC20AssetData(assetData: string): void {
        if (assetData.length < constants.ERC20_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX) {
            throw new Error(
                `Could not decode ERC20 Proxy Data. Expected length of encoded data to be at least ${
                    constants.ERC20_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX
                }. Got ${assetData.length}`,
            );
        }
        const assetProxyId = assetDataUtils.decodeAssetProxyId(assetData);
        if (assetProxyId !== AssetProxyId.ERC20) {
            throw new Error(
                `Could not decode ERC20 assetData. Expected assetProxyId to be ERC20 (${
                    AssetProxyId.ERC20
                }), but got ${assetProxyId}`,
            );
        }
    },
    /**
     * Throws if the length or assetProxyId are invalid for the ERC721Proxy.
     * @param assetData Hex encoded assetData string
     */
    assertIsERC721AssetData(assetData: string): void {
        if (assetData.length < constants.ERC721_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX) {
            throw new Error(
                `Could not decode ERC721 assetData. Expected length of encoded data to be at least ${
                    constants.ERC721_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX
                }. Got ${assetData.length}`,
            );
        }
        const assetProxyId = assetDataUtils.decodeAssetProxyId(assetData);
        if (assetProxyId !== AssetProxyId.ERC721) {
            throw new Error(
                `Could not decode ERC721 assetData. Expected assetProxyId to be ERC721 (${
                    AssetProxyId.ERC721
                }), but got ${assetProxyId}`,
            );
        }
    },
    /**
     * Throws if the length or assetProxyId are invalid for the MultiAssetProxy.
     * @param assetData Hex encoded assetData string
     */
    assertIsMultiAssetData(assetData: string): void {
        if (assetData.length < constants.MULTI_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX) {
            throw new Error(
                `Could not decode MultiAsset assetData. Expected length of encoded data to be at least ${
                    constants.MULTI_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX
                }. Got ${assetData.length}`,
            );
        }
        const assetProxyId = assetDataUtils.decodeAssetProxyId(assetData);
        if (assetProxyId !== AssetProxyId.MultiAsset) {
            throw new Error(
                `Could not decode MultiAsset assetData. Expected assetProxyId to be MultiAsset (${
                    AssetProxyId.MultiAsset
                }), but got ${assetProxyId}`,
            );
        }
    },
    /**
     * Throws if the length or assetProxyId are invalid for the corresponding AssetProxy.
     * @param assetData Hex encoded assetData string
     */
    validateAssetDataOrThrow(assetData: string): void {
        const assetProxyId = assetDataUtils.decodeAssetProxyId(assetData);
        switch (assetProxyId) {
            case AssetProxyId.ERC20:
                assetDataUtils.assertIsERC20AssetData(assetData);
                break;
            case AssetProxyId.ERC721:
                assetDataUtils.assertIsERC721AssetData(assetData);
                break;
            case AssetProxyId.MultiAsset:
                assetDataUtils.assertIsMultiAssetData(assetData);
                break;
            default:
                throw new Error(`Unrecognized asset proxy id: ${assetProxyId}`);
        }
    },
    /**
     * Decode any assetData into it's corresponding assetData object
     * @param assetData Hex encoded assetData string to decode
     * @return Either a ERC20 or ERC721 assetData object
     */
    decodeAssetDataOrThrow(assetData: string): SingleAssetData | MultiAssetData {
        const assetProxyId = assetDataUtils.decodeAssetProxyId(assetData);
        switch (assetProxyId) {
            case AssetProxyId.ERC20:
                const erc20AssetData = assetDataUtils.decodeERC20AssetData(assetData);
                return erc20AssetData;
            case AssetProxyId.ERC721:
                const erc721AssetData = assetDataUtils.decodeERC721AssetData(assetData);
                return erc721AssetData;
            case AssetProxyId.MultiAsset:
                const multiAssetData = assetDataUtils.decodeMultiAssetData(assetData);
                return multiAssetData;
            default:
                throw new Error(`Unrecognized asset proxy id: ${assetProxyId}`);
        }
    },
};
