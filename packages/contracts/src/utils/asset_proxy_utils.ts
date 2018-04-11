import { BigNumber } from '@0xproject/utils';
import * as Web3 from 'web3';

import { AssetProxyId } from './types';
const ethersUtils = require('ethers-utils');

export function zeroPad(value: string, width: number): string {
    return '0'.repeat(width - value.length) + value;
}

export function encodeAssetProxyId(assetProxyId: AssetProxyId, encoded_metadata: { value: string }) {
    encoded_metadata.value += zeroPad(new BigNumber(assetProxyId).toString(16), 2);
}

export function encodeAddress(address: string, encoded_metadata: { value: string }) {
    encoded_metadata.value += zeroPad(address.replace('0x', ''), 40);
}

export function encodeUint256(value: BigNumber, encoded_metadata: { value: string }) {
    encoded_metadata.value += zeroPad(value.toString(16), 64);
}

export function encodeERC20ProxyMetadata_V1(tokenAddress: string) {
    // Encode metadata
    const encoded_metadata = { value: '0x' };
    encodeAssetProxyId(AssetProxyId.ERC20_V1, encoded_metadata);
    encodeAddress(tokenAddress, encoded_metadata);

    // Verify encoding length - '0x' plus 21 bytes of encoded data
    if (encoded_metadata.value.length != 44) {
        throw Error('Bad encoding length. Expected 44, got ' + encoded_metadata.value.length);
    }

    // Return encoded metadata
    return encoded_metadata.value;
}

export function encodeERC20ProxyMetadata(tokenAddress: string) {
    // Encode metadata
    const encoded_metadata = { value: '0x' };
    encodeAssetProxyId(AssetProxyId.ERC20, encoded_metadata);
    encodeAddress(tokenAddress, encoded_metadata);

    // Verify encoding length - '0x' plus 21 bytes of encoded data
    if (encoded_metadata.value.length != 44) {
        throw Error('Bad encoding length. Expected 44, got ' + encoded_metadata.value.length);
    }

    // Return encoded metadata
    return encoded_metadata.value;
}

export function encodeERC721ProxyMetadata(tokenAddress: string, tokenId: BigNumber) {
    // Encode metadata
    const encoded_metadata = { value: '0x' };
    encodeAssetProxyId(AssetProxyId.ERC721, encoded_metadata);
    encodeAddress(tokenAddress, encoded_metadata);
    encodeUint256(tokenId, encoded_metadata);

    // Verify encoding length - '0x' plus 53 bytes of encoded data
    if (encoded_metadata.value.length != 108) {
        throw Error('Bad encoding length. Expected 108, got ' + encoded_metadata.value.length);
    }

    // Return encoded metadata
    return encoded_metadata.value;
}
