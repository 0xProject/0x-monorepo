import { BigNumber } from '@0xproject/utils';
import BN = require('bn.js');
import ethUtil = require('ethereumjs-util');

import { AssetProxyId, ERC20ProxyData, ERC721ProxyData, ProxyData } from './types';

export const assetProxyUtils = {
    encodeAssetProxyId(assetProxyId: AssetProxyId): Buffer {
        return ethUtil.toBuffer(assetProxyId);
    },
    decodeAssetProxyId(encodedAssetProxyId: Buffer): AssetProxyId {
        return ethUtil.bufferToInt(encodedAssetProxyId);
    },
    encodeAddress(address: string): Buffer {
        if (!ethUtil.isValidAddress(address)) {
            throw new Error(`Invalid Address: ${address}`);
        }
        const encodedAddress = ethUtil.toBuffer(address);
        return encodedAddress;
    },
    decodeAddress(encodedAddress: Buffer): string {
        const address = ethUtil.bufferToHex(encodedAddress);
        if (!ethUtil.isValidAddress(address)) {
            throw new Error(`Invalid Address: ${address}`);
        }
        return address;
    },
    encodeUint256(value: BigNumber): Buffer {
        const formattedValue = new BN(value.toString(10));
        const encodedValue = ethUtil.toBuffer(formattedValue);
        const paddedValue = ethUtil.setLengthLeft(encodedValue, 32);
        return paddedValue;
    },
    decodeUint256(encodedValue: Buffer): BigNumber {
        const formattedValue = ethUtil.bufferToHex(encodedValue);
        const value = new BigNumber(formattedValue, 16);
        return value;
    },
    encodeERC20ProxyData(tokenAddress: string): string {
        const encodedAssetProxyId = assetProxyUtils.encodeAssetProxyId(AssetProxyId.ERC20);
        const encodedAddress = assetProxyUtils.encodeAddress(tokenAddress);
        const encodedMetadata = Buffer.concat([encodedAssetProxyId, encodedAddress]);
        const encodedMetadataHex = ethUtil.bufferToHex(encodedMetadata);
        return encodedMetadataHex;
    },
    decodeERC20ProxyData(proxyData: string): ERC20ProxyData {
        const encodedProxyMetadata = ethUtil.toBuffer(proxyData);
        if (encodedProxyMetadata.byteLength !== 21) {
            throw new Error(
                `Could not decode ERC20 Proxy Data. Expected length of encoded data to be 21. Got ${
                    encodedProxyMetadata.byteLength
                }`,
            );
        }
        const encodedAssetProxyId = encodedProxyMetadata.slice(0, 1);
        const assetProxyId = assetProxyUtils.decodeAssetProxyId(encodedAssetProxyId);
        if (assetProxyId !== AssetProxyId.ERC20) {
            throw new Error(
                `Could not decode ERC20 Proxy Data. Expected Asset Proxy Id to be ERC20 (${
                    AssetProxyId.ERC20
                }), but got ${assetProxyId}`,
            );
        }
        const encodedTokenAddress = encodedProxyMetadata.slice(1, 21);
        const tokenAddress = assetProxyUtils.decodeAddress(encodedTokenAddress);
        const erc20ProxyData = {
            assetProxyId,
            tokenAddress,
        };
        return erc20ProxyData;
    },
    encodeERC721ProxyData(tokenAddress: string, tokenId: BigNumber): string {
        const encodedAssetProxyId = assetProxyUtils.encodeAssetProxyId(AssetProxyId.ERC721);
        const encodedAddress = assetProxyUtils.encodeAddress(tokenAddress);
        const encodedTokenId = assetProxyUtils.encodeUint256(tokenId);
        const encodedMetadata = Buffer.concat([encodedAssetProxyId, encodedAddress, encodedTokenId]);
        const encodedMetadataHex = ethUtil.bufferToHex(encodedMetadata);
        return encodedMetadataHex;
    },
    decodeERC721ProxyData(proxyData: string): ERC721ProxyData {
        const encodedProxyMetadata = ethUtil.toBuffer(proxyData);
        if (encodedProxyMetadata.byteLength !== 53) {
            throw new Error(
                `Could not decode ERC20 Proxy Data. Expected length of encoded data to be 53. Got ${
                    encodedProxyMetadata.byteLength
                }`,
            );
        }
        const encodedAssetProxyId = encodedProxyMetadata.slice(0, 1);
        const assetProxyId = assetProxyUtils.decodeAssetProxyId(encodedAssetProxyId);
        if (assetProxyId !== AssetProxyId.ERC721) {
            throw new Error(
                `Could not decode ERC721 Proxy Data. Expected Asset Proxy Id to be ERC721 (${
                    AssetProxyId.ERC721
                }), but got ${assetProxyId}`,
            );
        }
        const encodedTokenAddress = encodedProxyMetadata.slice(1, 21);
        const tokenAddress = assetProxyUtils.decodeAddress(encodedTokenAddress);
        const encodedTokenId = encodedProxyMetadata.slice(21, 53);
        const tokenId = assetProxyUtils.decodeUint256(encodedTokenId);
        const erc721ProxyData = {
            assetProxyId,
            tokenAddress,
            tokenId,
        };
        return erc721ProxyData;
    },
    decodeProxyDataId(proxyData: string): AssetProxyId {
        const encodedProxyMetadata = ethUtil.toBuffer(proxyData);
        if (encodedProxyMetadata.byteLength < 1) {
            throw new Error(
                `Could not decode Proxy Data. Expected length of encoded data to be at least 1. Got ${
                    encodedProxyMetadata.byteLength
                }`,
            );
        }
        const encodedAssetProxyId = encodedProxyMetadata.slice(0, 1);
        const assetProxyId = assetProxyUtils.decodeAssetProxyId(encodedAssetProxyId);
        return assetProxyId;
    },
    decodeProxyData(proxyData: string): ProxyData {
        const assetProxyId = assetProxyUtils.decodeProxyDataId(proxyData);
        switch (assetProxyId) {
            case AssetProxyId.ERC20:
                const erc20ProxyData = assetProxyUtils.decodeERC20ProxyData(proxyData);
                const generalizedERC20ProxyData = {
                    assetProxyId,
                    tokenAddress: erc20ProxyData.tokenAddress,
                };
                return generalizedERC20ProxyData;
            case AssetProxyId.ERC721:
                const erc721ProxyData = assetProxyUtils.decodeERC721ProxyData(proxyData);
                const generaliedERC721ProxyData = {
                    assetProxyId,
                    tokenAddress: erc721ProxyData.tokenAddress,
                    data: erc721ProxyData.tokenId,
                };
                return generaliedERC721ProxyData;
            default:
                throw new Error(`Unrecognized asset proxy id: ${assetProxyId}`);
        }
    },
};
