import { BigNumber, fetchAsync } from '@0x/utils';
export * from './transformers';
export * from './constants';

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
 * If value is null or undefined, returns null. Otherwise converts value to a
 * BigNumber.
 * @param value A string or number to be converted to a BigNumber
 */
export function toBigNumberOrNull(value: string | number | null): BigNumber | null {
    switch (value) {
        case null:
        case undefined:
            return null;
        default:
            return new BigNumber(value);
    }
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

/**
 * Does fetchAsync(), and checks the status code, throwing if it doesn't indicate success.
 */
export async function fetchSuccessfullyOrThrowAsync(url: string): Promise<any> {
    const response = await fetchAsync(url);
    if (!response.ok) {
        throw new Error(`Unsuccessful HTTP status code (${response.status}): ${response.statusText}`);
    }
    return response.json();
}
