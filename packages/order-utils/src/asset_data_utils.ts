import {
    AssetProxyId,
    DutchAuctionData,
    ERC1155AssetData,
    ERC1155AssetDataNoProxyId,
    ERC20AssetData,
    ERC721AssetData,
    MultiAssetData,
    MultiAssetDataWithRecursiveDecoding,
    SingleAssetData,
    StaticCallAssetData,
} from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';
import * as ethAbi from 'ethereumjs-abi';
import * as ethUtil from 'ethereumjs-util';
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
     * Decodes an ERC20 assetData hex string into its corresponding ERC20 tokenAddress & assetProxyId
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
     * Decodes an ERC721 assetData hex string into its corresponding ERC721 tokenAddress, tokenId & assetProxyId
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
     * Encodes a set of ERC1155 assets into an assetData string, usable in the makerAssetData or
     * takerAssetData fields of a 0x order.
     * @param tokenAddress The token address of the ERC1155 contract
     * @param tokenIds The Id's of the ERC1155 tokens to transfer
     * @param tokenValues The values of each respective token Id to transfer
     * @param callbackData The data forwarded to a receiver, if receiver is a contract.
     * @return The hex encoded assetData string
     */
    encodeERC1155AssetData(
        tokenAddress: string,
        tokenIds: BigNumber[],
        tokenValues: BigNumber[],
        callbackData: string,
    ): string {
        const abiEncoder = AbiEncoder.createMethod('ERC1155Assets', constants.ERC1155_METHOD_ABI.inputs);
        const args = [tokenAddress, tokenIds, tokenValues, callbackData];
        const assetData = abiEncoder.encode(args, encodingRules);
        return assetData;
    },
    /**
     * Decodes an ERC1155 assetData hex string into its corresponding ERC1155 components.
     * @param assetData Hex encoded assetData string to decode
     * @return An object containing the decoded tokenAddress, tokenIds, tokenValues, callbackData & assetProxyId
     */
    decodeERC1155AssetData(assetData: string): ERC1155AssetData {
        const assetProxyId = assetDataUtils.decodeAssetProxyId(assetData);
        if (assetProxyId !== AssetProxyId.ERC1155) {
            throw new Error(`Invalid assetProxyId. Expected '${AssetProxyId.ERC1155}', got '${assetProxyId}'`);
        }
        const abiEncoder = AbiEncoder.createMethod('ERC1155Assets', constants.ERC1155_METHOD_ABI.inputs);
        // tslint:disable-next-line:no-unnecessary-type-assertion
        const decodedAssetData = abiEncoder.decode(assetData, decodingRules) as ERC1155AssetDataNoProxyId;
        return {
            assetProxyId,
            tokenAddress: decodedAssetData.tokenAddress,
            tokenIds: decodedAssetData.tokenIds,
            tokenValues: decodedAssetData.tokenValues,
            callbackData: decodedAssetData.callbackData,
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
     * Decodes a MultiAsset assetData hex string into its corresponding amounts and nestedAssetData
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
     * Decodes a MultiAsset assetData hex string into its corresponding amounts and decoded nestedAssetData elements (all nested elements are flattened)
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
     * Encodes StaticCallProxy data into an assetData hex string
     * @param callTarget Address of contract to call from StaticCallProxy
     * @param staticCallData The function data that will be called on the callTarget contract
     * @param callResultHash The keccak256 hash of the ABI encoded expected output of the static call
     * @return The hex encoded assetData string
     */
    encodeStaticCallAssetData(callTarget: string, staticCallData: string, callResultHash: string): string {
        const abiEncoder = AbiEncoder.createMethod('StaticCall', constants.STATIC_CALL_METHOD_ABI.inputs);
        const args = [callTarget, staticCallData, callResultHash];
        const assetData = abiEncoder.encode(args, encodingRules);
        return assetData;
    },
    /**
     * Decoded StaticCall assetData into its corresponding callTarget, staticCallData, and expected callResultHash
     * @param assetData Hex encoded assetData string to decode
     * @return An object containing the decoded callTarget, staticCallData, and expected callResultHash
     */
    decodeStaticCallAssetData(assetData: string): StaticCallAssetData {
        const abiEncoder = AbiEncoder.createMethod('StaticCall', constants.STATIC_CALL_METHOD_ABI.inputs);
        const assetProxyId = assetDataUtils.decodeAssetProxyId(assetData);
        const decodedAssetData = abiEncoder.decode(assetData, decodingRules) as any;
        return {
            assetProxyId,
            callTarget: decodedAssetData.callTarget,
            callResultHash: decodedAssetData.callResultHash,
            staticCallData: decodedAssetData.staticCallData,
        };
    },
    /**
     * Dutch auction details are encoded with the asset data for a 0x order. This function produces a hex
     * encoded assetData string, containing information both about the asset being traded and the
     * dutch auction; which is usable in the makerAssetData or takerAssetData fields in a 0x order.
     * @param assetData Hex encoded assetData string for the asset being auctioned.
     * @param beginTimeSeconds Begin time of the dutch auction.
     * @param beginAmount Starting amount being sold in the dutch auction.
     * @return The hex encoded assetData string.
     */
    encodeDutchAuctionAssetData(assetData: string, beginTimeSeconds: BigNumber, beginAmount: BigNumber): string {
        const assetDataBuffer = ethUtil.toBuffer(assetData);
        const abiEncodedAuctionData = (ethAbi as any).rawEncode(
            ['uint256', 'uint256'],
            [beginTimeSeconds.toString(), beginAmount.toString()],
        );
        const abiEncodedAuctionDataBuffer = ethUtil.toBuffer(abiEncodedAuctionData);
        const dutchAuctionDataBuffer = Buffer.concat([assetDataBuffer, abiEncodedAuctionDataBuffer]);
        const dutchAuctionData = ethUtil.bufferToHex(dutchAuctionDataBuffer);
        return dutchAuctionData;
    },
    /**
     * Dutch auction details are encoded with the asset data for a 0x order. This function decodes a hex
     * encoded assetData string, containing information both about the asset being traded and the
     * dutch auction.
     * @param dutchAuctionData Hex encoded assetData string for the asset being auctioned.
     * @return An object containing the auction asset, auction begin time and auction begin amount.
     */
    decodeDutchAuctionData(dutchAuctionData: string): DutchAuctionData {
        const dutchAuctionDataBuffer = ethUtil.toBuffer(dutchAuctionData);
        // Decode asset data
        const dutchAuctionDataLengthInBytes = 64;
        const assetDataBuffer = dutchAuctionDataBuffer.slice(
            0,
            dutchAuctionDataBuffer.byteLength - dutchAuctionDataLengthInBytes,
        );
        const assetDataHex = ethUtil.bufferToHex(assetDataBuffer);
        const assetData = assetDataUtils.decodeAssetDataOrThrow(assetDataHex);
        // Decode auction details
        const dutchAuctionDetailsBuffer = dutchAuctionDataBuffer.slice(
            dutchAuctionDataBuffer.byteLength - dutchAuctionDataLengthInBytes,
        );
        const [beginTimeSecondsAsBN, beginAmountAsBN] = ethAbi.rawDecode(
            ['uint256', 'uint256'],
            dutchAuctionDetailsBuffer,
        );
        const beginTimeSeconds = new BigNumber(beginTimeSecondsAsBN.toString());
        const beginAmount = new BigNumber(beginAmountAsBN.toString());
        return {
            assetData,
            beginTimeSeconds,
            beginAmount,
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
                } for assetData ${assetData}`,
            );
        }
        const assetProxyId = assetData.slice(0, constants.SELECTOR_CHAR_LENGTH_WITH_PREFIX);
        if (
            assetProxyId !== AssetProxyId.ERC20 &&
            assetProxyId !== AssetProxyId.ERC721 &&
            assetProxyId !== AssetProxyId.ERC1155 &&
            assetProxyId !== AssetProxyId.StaticCall &&
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
     * Checks if the decoded asset data is valid ERC1155 data
     * @param decodedAssetData The decoded asset data to check
     */
    isERC1155AssetData(decodedAssetData: SingleAssetData | MultiAssetData): decodedAssetData is ERC1155AssetData {
        return decodedAssetData.assetProxyId === AssetProxyId.ERC1155;
    },
    /**
     * Checks if the decoded asset data is valid MultiAsset data
     * @param decodedAssetData The decoded asset data to check
     */
    isMultiAssetData(decodedAssetData: SingleAssetData | MultiAssetData): decodedAssetData is MultiAssetData {
        return decodedAssetData.assetProxyId === AssetProxyId.MultiAsset;
    },
    /**
     * Checks if the decoded asset data is valid StaticCall data
     * @param decodedAssetData The decoded asset data to check
     */
    isStaticCallAssetData(decodedAssetData: SingleAssetData | MultiAssetData): decodedAssetData is StaticCallAssetData {
        return decodedAssetData.assetProxyId === AssetProxyId.StaticCall;
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
        assetDataUtils.assertWordAlignedAssetData(assetData);
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
        assetDataUtils.assertWordAlignedAssetData(assetData);
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
     * Throws if the assetData is not ERC1155.
     * @param assetData Hex encoded assetData string
     */
    assertIsERC1155AssetData(assetData: string): void {
        if (assetData.length < constants.ERC1155_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX) {
            throw new Error(
                `Could not decode ERC1155 Proxy Data. Expected length of encoded data to be at least ${
                    constants.ERC1155_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX
                }. Got ${assetData.length}`,
            );
        }
        assetDataUtils.assertWordAlignedAssetData(assetData);
        const assetProxyId = assetDataUtils.decodeAssetProxyId(assetData);
        if (assetProxyId !== AssetProxyId.ERC1155) {
            throw new Error(
                `Could not decode ERC1155 assetData. Expected assetProxyId to be ERC1155 (${
                    AssetProxyId.ERC1155
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
        assetDataUtils.assertWordAlignedAssetData(assetData);
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
     * Throws if the assetData is not StaticCallData.
     * @param assetData Hex encoded assetData string
     */
    assertIsStaticCallAssetData(assetData: string): void {
        if (assetData.length < constants.STATIC_CALL_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX) {
            throw new Error(
                `Could not decode StaticCall Proxy Data. Expected length of encoded data to be at least ${
                    constants.STATIC_CALL_ASSET_DATA_MIN_CHAR_LENGTH_WITH_PREFIX
                }. Got ${assetData.length}`,
            );
        }
        assetDataUtils.assertWordAlignedAssetData(assetData);
        const assetProxyId = assetDataUtils.decodeAssetProxyId(assetData);
        if (assetProxyId !== AssetProxyId.StaticCall) {
            throw new Error(
                `Could not decode StaticCall assetData. Expected assetProxyId to be StaticCall (${
                    AssetProxyId.StaticCall
                }), but got ${assetProxyId}`,
            );
        }
    },
    /**
     * Throws if the assetData is not padded to 32 bytes.
     * @param assetData Hex encoded assetData string
     */
    assertWordAlignedAssetData(assetData: string): void {
        const charsIn32Bytes = 64;
        if ((assetData.length - constants.SELECTOR_CHAR_LENGTH_WITH_PREFIX) % charsIn32Bytes !== 0) {
            throw new Error(
                `assetData must be word aligned. ${(assetData.length - 2) / 2} is not a valid byte length.`,
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
            case AssetProxyId.ERC1155:
                assetDataUtils.assertIsERC1155AssetData(assetData);
                break;
            case AssetProxyId.MultiAsset:
                assetDataUtils.assertIsMultiAssetData(assetData);
                break;
            case AssetProxyId.StaticCall:
                assetDataUtils.assertIsStaticCallAssetData(assetData);
                break;
            default:
                throw new Error(`Unrecognized asset proxy id: ${assetProxyId}`);
        }
    },
    /**
     * Decode any assetData into its corresponding assetData object
     * @param assetData Hex encoded assetData string to decode
     * @return Either a ERC20, ERC721, ERC1155, or MultiAsset assetData object
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
            case AssetProxyId.ERC1155:
                const erc1155AssetData = assetDataUtils.decodeERC1155AssetData(assetData);
                return erc1155AssetData;
            case AssetProxyId.MultiAsset:
                const multiAssetData = assetDataUtils.decodeMultiAssetData(assetData);
                return multiAssetData;
            case AssetProxyId.StaticCall:
                const staticCallData = assetDataUtils.decodeStaticCallAssetData(assetData);
                return staticCallData;
            default:
                throw new Error(`Unrecognized asset proxy id: ${assetProxyId}`);
        }
    },
};
// tslint:disable:max-file-line-count
