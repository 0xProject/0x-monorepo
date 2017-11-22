import { DoneCallback } from '../../src/types';

export const reportCallbackErrors = (done: DoneCallback) => {
    return (fAsync: (...args: any[]) => void|Promise<void>) => {
        const wrapped = async (...args: any[]) => {
            try {
                await fAsync(...args);
            } catch (err) {
                done(err);
            }
        };
        return wrapped;
    };
};
