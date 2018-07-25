import { AssetProxyId, ERC20AssetData, ERC721AssetData } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import ethAbi = require('ethereumjs-abi');
import ethUtil = require('ethereumjs-util');

import { constants } from './constants';

export const assetDataUtils = {
    /**
     * Encodes an ERC20 token address into a hex encoded assetData string, usable in the makerAssetData or
     * takerAssetData fields in a 0x order.
     * @param tokenAddress  The ERC20 token address to encode
     * @return The hex encoded assetData string
     */
    encodeERC20AssetData(tokenAddress: string): string {
        return ethUtil.bufferToHex(ethAbi.simpleEncode('ERC20Token(address)', tokenAddress));
    },
    /**
     * Decodes an ERC20 assetData hex string into it's corresponding ERC20 tokenAddress & assetProxyId
     * @param assetData Hex encoded assetData string to decode
     * @return An object containing the decoded tokenAddress & assetProxyId
     */
    decodeERC20AssetData(assetData: string): ERC20AssetData {
        const data = ethUtil.toBuffer(assetData);
        if (data.byteLength < constants.ERC20_ASSET_DATA_BYTE_LENGTH) {
            throw new Error(
                `Could not decode ERC20 Proxy Data. Expected length of encoded data to be at least ${
                    constants.ERC20_ASSET_DATA_BYTE_LENGTH
                }. Got ${data.byteLength}`,
            );
        }
        const assetProxyId = ethUtil.bufferToHex(data.slice(0, constants.SELECTOR_LENGTH));
        if (assetProxyId !== AssetProxyId.ERC20) {
            throw new Error(
                `Could not decode ERC20 Proxy Data. Expected Asset Proxy Id to be ERC20 (${
                    AssetProxyId.ERC20
                }), but got ${assetProxyId}`,
            );
        }
        const [tokenAddress] = ethAbi.rawDecode(['address'], data.slice(constants.SELECTOR_LENGTH));
        return {
            assetProxyId,
            tokenAddress: ethUtil.addHexPrefix(tokenAddress),
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
        // TODO: Pass `tokendId` as a BigNumber.
        return ethUtil.bufferToHex(
            ethAbi.simpleEncode(
                'ERC721Token(address,uint256)',
                tokenAddress,
                `0x${tokenId.toString(constants.BASE_16)}`,
            ),
        );
    },
    /**
     * Decodes an ERC721 assetData hex string into it's corresponding ERC721 tokenAddress, tokenId & assetProxyId
     * @param assetData Hex encoded assetData string to decode
     * @return An object containing the decoded tokenAddress, tokenId & assetProxyId
     */
    decodeERC721AssetData(assetData: string): ERC721AssetData {
        const data = ethUtil.toBuffer(assetData);
        if (data.byteLength < constants.ERC721_ASSET_DATA_MINIMUM_BYTE_LENGTH) {
            throw new Error(
                `Could not decode ERC721 Asset Data. Expected length of encoded data to be at least ${
                    constants.ERC721_ASSET_DATA_MINIMUM_BYTE_LENGTH
                }. Got ${data.byteLength}`,
            );
        }
        const assetProxyId = ethUtil.bufferToHex(data.slice(0, constants.SELECTOR_LENGTH));
        if (assetProxyId !== AssetProxyId.ERC721) {
            throw new Error(
                `Could not decode ERC721 Asset Data. Expected Asset Proxy Id to be ERC721 (${
                    AssetProxyId.ERC721
                }), but got ${assetProxyId}`,
            );
        }
        const [tokenAddress, tokenId] = ethAbi.rawDecode(['address', 'uint256'], data.slice(constants.SELECTOR_LENGTH));
        return {
            assetProxyId,
            tokenAddress: ethUtil.addHexPrefix(tokenAddress),
            tokenId: new BigNumber(tokenId.toString()),
        };
    },
    /**
     * Decode and return the assetProxyId from the assetData
     * @param assetData Hex encoded assetData string to decode
     * @return The assetProxyId
     */
    decodeAssetProxyId(assetData: string): AssetProxyId {
        const encodedAssetData = ethUtil.toBuffer(assetData);
        if (encodedAssetData.byteLength < constants.SELECTOR_LENGTH) {
            throw new Error(
                `Could not decode assetData. Expected length of encoded data to be at least 4. Got ${
                    encodedAssetData.byteLength
                }`,
            );
        }
        const encodedAssetProxyId = encodedAssetData.slice(0, constants.SELECTOR_LENGTH);
        const assetProxyId = decodeAssetProxyId(encodedAssetProxyId);
        return assetProxyId;
    },
    /**
     * Decode any assetData into it's corresponding assetData object
     * @param assetData Hex encoded assetData string to decode
     * @return Either a ERC20 or ERC721 assetData object
     */
    decodeAssetDataOrThrow(assetData: string): ERC20AssetData | ERC721AssetData {
        const assetProxyId = assetDataUtils.decodeAssetProxyId(assetData);
        switch (assetProxyId) {
            case AssetProxyId.ERC20:
                const erc20AssetData = assetDataUtils.decodeERC20AssetData(assetData);
                return erc20AssetData;
            case AssetProxyId.ERC721:
                const erc721AssetData = assetDataUtils.decodeERC721AssetData(assetData);
                return erc721AssetData;
            default:
                throw new Error(`Unrecognized asset proxy id: ${assetProxyId}`);
        }
    },
};

function decodeAssetProxyId(encodedAssetProxyId: Buffer): AssetProxyId {
    const hexString = ethUtil.bufferToHex(encodedAssetProxyId);
    if (hexString === AssetProxyId.ERC20) {
        return AssetProxyId.ERC20;
    }
    if (hexString === AssetProxyId.ERC721) {
        return AssetProxyId.ERC721;
    }
    throw new Error(`Invalid ProxyId: ${hexString}`);
}
