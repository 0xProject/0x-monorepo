import { Column, Entity, PrimaryColumn } from 'typeorm';

import { BigNumber } from '@0x/utils';

import { bigNumberTransformer, numberToBigIntTransformer } from '../utils';

@Entity({ name: 'slippage', schema: 'raw' })
export class Slippage {
    @PrimaryColumn({ name: 'observed_timestamp', type: 'bigint', transformer: numberToBigIntTransformer })
    public observedTimestamp!: number;
    @PrimaryColumn({ name: 'symbol' })
    public symbol!: string;
    @PrimaryColumn({ name: 'exchange' })
    public exchange!: string;
    @PrimaryColumn({ name: 'usd_amount', type: 'numeric', transformer: bigNumberTransformer })
    public usdAmount!: BigNumber;
    @Column({ name: 'token_amount', type: 'numeric', transformer: bigNumberTransformer })
    public tokenAmount!: BigNumber;
    @Column({ name: 'avg_price_in_eth_sell', type: 'numeric', transformer: bigNumberTransformer })
    public avgPriceInEthSell?: BigNumber;
    @Column({ name: 'avg_price_in_eth_buy', type: 'numeric', transformer: bigNumberTransformer })
    public avgPriceInEthBuy?: BigNumber;
    @Column({ name: 'slippage', type: 'numeric', transformer: bigNumberTransformer })
    public slippage?: BigNumber;
}
