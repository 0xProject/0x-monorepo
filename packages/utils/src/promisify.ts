import * as _ from 'lodash';

/**
 * Transforms callback-based function -- func(arg1, arg2 .. argN, callback) -- into an ES6-compatible Promise.
 * Promisify provides a default callback of the form (error, result) and rejects when `error` is not null. You can also
 * supply thisArg object as the second argument which will be passed to `apply`.
 */
// HACK: This can't be properly typed without variadic kinds https://github.com/Microsoft/TypeScript/issues/5453
export function promisify<T>(originalFn: (...args: any[]) => void, thisArg?: any): (...callArgs: any[]) => Promise<T> {
    const promisifiedFunction = async (...callArgs: any[]): Promise<T> => {
        return new Promise<T>((resolve, reject) => {
            const callback = (err: Error | null, data?: T) => {
                err === null || err === undefined ? resolve(data) : reject(err);
            };
            originalFn.apply(thisArg, [...callArgs, callback]);
        });
    };
    return promisifiedFunction;
}
