import { assetDataUtils } from '@0x/order-utils';
import { AbiEncoder, BigNumber } from '@0x/utils';

export const godsUnchainedUtils = {
    encodePropertyData(proto: BigNumber, quality: BigNumber): string {
        return AbiEncoder.create([{ name: 'proto', type: 'uint16' }, { name: 'quality', type: 'uint8' }]).encode({
            proto,
            quality,
        });
    },
    encodeBrokerAssetData(
        brokerAddress: string,
        validatorAddress: string,
        proto: BigNumber,
        quality: BigNumber,
        bundleSize: number = 1,
    ): string {
        const dataEncoder = AbiEncoder.create([
            { name: 'validatorAddress', type: 'address' },
            { name: 'propertyData', type: 'bytes' },
        ]);
        const propertyData = AbiEncoder.create([
            { name: 'proto', type: 'uint16' },
            { name: 'quality', type: 'uint8' },
        ]).encode({ proto, quality });
        const data = dataEncoder.encode({ validatorAddress, propertyData });
        return assetDataUtils.encodeERC1155AssetData(brokerAddress, [], [new BigNumber(bundleSize)], data);
    },
};
