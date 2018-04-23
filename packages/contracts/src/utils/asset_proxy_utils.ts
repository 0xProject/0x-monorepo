import { BigNumber } from '@0xproject/utils';
import BN = require('bn.js');
import ethUtil = require('ethereumjs-util');

import { AssetProxyId } from './types';

export const assetProxyUtils = {
    encodeAssetProxyId(assetProxyId: AssetProxyId): Buffer {
        return ethUtil.toBuffer(assetProxyId);
    },
    encodeAddress(address: string): Buffer {
        if (!ethUtil.isValidAddress(address)) {
            throw new Error(`Invalid Address: ${address}`);
        }
        const encodedAddress = ethUtil.toBuffer(address);
        return encodedAddress;
    },
    encodeUint256(value: BigNumber): Buffer {
        const formattedValue = new BN(value.toString(10));
        const encodedValue = ethUtil.toBuffer(formattedValue);
        return encodedValue;
    },
    encodeERC20ProxyData(tokenAddress: string): string {
        const encodedAssetProxyId = assetProxyUtils.encodeAssetProxyId(AssetProxyId.ERC20);
        const encodedAddress = assetProxyUtils.encodeAddress(tokenAddress);
        const encodedMetadata = Buffer.concat([encodedAssetProxyId, encodedAddress]);
        const encodedMetadataHex = ethUtil.bufferToHex(encodedMetadata);
        return encodedMetadataHex;
    },
    encodeERC721ProxyData(tokenAddress: string, tokenId: BigNumber): string {
        const encodedAssetProxyId = assetProxyUtils.encodeAssetProxyId(AssetProxyId.ERC721);
        const encodedAddress = assetProxyUtils.encodeAddress(tokenAddress);
        const encodedTokenId = assetProxyUtils.encodeUint256(tokenId);
        const encodedMetadata = Buffer.concat([encodedAssetProxyId, encodedAddress, encodedTokenId]);
        const encodedMetadataHex = ethUtil.bufferToHex(encodedMetadata);
        return encodedMetadataHex;
    },
};
