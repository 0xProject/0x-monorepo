import { AssetProxyId, ERC20AssetData, ERC721AssetData } from '@0xproject/types';
import { BigNumber, NULL_BYTES } from '@0xproject/utils';
import BN = require('bn.js');
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

const ERC20_ASSET_DATA_BYTE_LENGTH = 36;
const ERC721_ASSET_DATA_MINIMUM_BYTE_LENGTH = 53;
const ASSET_DATA_ADDRESS_OFFSET = 0;
const ERC721_ASSET_DATA_TOKEN_ID_OFFSET = 20;
const ERC721_ASSET_DATA_RECEIVER_DATA_LENGTH_OFFSET = 52;
const ERC721_ASSET_DATA_RECEIVER_DATA_OFFSET = 84;

export const assetProxyUtils = {
    encodeAssetProxyId(assetProxyId: AssetProxyId): Buffer {
        return ethUtil.toBuffer(assetProxyId);
    },
    decodeAssetProxyId(encodedAssetProxyId: Buffer): AssetProxyId {
        const string = ethUtil.bufferToHex(encodedAssetProxyId);
        if (string === AssetProxyId.ERC20) {
            return AssetProxyId.ERC20;
        }
        if (string === AssetProxyId.ERC721) {
            return AssetProxyId.ERC721;
        }
        throw new Error(`Invalid ProxyId: ${string}`);
    },
    encodeAddress(address: string): Buffer {
        if (!ethUtil.isValidAddress(address)) {
            throw new Error(`Invalid Address: ${address}`);
        }
        const encodedAddress = ethUtil.toBuffer(address);
        const padded = ethUtil.setLengthLeft(encodedAddress, 32);
        return padded;
    },
    decodeAddress(encodedAddress: Buffer): string {
        const unpadded = ethUtil.setLengthLeft(encodedAddress, 20);
        const address = ethUtil.bufferToHex(unpadded);
        if (!ethUtil.isValidAddress(address)) {
            throw new Error(`Invalid Address: ${address}`);
        }
        return address;
    },
    encodeUint256(value: BigNumber): Buffer {
        const base = 10;
        const formattedValue = new BN(value.toString(base));
        const encodedValue = ethUtil.toBuffer(formattedValue);
        // tslint:disable-next-line:custom-no-magic-numbers
        const paddedValue = ethUtil.setLengthLeft(encodedValue, 32);
        return paddedValue;
    },
    decodeUint256(encodedValue: Buffer): BigNumber {
        const formattedValue = ethUtil.bufferToHex(encodedValue);
        const value = new BigNumber(formattedValue, 16);
        return value;
    },
    encodeERC20AssetData(tokenAddress: string): string {
        const encodedAssetProxyId = assetProxyUtils.encodeAssetProxyId(AssetProxyId.ERC20);
        const encodedAddress = assetProxyUtils.encodeAddress(tokenAddress);
        const encodedAssetData = Buffer.concat([encodedAssetProxyId, encodedAddress]);
        const encodedAssetDataHex = ethUtil.bufferToHex(encodedAssetData);
        return encodedAssetDataHex;
    },
    decodeERC20AssetData(proxyData: string): ERC20AssetData {
        const encodedAssetData = ethUtil.toBuffer(proxyData);
        if (encodedAssetData.byteLength !== ERC20_ASSET_DATA_BYTE_LENGTH) {
            throw new Error(
                `Could not decode ERC20 Proxy Data. Expected length of encoded data to be ${ERC20_ASSET_DATA_BYTE_LENGTH}. Got ${
                    encodedAssetData.byteLength
                }`,
            );
        }
        const encodedAssetProxyId = encodedAssetData.slice(0, 4);
        const assetProxyId = assetProxyUtils.decodeAssetProxyId(encodedAssetProxyId);
        if (assetProxyId !== AssetProxyId.ERC20) {
            throw new Error(
                `Could not decode ERC20 Proxy Data. Expected Asset Proxy Id to be ERC20 (${
                    AssetProxyId.ERC20
                }), but got ${assetProxyId}`,
            );
        }
        const encodedTokenAddress = encodedAssetData.slice(16, 20);
        const tokenAddress = assetProxyUtils.decodeAddress(encodedTokenAddress);
        const erc20AssetData = {
            assetProxyId,
            tokenAddress,
        };
        return erc20AssetData;
    },
    encodeERC721AssetData(tokenAddress: string, tokenId: BigNumber, receiverData?: string): string {
        const encodedAssetProxyId = assetProxyUtils.encodeAssetProxyId(AssetProxyId.ERC721);
        const encodedAddress = assetProxyUtils.encodeAddress(tokenAddress);
        const encodedTokenId = assetProxyUtils.encodeUint256(tokenId);
        let encodedAssetData = Buffer.concat([encodedAddress, encodedTokenId]);
        if (!_.isUndefined(receiverData)) {
            const encodedReceiverData = ethUtil.toBuffer(receiverData);
            const receiverDataLength = new BigNumber(encodedReceiverData.byteLength);
            const encodedReceiverDataLength = assetProxyUtils.encodeUint256(receiverDataLength);
            encodedAssetData = Buffer.concat([encodedAssetData, encodedReceiverDataLength, encodedReceiverData]);
        }
        encodedAssetData = Buffer.concat([encodedAssetProxyId, encodedAssetData]);
        const encodedAssetDataHex = ethUtil.bufferToHex(encodedAssetData);
        return encodedAssetDataHex;
    },
    decodeERC721AssetData(assetData: string): ERC721AssetData {

        const encodedAssetData = ethUtil.toBuffer(assetData);
        if (encodedAssetData.byteLength < ERC721_ASSET_DATA_MINIMUM_BYTE_LENGTH) {
            throw new Error(
                `Could not decode ERC20 Proxy Data. Expected length of encoded data to be at least ${ERC721_ASSET_DATA_MINIMUM_BYTE_LENGTH}. Got ${
                    encodedAssetData.byteLength
                }`,
            );
        }

        console.log(rawDecode);
        //const result = ethAbi.rawDecode(['address', 'uint256', 'bytes'], encodedAssetData.slice(4));
        //console.log(result);

        const encodedTokenAddress = encodedAssetData.slice(
            ASSET_DATA_ADDRESS_OFFSET,
            ERC721_ASSET_DATA_TOKEN_ID_OFFSET,
        );
        const encodedAssetProxyId = encodedAssetData.slice(0, 4);
        const assetProxyId = assetProxyUtils.decodeAssetProxyId(encodedAssetProxyId);
        if (assetProxyId !== AssetProxyId.ERC721) {
            throw new Error(
                `Could not decode ERC721 Proxy Data. Expected Asset Proxy Id to be ERC721 (${
                    AssetProxyId.ERC721
                }), but got ${assetProxyId}`,
            );
        }
        const tokenAddress = assetProxyUtils.decodeAddress(encodedTokenAddress);
        const encodedTokenId = encodedAssetData.slice(
            ERC721_ASSET_DATA_TOKEN_ID_OFFSET,
            ERC721_ASSET_DATA_RECEIVER_DATA_LENGTH_OFFSET,
        );
        const tokenId = assetProxyUtils.decodeUint256(encodedTokenId);
        let receiverData = NULL_BYTES;
        const lengthUpToReceiverDataLength = ERC721_ASSET_DATA_RECEIVER_DATA_LENGTH_OFFSET + 1;
        if (encodedAssetData.byteLength > lengthUpToReceiverDataLength) {
            const encodedReceiverDataLength = encodedAssetData.slice(
                ERC721_ASSET_DATA_RECEIVER_DATA_LENGTH_OFFSET,
                ERC721_ASSET_DATA_RECEIVER_DATA_OFFSET,
            );
            const receiverDataLength = assetProxyUtils.decodeUint256(encodedReceiverDataLength);
            const lengthUpToReceiverData = ERC721_ASSET_DATA_RECEIVER_DATA_OFFSET + 1;
            const expectedReceiverDataLength = new BigNumber(encodedAssetData.byteLength - lengthUpToReceiverData);
            if (!receiverDataLength.equals(expectedReceiverDataLength)) {
                throw new Error(
                    `Data length (${receiverDataLength}) does not match actual length of data (${expectedReceiverDataLength})`,
                );
            }
            const encodedReceiverData = encodedAssetData.slice(
                ERC721_ASSET_DATA_RECEIVER_DATA_OFFSET,
                receiverDataLength.add(ERC721_ASSET_DATA_RECEIVER_DATA_OFFSET).toNumber(),
            );
            receiverData = ethUtil.bufferToHex(encodedReceiverData);
        }
        const erc721AssetData: ERC721AssetData = {
            assetProxyId,
            tokenAddress,
            tokenId,
            receiverData,
        };
        return erc721AssetData;
    },
    decodeAssetDataId(assetData: string): AssetProxyId {
        const encodedAssetData = ethUtil.toBuffer(assetData);
        if (encodedAssetData.byteLength < 4) {
            throw new Error(
                `Could not decode Proxy Data. Expected length of encoded data to be at least 4. Got ${
                    encodedAssetData.byteLength
                }`,
            );
        }
        const encodedAssetProxyId = encodedAssetData.slice(0, 4);
        const assetProxyId = assetProxyUtils.decodeAssetProxyId(encodedAssetProxyId);
        return assetProxyId;
    },
    decodeAssetData(assetData: string): ERC20AssetData | ERC721AssetData {
        const assetProxyId = assetProxyUtils.decodeAssetDataId(assetData);
        switch (assetProxyId) {
            case AssetProxyId.ERC20:
                const erc20AssetData = assetProxyUtils.decodeERC20AssetData(assetData);
                return erc20AssetData;
            case AssetProxyId.ERC721:
                const erc721AssetData = assetProxyUtils.decodeERC721AssetData(assetData);
                return erc721AssetData;
            default:
                throw new Error(`Unrecognized asset proxy id: ${assetProxyId}`);
        }
    },
};
