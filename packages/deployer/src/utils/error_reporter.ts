import { logUtils } from '@0xproject/utils';

/**
 * Makes an async function no-throw printing errors to the console
 * @param asyncFn async function to wrap
 * @return Wrapped version of the passed function
 */
export function consoleReporter<T>(asyncFn: (arg: T) => Promise<void>): (arg: T) => Promise<void> {
    const noThrowFnAsync = async (arg: T) => {
        try {
            const result = await asyncFn(arg);
            return result;
        } catch (err) {
            logUtils.log(`${err}`);
        }
    };
    return noThrowFnAsync;
}
