import { constants } from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';
import { StaticCallAssetData } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';

export interface StopLimitParameters {
    oracle: string;
    minPrice: BigNumber;
    maxPrice: BigNumber;
}

const stopLimitDataEncoder = AbiEncoder.create([
    { name: 'oracle', type: 'address' },
    { name: 'minPrice', type: 'int256' },
    { name: 'maxPrice', type: 'int256' },
]);

const stopLimitMethodEncoder = AbiEncoder.createMethod('checkStopLimit', [{ name: 'stopLimitData', type: 'bytes' }]);

/**
 * Encodes the given stop limit data parameters into the bytes format expected by the
 * ChainlinkStopLimit contract.
 */
export function encodeChainlinkStopLimitData(params: StopLimitParameters): string {
    return stopLimitDataEncoder.encode(params);
}

/**
 * Encodes the given stop limit data parameters into StaticCall asset data so that it can be used
 * in a 0x order.
 */
export function encodeStopLimitStaticCallData(chainlinkStopLimitAddress: string, params: StopLimitParameters): string {
    const staticCallData = stopLimitMethodEncoder.encode({
        stopLimitData: encodeChainlinkStopLimitData(params),
    });
    return assetDataUtils.encodeStaticCallAssetData(
        chainlinkStopLimitAddress,
        staticCallData,
        constants.KECCAK256_NULL,
    );
}

/**
 * Decodes stop limit data parameters from the bytes format expected by the ChainlinkStopLimit contract.
 */
export function decodeChainlinkStopLimitData(stopLimitData: string): StopLimitParameters {
    return stopLimitDataEncoder.decode(stopLimitData);
}

/**
 * Decodes stop limit data parameters from stop limit StaticCall asset data.
 */
export function decodeStopLimitStaticCallData(assetData: string): StopLimitParameters {
    // tslint:disable-next-line:no-unnecessary-type-assertion
    const { staticCallData } = assetDataUtils.decodeAssetDataOrThrow(assetData) as StaticCallAssetData;
    const stopLimitData = stopLimitMethodEncoder.strictDecode<string>(staticCallData);
    return decodeChainlinkStopLimitData(stopLimitData);
}
