import { constants } from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';
import { AbiEncoder, BigNumber } from '@0x/utils';

/**
 * Encodes the given stop limit data parameters into the bytes format expected by the
 * ChainlinkStopLimit contract.
 */
export function encodeChainlinkStopLimitData(oracle: string, minPrice: BigNumber, maxPrice: BigNumber): string {
    const encoder = AbiEncoder.create([
        { name: 'oracle', type: 'address' },
        { name: 'minPrice', type: 'int256' },
        { name: 'maxPrice', type: 'int256' },
    ]);
    return encoder.encode({ oracle, minPrice, maxPrice });
}
/**
 * Encodes the given stop limit data parameters into StaticCall asset data so that it can be used
 * in a 0x order.
 */
export function encodeStopLimiStaticCallData(
    chainlinkStopLimitAddress: string,
    oracle: string,
    minPrice: BigNumber,
    maxPrice: BigNumber,
): string {
    const staticCallData = AbiEncoder.createMethod('checkStopLimit', [{ name: 'stopLimitData', type: 'bytes' }]).encode(
        { stopLimitData: encodeChainlinkStopLimitData(oracle, minPrice, maxPrice) },
    );
    return assetDataUtils.encodeStaticCallAssetData(
        chainlinkStopLimitAddress,
        staticCallData,
        constants.KECCAK256_NULL,
    );
}
