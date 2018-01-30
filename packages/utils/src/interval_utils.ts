import * as _ from 'lodash';

export const intervalUtils = {
    setAsyncExcludingInterval(fn: () => Promise<void>, intervalMs: number, onError: (err: Error) => void) {
        let locked = false;
        const intervalId = setInterval(async () => {
            if (locked) {
                return;
            } else {
                locked = true;
                try {
                    await fn();
                } catch (err) {
                    onError(err);
                }
                locked = false;
            }
        }, intervalMs);
        return intervalId;
    },
    clearAsyncExcludingInterval(intervalId: NodeJS.Timer): void {
        clearInterval(intervalId);
    },
    setInterval(fn: () => void, intervalMs: number, onError: (err: Error) => void) {
        const intervalId = setInterval(() => {
            try {
                fn();
            } catch (err) {
                onError(err);
            }
        }, intervalMs);
        return intervalId;
    },
    clearInterval(intervalId: NodeJS.Timer): void {
        clearInterval(intervalId);
    },
};
