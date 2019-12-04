import { IAssetDataContract } from '@0x/contract-wrappers';
import { hexUtils, NULL_ADDRESS } from '@0x/utils';

const fakeProvider = { isEIP1193: true } as any;

// instantiate once per app to be more performant
export const assetDataEncoder = new IAssetDataContract(NULL_ADDRESS, fakeProvider);

/**
 * Returns the first four bytes of a given hex string.
 * Does not have any validations, so the hex string MUST
 * be a valid asset data, or this function returns garbage
 * without throwing errors.
 * @param assetData A hex string where the first four bytes are a valid Asset Proxy Id
 *
 */
export function decodeAssetProxyId(assetData: string): string {
    return hexUtils.slice(assetData, 0, 4);
}
