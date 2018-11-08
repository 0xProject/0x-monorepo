import { BigNumber } from '@0x/utils';

export function bigNumbertoStringOrNull(n: BigNumber): string | null {
    if (n == null) {
        return null;
    }
    return n.toString();
}

export function handleError(e: any): void {
    if (e.message != null) {
        console.error(e.message);
    } else {
        console.error('Unknown error');
    }
    if (e.stack != null) {
        console.error(e.stack);
    } else {
        console.error('(No stack trace)');
    }
    process.exit(1);
}
