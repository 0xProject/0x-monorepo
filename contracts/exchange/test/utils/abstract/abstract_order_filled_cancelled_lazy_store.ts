import { BigNumber } from '@0x/utils';

export abstract class AbstractOrderFilledCancelledLazyStore {
    public abstract async getFilledTakerAmountAsync(orderHash: string): Promise<BigNumber>;
    public abstract setFilledTakerAmount(orderHash: string, balance: BigNumber): void;
    public abstract deleteFilledTakerAmount(orderHash: string): void;
    public abstract setIsCancelled(orderHash: string, isCancelled: boolean): void;
    public abstract deleteIsCancelled(orderHash: string): void;
    public abstract deleteAll(): void;
}
