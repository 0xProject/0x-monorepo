import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

/**
 * An abstract class to be implemented in order to use OrderStateUtils. The class that
 * implements this interface must be capable of fetching the amount filled of an order
 * and whether it's been cancelled.
 */
export abstract class AbstractOrderFilledCancelledFetcher {
    /**
     * Get the amount of the order's takerToken amount already filled
     * @param orderHash OrderHash of order we are interested in
     * @return FilledTakerAmount
     */
    public abstract async getFilledTakerAmountAsync(orderHash: string): Promise<BigNumber>;
    /**
     * Whether an order is cancelled
     * @param orderHash OrderHash of order we are interested in
     * @return Whether or not the order is cancelled
     */
    public abstract async isOrderCancelledAsync(signedOrder: SignedOrder): Promise<boolean>;
}
