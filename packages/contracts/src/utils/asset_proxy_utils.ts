import { BigNumber } from '@0xproject/utils';
import * as Web3 from 'web3';

import { AssetProxyId } from './types';

export function zeroPad(value: string, width: number): string {
    return '0'.repeat(width - value.length) + value;
}

export function encodeAssetProxyId(assetProxyId: AssetProxyId, encodedMetadata: { value: string }) {
    encodedMetadata.value += zeroPad(new BigNumber(assetProxyId).toString(16), 2);
}

export function encodeAddress(address: string, encodedMetadata: { value: string }) {
    encodedMetadata.value += zeroPad(address.replace('0x', ''), 40);
}

export function encodeUint256(value: BigNumber, encodedMetadata: { value: string }) {
    encodedMetadata.value += zeroPad(value.toString(16), 64);
}

export function encodeERC20ProxyMetadata_V1(tokenAddress: string) {
    // Encode metadata
    const encodedMetadata = { value: '0x' };
    encodeAssetProxyId(AssetProxyId.ERC20_V1, encodedMetadata);
    encodeAddress(tokenAddress, encodedMetadata);

    // Verify encoding length - '0x' plus 21 bytes of encoded data
    if (encodedMetadata.value.length != 44) {
        throw Error('Bad encoding length. Expected 44, got ' + encodedMetadata.value.length);
    }

    // Return encoded metadata
    return encodedMetadata.value;
}

export function encodeERC20ProxyMetadata(tokenAddress: string) {
    // Encode metadata
    const encodedMetadata = { value: '0x' };
    encodeAssetProxyId(AssetProxyId.ERC20, encodedMetadata);
    encodeAddress(tokenAddress, encodedMetadata);

    // Verify encoding length - '0x' plus 21 bytes of encoded data
    if (encodedMetadata.value.length != 44) {
        throw Error('Bad encoding length. Expected 44, got ' + encodedMetadata.value.length);
    }

    // Return encoded metadata
    return encodedMetadata.value;
}

export function encodeERC721ProxyMetadata(tokenAddress: string, tokenId: BigNumber) {
    // Encode metadata
    const encodedMetadata = { value: '0x' };
    encodeAssetProxyId(AssetProxyId.ERC721, encodedMetadata);
    encodeAddress(tokenAddress, encodedMetadata);
    encodeUint256(tokenId, encodedMetadata);

    // Verify encoding length - '0x' plus 53 bytes of encoded data
    if (encodedMetadata.value.length != 108) {
        throw Error('Bad encoding length. Expected 108, got ' + encodedMetadata.value.length);
    }

    // Return encoded metadata
    return encodedMetadata.value;
}
