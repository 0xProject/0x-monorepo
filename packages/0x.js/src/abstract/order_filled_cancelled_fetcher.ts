import { BigNumber } from '@0xproject/utils';

export abstract class OrderFilledCancelledFetcher {
    public abstract async getFilledTakerAmountAsync(orderHash: string): Promise<BigNumber>;
    public abstract async getCancelledTakerAmountAsync(orderHash: string): Promise<BigNumber>;
}
