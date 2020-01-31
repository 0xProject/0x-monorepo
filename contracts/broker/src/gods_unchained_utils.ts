import { assetDataUtils } from '@0x/order-utils';
import { AbiEncoder, BigNumber } from '@0x/utils';

export const godsUnchainedUtils = {
    /**
     * Encodes the given proto and quality into the bytes format expected by the GodsUnchainedValidator.
     */
    encodePropertyData(proto: BigNumber, quality: BigNumber): string {
        return AbiEncoder.create([{ name: 'proto', type: 'uint16' }, { name: 'quality', type: 'uint8' }]).encode({
            proto,
            quality,
        });
    },
    /**
     * Encodes the given proto and quality into ERC1155 asset data to be used as the takerAssetData
     * of a property-based GodsUnchained order. Must also provide the addresses of the Broker,
     * GodsUnchained, and GodsUnchainedValidator contracts. The optional bundleSize parameter specifies
     * how many cards are expected for each "unit" of the takerAssetAmount. For example, If the
     * takerAssetAmount is 3 and the bundleSize is 2, the taker must provide 2, 4, or 6 cards
     * with the given proto and quality to fill the order. If an odd number is provided, the fill fails.
     */
    encodeBrokerAssetData(
        brokerAddress: string,
        godsUnchainedAddress: string,
        validatorAddress: string,
        proto: BigNumber,
        quality: BigNumber,
        bundleSize: number = 1,
    ): string {
        const dataEncoder = AbiEncoder.create([
            { name: 'godsUnchainedAddress', type: 'address' },
            { name: 'validatorAddress', type: 'address' },
            { name: 'propertyData', type: 'bytes' },
        ]);
        const propertyData = AbiEncoder.create([
            { name: 'proto', type: 'uint16' },
            { name: 'quality', type: 'uint8' },
        ]).encode({ proto, quality });
        const data = dataEncoder.encode({ godsUnchainedAddress, validatorAddress, propertyData });
        return assetDataUtils.encodeERC1155AssetData(brokerAddress, [], [new BigNumber(bundleSize)], data);
    },
};
