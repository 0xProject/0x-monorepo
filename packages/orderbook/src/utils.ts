import { APIOrder, SignedOrder } from '@0x/connect';
import { orderHashUtils } from '@0x/order-utils';

export const utils = {
    getOrderHash: (order: APIOrder | SignedOrder): string => {
        if ((order as APIOrder).metaData) {
            const apiOrder = order as APIOrder;
            const orderHash = (apiOrder.metaData as any).orderHash || orderHashUtils.getOrderHashHex(apiOrder.order);
            return orderHash;
        } else {
            const orderHash = orderHashUtils.getOrderHashHex(order as SignedOrder);
            return orderHash;
        }
    },
    async delayAsync(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    async attemptAsync<T>(
        fn: () => Promise<T>,
        opts: { interval: number; maxRetries: number } = { interval: 1000, maxRetries: 10 },
    ): Promise<T> {
        let result: T | undefined;
        let attempt = 0;
        let error;
        let isSuccess = false;
        while (!result && attempt < opts.maxRetries) {
            attempt++;
            try {
                result = await fn();
                isSuccess = true;
                error = undefined;
            } catch (err) {
                error = err;
                await utils.delayAsync(opts.interval);
            }
        }
        if (!isSuccess) {
            throw error;
        }
        return result as T;
    },
};
