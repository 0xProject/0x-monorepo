import { SignedOrder } from '@0x/types';
import { OrderPrunerPermittedFeeTypes } from '../types';
export declare const orderPrunerUtils: {
    pruneForUsableSignedOrders(signedOrders: SignedOrder[], permittedOrderFeeTypes: Set<OrderPrunerPermittedFeeTypes>, expiryBufferMs: number): SignedOrder[];
};
//# sourceMappingURL=order_prune_utils.d.ts.map