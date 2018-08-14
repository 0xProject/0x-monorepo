export const intervalUtils = {
    setAsyncExcludingInterval(
        fn: () => Promise<void>,
        intervalMs: number,
        onError: (err: Error) => void,
    ): NodeJS.Timer {
        let isLocked = false;
        const intervalId = setInterval(async () => {
            if (isLocked) {
                return;
            } else {
                isLocked = true;
                try {
                    await fn();
                } catch (err) {
                    onError(err);
                }
                isLocked = false;
            }
        }, intervalMs);
        return intervalId;
    },
    clearAsyncExcludingInterval(intervalId: NodeJS.Timer): void {
        clearInterval(intervalId);
    },
    setInterval(fn: () => void, intervalMs: number, onError: (err: Error) => void): NodeJS.Timer {
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
