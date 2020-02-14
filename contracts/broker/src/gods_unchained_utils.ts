import { assetDataUtils } from '@0x/order-utils';
import { ERC1155AssetData } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';

export interface GodsUnchainedProperties {
    proto: BigNumber | number;
    quality: BigNumber | number;
}

const propertyDataEncoder = AbiEncoder.create([{ name: 'proto', type: 'uint16' }, { name: 'quality', type: 'uint8' }]);
const brokerDataEncoder = AbiEncoder.create([
    { name: 'godsUnchainedAddress', type: 'address' },
    { name: 'validatorAddress', type: 'address' },
    { name: 'propertyData', type: 'bytes' },
]);

/**
 * Encodes the given proto and quality into the bytes format expected by the GodsUnchainedValidator.
 */
export function encodePropertyData(properties: GodsUnchainedProperties): string {
    return propertyDataEncoder.encode(properties);
}

/**
 * Encodes the given proto and quality into ERC1155 asset data to be used as the takerAssetData
 * of a property-based GodsUnchained order. Must also provide the addresses of the Broker,
 * GodsUnchained, and GodsUnchainedValidator contracts. The optional bundleSize parameter specifies
 * how many cards are expected for each "unit" of the takerAssetAmount. For example, If the
 * takerAssetAmount is 3 and the bundleSize is 2, the taker must provide 2, 4, or 6 cards
 * with the given proto and quality to fill the order. If an odd number is provided, the fill fails.
 */
export function encodeBrokerAssetData(
    brokerAddress: string,
    godsUnchainedAddress: string,
    validatorAddress: string,
    properties: GodsUnchainedProperties,
    bundleSize: number = 1,
): string {
    const propertyData = propertyDataEncoder.encode(properties);
    const brokerData = brokerDataEncoder.encode({ godsUnchainedAddress, validatorAddress, propertyData });
    return assetDataUtils.encodeERC1155AssetData(brokerAddress, [], [new BigNumber(bundleSize)], brokerData);
}

/**
 * Decodes proto and quality from the bytes format expected by the GodsUnchainedValidator.
 */
export function decodePropertyData(propertyData: string): GodsUnchainedProperties {
    return propertyDataEncoder.decode(propertyData);
}

/**
 * Decodes proto and quality from the ERC1155 takerAssetData of a property-based GodsUnchained order.
 */
export function decodeBrokerAssetData(brokerAssetData: string): GodsUnchainedProperties {
    // tslint:disable-next-line:no-unnecessary-type-assertion
    const { callbackData: brokerData } = assetDataUtils.decodeAssetDataOrThrow(brokerAssetData) as ERC1155AssetData;
    const { propertyData } = brokerDataEncoder.decode(brokerData);
    return decodePropertyData(propertyData);
}
