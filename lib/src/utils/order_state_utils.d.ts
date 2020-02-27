import { DevUtilsContract } from '@0x/contract-wrappers';
import { SignedOrder } from '@0x/types';
import { SignedOrderWithFillableAmounts } from '../types';
/**
 * Utility class to retrieve order state if needed outside of using the ERC20BridgeSampler
 */
export declare class OrderStateUtils {
    private readonly _devUtils;
    constructor(devUtils: DevUtilsContract);
    getSignedOrdersWithFillableAmountsAsync(signedOrders: SignedOrder[]): Promise<SignedOrderWithFillableAmounts[]>;
}
//# sourceMappingURL=order_state_utils.d.ts.map