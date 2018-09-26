import { BigNumber } from '@0xproject/utils';

export function bigNumbertoStringOrNull(n: BigNumber): string | null {
    if (n == null) {
        return null;
    }
    return n.toString();
}
