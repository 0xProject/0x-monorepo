import { Column, Entity, PrimaryColumn } from 'typeorm';
import { numberToBigIntTransformer } from '../utils';

@Entity({ name: 'slippage', schema: 'raw' })
export class Slippage {
    @PrimaryColumn({ name: 'observed_timestamp', type: 'bigint', transformer: numberToBigIntTransformer})
    public observedTimestamp!: number;
    @PrimaryColumn({ name: 'symbol' })
    public symbol!: string;
    @PrimaryColumn({ name: 'exchange' })
    public exchange!: string;
    @PrimaryColumn({ name: 'usd_amount', type: 'numeric' })
    public usdAmount!: number;
    @PrimaryColumn({ name: 'token_amount', type: 'numeric' })
    public tokenAmount!: number;
    @PrimaryColumn({ name: 'avg_price_in_eth_sell', type: 'numeric' })
    public avgPriceInEthSell?: number;
    @PrimaryColumn({ name: 'avg_price_in_eth_buy', type: 'numeric' })
    public avgPriceInEthBuy?: number;
    @Column({ name: 'slippage', type: 'numeric' })
    public slippage?: number;
}
