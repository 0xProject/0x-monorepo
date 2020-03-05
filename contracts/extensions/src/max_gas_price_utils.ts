import { constants } from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';
import { StaticCallAssetData } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';

const customGasPriceEncoder = AbiEncoder.createMethod('checkGasPrice', [{ name: 'maxGasPrice', type: 'uint256' }]);
const defaultGasPriceEncoder = AbiEncoder.createMethod('checkGasPrice', []);

const ONE_GWEI = new BigNumber(10 ** 9);
export const TWENTY_GWEI = ONE_GWEI.times(20);

/**
 * Encodes the given stop limit data parameters into StaticCall asset data so that it can be used
 * in a 0x order.
 */
export function encodeMaxGasPriceStaticCallData(maxGasPriceContractAddress: string, maxGasPrice?: BigNumber): string {
    const staticCallData =
        maxGasPrice === undefined ? defaultGasPriceEncoder.encode({}) : customGasPriceEncoder.encode({ maxGasPrice });
    return assetDataUtils.encodeStaticCallAssetData(
        maxGasPriceContractAddress,
        staticCallData,
        constants.KECCAK256_NULL,
    );
}

/**
 * Decodes the maxGasPrice StaticCall asset data.
 */
export function decodeMaxGasPriceStaticCallData(assetData: string): BigNumber {
    // tslint:disable-next-line:no-unnecessary-type-assertion
    const { staticCallData } = assetDataUtils.decodeAssetDataOrThrow(assetData) as StaticCallAssetData;
    try {
        return customGasPriceEncoder.strictDecode<BigNumber>(staticCallData);
    } catch (e) {
        defaultGasPriceEncoder.strictDecode(staticCallData);
        return TWENTY_GWEI;
    }
}
