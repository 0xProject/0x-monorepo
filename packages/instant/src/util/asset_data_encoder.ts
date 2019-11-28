import { IAssetDataContract } from '@0x/contract-wrappers';
import { NULL_ADDRESS } from '@0x/utils';

const fakeProvider = { isEIP1193: true } as any;

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
    /**
     * Slices a hex number.
     * Copied from @0x/contracts-test-utils
     * Consider moving hex_utils into @0x/utils if this is needed in more places
     */
    function hexSlice(n: string, start: number, end?: number): string {
        const hex = n.substr(2); // removed assertions that n is a hex string
        const sliceStart = start >= 0 ? start * 2 : Math.max(0, hex.length + start * 2);
        let sliceEnd = hex.length;
        if (end !== undefined) {
            sliceEnd = end >= 0 ? end * 2 : Math.max(0, hex.length + end * 2);
        }
        return '0x'.concat(hex.substring(sliceStart, sliceEnd));
    }
    return hexSlice(assetData, 0, 4);
}
