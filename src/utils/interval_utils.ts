import * as _ from 'lodash';

export class IntervalUtils {
    private mutex: {[intervalId: number]: boolean} = {};
    public setAsyncExcludingInterval(fn: () => Promise<void>, intervalMs: number) {
        const intervalId = setInterval(async () => {
            if (_.isUndefined(this.mutex[intervalId])) {
                return;
            } else {
                this.mutex[intervalId] = true;
                await fn();
                delete this.mutex[intervalId];
            }
        });
        return intervalId;
    }
    public clearAsyncExcludingInterval(intervalId: number): void {
        clearInterval(intervalId);
    }
}
