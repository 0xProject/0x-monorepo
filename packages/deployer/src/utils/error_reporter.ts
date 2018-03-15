import { logUtils } from '@0xproject/utils';

export function consoleReporter<T>(asyncFn: (arg: T) => Promise<void>) {
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
