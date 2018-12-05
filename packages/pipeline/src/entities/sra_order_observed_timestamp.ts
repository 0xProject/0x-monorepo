import { Entity, PrimaryColumn } from 'typeorm';

import { numberToBigIntTransformer } from '../utils';

import { SraOrder } from './sra_order';

@Entity({ name: 'sra_orders_observed_timestamps', schema: 'raw' })
export class SraOrdersObservedTimeStamp {
    @PrimaryColumn({ name: 'exchange_address' })
    public exchangeAddress!: string;
    @PrimaryColumn({ name: 'order_hash_hex' })
    public orderHashHex!: string;
    @PrimaryColumn({ name: 'source_url' })
    public sourceUrl!: string;

    @PrimaryColumn({ name: 'observed_timestamp', transformer: numberToBigIntTransformer })
    public observedTimestamp!: number;
}

/**
 * Returns a new SraOrdersObservedTimeStamp for the given order based on the
 * current time.
 * @param order The order to generate a timestamp for.
 */
export function createObservedTimestampForOrder(order: SraOrder): SraOrdersObservedTimeStamp {
    const observed = new SraOrdersObservedTimeStamp();
    observed.exchangeAddress = order.exchangeAddress;
    observed.orderHashHex = order.orderHashHex;
    observed.sourceUrl = order.sourceUrl;
    observed.observedTimestamp = Date.now();
    return observed;
}
