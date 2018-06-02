import { AssetProxyId, ERC20ProxyData, ERC721ProxyData, ProxyData } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import BN = require('bn.js');
import ethUtil = require('ethereumjs-util');

const ERC20_PROXY_METADATA_BYTE_LENGTH = 21;
const ERC721_PROXY_METADATA_BYTE_LENGTH = 53;

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
    encodeERC20ProxyData(tokenAddress: string): string {
        const encodedAssetProxyId = assetProxyUtils.encodeAssetProxyId(AssetProxyId.ERC20);
        const encodedAddress = assetProxyUtils.encodeAddress(tokenAddress);
        const encodedMetadata = Buffer.concat([encodedAddress, encodedAssetProxyId]);
        const encodedMetadataHex = ethUtil.bufferToHex(encodedMetadata);
        return encodedMetadataHex;
    },
    decodeERC20ProxyData(proxyData: string): ERC20ProxyData {
        const encodedProxyMetadata = ethUtil.toBuffer(proxyData);
        if (encodedProxyMetadata.byteLength !== ERC20_PROXY_METADATA_BYTE_LENGTH) {
            throw new Error(
                `Could not decode ERC20 Proxy Data. Expected length of encoded data to be 21. Got ${
                    encodedProxyMetadata.byteLength
                }`,
            );
        }
        const encodedAssetProxyId = encodedProxyMetadata.slice(-1);
        const assetProxyId = assetProxyUtils.decodeAssetProxyId(encodedAssetProxyId);
        if (assetProxyId !== AssetProxyId.ERC20) {
            throw new Error(
                `Could not decode ERC20 Proxy Data. Expected Asset Proxy Id to be ERC20 (${
                    AssetProxyId.ERC20
                }), but got ${assetProxyId}`,
            );
        }
        const addressOffset = ERC20_PROXY_METADATA_BYTE_LENGTH - 1;
        const encodedTokenAddress = encodedProxyMetadata.slice(0, addressOffset);
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
        const encodedMetadata = Buffer.concat([encodedAddress, encodedTokenId, encodedAssetProxyId]);
        const encodedMetadataHex = ethUtil.bufferToHex(encodedMetadata);
        return encodedMetadataHex;
    },
    decodeERC721ProxyData(proxyData: string): ERC721ProxyData {
        const encodedProxyMetadata = ethUtil.toBuffer(proxyData);
        if (encodedProxyMetadata.byteLength !== ERC721_PROXY_METADATA_BYTE_LENGTH) {
            throw new Error(
                `Could not decode ERC20 Proxy Data. Expected length of encoded data to be 53. Got ${
                    encodedProxyMetadata.byteLength
                }`,
            );
        }
        const encodedAssetProxyId = encodedProxyMetadata.slice(-1);
        const assetProxyId = assetProxyUtils.decodeAssetProxyId(encodedAssetProxyId);
        if (assetProxyId !== AssetProxyId.ERC721) {
            throw new Error(
                `Could not decode ERC721 Proxy Data. Expected Asset Proxy Id to be ERC721 (${
                    AssetProxyId.ERC721
                }), but got ${assetProxyId}`,
            );
        }
        const addressOffset = ERC20_PROXY_METADATA_BYTE_LENGTH - 1;
        const encodedTokenAddress = encodedProxyMetadata.slice(0, addressOffset);
        const tokenAddress = assetProxyUtils.decodeAddress(encodedTokenAddress);
        const tokenIdOffset = ERC721_PROXY_METADATA_BYTE_LENGTH - 1;
        const encodedTokenId = encodedProxyMetadata.slice(addressOffset, tokenIdOffset);
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
        const encodedAssetProxyId = encodedProxyMetadata.slice(-1);
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
