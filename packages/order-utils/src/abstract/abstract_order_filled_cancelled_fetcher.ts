import { BigNumber } from '@0xproject/utils';

export abstract class AbstractOrderFilledCancelledFetcher {
    public abstract async getFilledTakerAmountAsync(orderHash: string): Promise<BigNumber>;
    public abstract async isOrderCancelledAsync(orderHash: string): Promise<boolean>;
    public abstract getZRXAssetData(): string;
}
