import * as _ from 'lodash';

/**
 * Transforms callback-based function -- func(arg1, arg2 .. argN, callback) -- into
 * an ES6-compatible Promise. Promisify provides a default callback of the form (error, result)
 * and rejects when `error` is not null. You can also supply settings object as the second argument.
 */
export function promisify<T>(
    originalFn: (
        ...args: any[],
        // HACK: This can't be properly typed without variadic kinds https://github.com/Microsoft/TypeScript/issues/5453
    ) => void,
    target?: any,
): (...callArgs: any[]) => Promise<T> {
    const promisifiedFunction = async (...callArgs: any[]): Promise<T> => {
        return new Promise<T>((resolve, reject) => {
            const callback = (err: Error|null, data?: T) => {
                _.isNull(err) ? resolve(data) : reject(err);
            };
            originalFn.apply(target, [...callArgs, callback]);
        });
    };
    return promisifiedFunction;
}
