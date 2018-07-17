import { AssetProxyId, ERC20AssetData, ERC721AssetData } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import BN = require('bn.js');
import ethAbi = require('ethereumjs-abi');
import ethUtil = require('ethereumjs-util');

import { constants } from './constants';

export const assetDataUtils = {
    encodeUint256(value: BigNumber): Buffer {
        const base = 10;
        const formattedValue = new BN(value.toString(base));
        const encodedValue = ethUtil.toBuffer(formattedValue);
        // tslint:disable-next-line:custom-no-magic-numbers
        const paddedValue = ethUtil.setLengthLeft(encodedValue, constants.WORD_LENGTH);
        return paddedValue;
    },
    decodeUint256(encodedValue: Buffer): BigNumber {
        const formattedValue = ethUtil.bufferToHex(encodedValue);
        const value = new BigNumber(formattedValue, constants.BASE_16);
        return value;
    },
    encodeERC20AssetData(tokenAddress: string): string {
        return ethUtil.bufferToHex(ethAbi.simpleEncode('ERC20Token(address)', tokenAddress));
    },
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
    encodeERC721AssetData(tokenAddress: string, tokenId: BigNumber, receiverData?: string): string {
        // TODO: Pass `tokendId` as a BigNumber.
        return ethUtil.bufferToHex(
            ethAbi.simpleEncode(
                'ERC721Token(address,uint256,bytes)',
                tokenAddress,
                `0x${tokenId.toString(constants.BASE_16)}`,
                ethUtil.toBuffer(receiverData || '0x'),
            ),
        );
    },
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
        const [tokenAddress, tokenId, receiverData] = ethAbi.rawDecode(
            ['address', 'uint256', 'bytes'],
            data.slice(constants.SELECTOR_LENGTH),
        );
        return {
            assetProxyId,
            tokenAddress: ethUtil.addHexPrefix(tokenAddress),
            tokenId: new BigNumber(tokenId.toString()),
            receiverData: ethUtil.bufferToHex(receiverData),
        };
    },
    decodeAssetDataId(assetData: string): AssetProxyId {
        const encodedAssetData = ethUtil.toBuffer(assetData);
        if (encodedAssetData.byteLength < constants.SELECTOR_LENGTH) {
            throw new Error(
                `Could not decode Proxy Data. Expected length of encoded data to be at least 4. Got ${
                    encodedAssetData.byteLength
                }`,
            );
        }
        const encodedAssetProxyId = encodedAssetData.slice(0, constants.SELECTOR_LENGTH);
        const assetProxyId = assetDataUtils._decodeAssetProxyId(encodedAssetProxyId);
        return assetProxyId;
    },
    decodeAssetData(assetData: string): ERC20AssetData | ERC721AssetData {
        const assetProxyId = assetDataUtils.decodeAssetDataId(assetData);
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
    _decodeAssetProxyId(encodedAssetProxyId: Buffer): AssetProxyId {
        const hexString = ethUtil.bufferToHex(encodedAssetProxyId);
        if (hexString === AssetProxyId.ERC20) {
            return AssetProxyId.ERC20;
        }
        if (hexString === AssetProxyId.ERC721) {
            return AssetProxyId.ERC721;
        }
        throw new Error(`Invalid ProxyId: ${hexString}`);
    },
};
