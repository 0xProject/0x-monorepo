import { constants } from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';
import { AbiEncoder, BigNumber } from '@0x/utils';

/**
 * Encodes the given stop limit data parameters into the bytes format expected by the
 * ChainlinkStopLimit contract.
 */
export function encodeChainlinkStopLimitData(
    oracle: string,
    stopPrice: BigNumber,
    limitPrice: BigNumber,
    priceFreshness: BigNumber,
): string {
    const encoder = AbiEncoder.create([
        { name: 'oracle', type: 'address' },
        { name: 'stopPrice', type: 'int256' },
        { name: 'limitPrice', type: 'int256' },
        { name: 'priceFreshness', type: 'uint256' },
    ]);
    return encoder.encode({ oracle, stopPrice, limitPrice, priceFreshness });
}
/**
 * Encodes the given stop limit data parameters into StaticCall asset data so that it can be used
 * in a 0x order.
 */
export function encodeStopLimiStaticCallData(
    chainlinkStopLimitAddress: string,
    oracle: string,
    stopPrice: BigNumber,
    limitPrice: BigNumber,
    priceFreshness: BigNumber,
): string {
    const staticCallData = AbiEncoder.createMethod('checkStopLimit', [{ name: 'stopLimitData', type: 'bytes' }]).encode(
        { stopLimitData: encodeChainlinkStopLimitData(oracle, stopPrice, limitPrice, priceFreshness) },
    );
    return assetDataUtils.encodeStaticCallAssetData(
        chainlinkStopLimitAddress,
        staticCallData,
        constants.KECCAK256_NULL,
    );
}
