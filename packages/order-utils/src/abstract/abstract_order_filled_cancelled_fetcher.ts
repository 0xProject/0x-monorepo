import { BigNumber } from '@0xproject/utils';

export abstract class AbstractOrderFilledCancelledFetcher {
    public abstract async getFilledTakerAmountAsync(orderHash: string): Promise<BigNumber>;
    public abstract async getCancelledTakerAmountAsync(orderHash: string): Promise<BigNumber>;
    public abstract async getUnavailableTakerAmountAsync(orderHash: string): Promise<BigNumber>;
    public abstract getZRXTokenAddress(): string;
}
