import { BigNumber } from '@0x/utils';
export * from './transformers';

/**
 * If the given BigNumber is not null, returns the string representation of that
 * number. Otherwise, returns null.
 * @param n The number to convert.
 */
export function bigNumbertoStringOrNull(n: BigNumber): string | null {
    if (n == null) {
        return null;
    }
    return n.toString();
}

/**
 * Logs an error by intelligently checking for `message` and `stack` properties.
 * Intended for use with top-level immediately invoked asynchronous functions.
 * @param e the error to log.
 */
export function handleError(e: any): void {
    if (e.message != null) {
        // tslint:disable-next-line:no-console
        console.error(e.message);
    } else {
        // tslint:disable-next-line:no-console
        console.error('Unknown error');
    }
    if (e.stack != null) {
        // tslint:disable-next-line:no-console
        console.error(e.stack);
    } else {
        // tslint:disable-next-line:no-console
        console.error('(No stack trace)');
    }
    process.exit(1);
}
