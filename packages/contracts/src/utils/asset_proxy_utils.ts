import { BigNumber } from '@0xproject/utils';
import BN = require('bn.js');
import ethUtil = require('ethereumjs-util');
import * as Web3 from 'web3';

import { AssetProxyId } from './types';

export function encodeAssetProxyId(assetProxyId: AssetProxyId): Buffer {
    const formattedAssetProxyId = new BN(assetProxyId);
    const encodedAssetProxyId = ethUtil.toUnsigned(formattedAssetProxyId);
    return encodedAssetProxyId;
}

export function encodeAddress(address: string): Buffer {
    if (!ethUtil.isValidAddress(address)) {
        throw new Error(`Invalid Address: ${address}`);
    }
    const encodedAddress = ethUtil.toBuffer(address);
    return encodedAddress;
}

export function encodeUint256(value: BigNumber): Buffer {
    const formattedValue = new BN(value.toString(10));
    const encodedValue = ethUtil.toUnsigned(formattedValue);
    return encodedValue;
}

export function encodeERC20ProxyMetadata_V1(tokenAddress: string) {
    // Encode metadata
    const encodedAssetProxyId = encodeAssetProxyId(AssetProxyId.ERC20_V1);
    const encodedAddress = encodeAddress(tokenAddress);
    const encodedMetadata = Buffer.concat([encodedAssetProxyId, encodedAddress]);
    const encodedMetadataHex = ethUtil.bufferToHex(encodedMetadata);

    return encodedMetadataHex;
}

export function encodeERC20ProxyMetadata(tokenAddress: string) {
    // Encode metadata
    const encodedAssetProxyId = encodeAssetProxyId(AssetProxyId.ERC20);
    const encodedAddress = encodeAddress(tokenAddress);
    const encodedMetadata = Buffer.concat([encodedAssetProxyId, encodedAddress]);
    const encodedMetadataHex = ethUtil.bufferToHex(encodedMetadata);

    return encodedMetadataHex;
}

export function encodeERC721ProxyMetadata(tokenAddress: string, tokenId: BigNumber) {
    // Encode metadata
    const encodedAssetProxyId = encodeAssetProxyId(AssetProxyId.ERC721);
    const encodedAddress = encodeAddress(tokenAddress);
    const encodedTokenId = encodeUint256(tokenId);
    const encodedMetadata = Buffer.concat([encodedAssetProxyId, encodedAddress, encodedTokenId]);
    const encodedMetadataHex = ethUtil.bufferToHex(encodedMetadata);

    return encodedMetadataHex;
}
