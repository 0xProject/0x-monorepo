import { BigNumber } from '@0x/utils';

export interface GenericRawOrder {
    price: string;
    amount: string;
}

/**
 * Aggregates individual orders by price point. Filters zero amount orders.
 * @param rawOrders An array of objects that have price and amount information.
 */
export function aggregateOrders(rawOrders: GenericRawOrder[]): Array<[string, BigNumber]> {
    const aggregatedOrders = new Map<string, BigNumber>();
    rawOrders.forEach(order => {
        const amount = new BigNumber(order.amount);
        if (amount.isZero()) {
            return;
        }
        // Use string instead of BigNum to aggregate by value instead of variable.
        // Convert to BigNumber first to consolidate different string
        // representations of the same number. Eg. '0.0' and '0.00'.
        const price = new BigNumber(order.price).toString();

        const existingAmount = aggregatedOrders.get(price) || new BigNumber(0);
        aggregatedOrders.set(price, amount.plus(existingAmount));
    });
    return Array.from(aggregatedOrders.entries());
}
