import { Entity, PrimaryColumn } from 'typeorm';

import { numberToBigIntTransformer } from '../utils';

import { SraOrder } from './sra_order';

// Contains observed timestamps for SRA orders in the sra_orders table. This can
// be used to determine when an order first appeard on the order book and how
// long it was there.
@Entity({ name: 'sra_orders_observed_timestamps', schema: 'raw' })
export class SraOrdersObservedTimeStamp {
    // The address of the exchange contract for this order (e.g. might be the
    // address of the V1 exchange or the V2 one).
    @PrimaryColumn({ name: 'exchange_address' })
    public exchangeAddress!: string;
    // The hash of the order.
    @PrimaryColumn({ name: 'order_hash_hex' })
    public orderHashHex!: string;
    // The URL of an SRA endpoint where this order was found.
    @PrimaryColumn({ name: 'source_url' })
    public sourceUrl!: string;

    // The time that the order was observed in the order book. Each order may
    // have been observed multiple times.
    @PrimaryColumn({ name: 'observed_timestamp', transformer: numberToBigIntTransformer })
    public observedTimestamp!: number;
}

/**
 * Returns a new SraOrdersObservedTimeStamp for the given order based on the
 * current time.
 * @param order The order to generate a timestamp for.
 */
export function createObservedTimestampForOrder(
    order: SraOrder,
    observedTimestamp: number,
): SraOrdersObservedTimeStamp {
    const observed = new SraOrdersObservedTimeStamp();
    observed.exchangeAddress = order.exchangeAddress;
    observed.orderHashHex = order.orderHashHex;
    observed.sourceUrl = order.sourceUrl;
    observed.observedTimestamp = observedTimestamp;
    return observed;
}
