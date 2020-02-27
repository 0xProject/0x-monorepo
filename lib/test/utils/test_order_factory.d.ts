import { SignedOrder } from '@0x/types';
import { SignedOrderWithFillableAmounts } from '../../src/types';
export declare const testOrderFactory: {
    generateTestSignedOrder(partialOrder: Partial<SignedOrder>): SignedOrder;
    generateIdenticalTestSignedOrders(partialOrder: Partial<SignedOrder>, numOrders: number): SignedOrder[];
    generateTestSignedOrders(partialOrders: Partial<SignedOrder>[]): SignedOrder[];
    generateTestSignedOrderWithFillableAmounts(partialOrder: Partial<SignedOrderWithFillableAmounts>): SignedOrderWithFillableAmounts;
    generateIdenticalTestSignedOrdersWithFillableAmounts(partialOrder: Partial<SignedOrderWithFillableAmounts>, numOrders: number): SignedOrderWithFillableAmounts[];
    generateTestSignedOrdersWithFillableAmounts(partialOrders: Partial<SignedOrderWithFillableAmounts>[]): SignedOrderWithFillableAmounts[];
};
//# sourceMappingURL=test_order_factory.d.ts.map