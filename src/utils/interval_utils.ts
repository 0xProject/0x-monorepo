import * as _ from 'lodash';

export const intervalUtils = {
    setAsyncExcludingInterval(fn: () => Promise<void>, intervalMs: number) {
        let locked = false;
        const intervalId = setInterval(async () => {
            if (locked) {
                return;
            } else {
                locked = true;
                await fn();
                locked = false;
            }
        });
        return intervalId;
    },
    clearAsyncExcludingInterval(intervalId: number): void {
        clearInterval(intervalId);
    },
};
