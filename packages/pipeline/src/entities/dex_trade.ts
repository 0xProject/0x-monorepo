import { BigNumber } from '@0x/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

import { bigNumberTransformer, numberToBigIntTransformer } from '../utils';

@Entity({ name: 'dex_trades', schema: 'raw' })
export class DexTrade {
    @PrimaryColumn({ name: 'source_url' })
    public sourceUrl!: string;
    @PrimaryColumn({ name: 'tx_hash' })
    public txHash!: string;
    @PrimaryColumn({ name: 'trade_index' })
    public tradeIndex!: string;

    @Column({ name: 'tx_timestamp', type: 'bigint', transformer: numberToBigIntTransformer })
    public txTimestamp!: number;
    @Column({ name: 'tx_date' })
    public txDate!: string;
    @Column({ name: 'tx_sender' })
    public txSender!: string;
    @Column({ name: 'smart_contract_id', type: 'bigint', transformer: numberToBigIntTransformer })
    public smartContractId!: number;
    @Column({ name: 'smart_contract_address' })
    public smartContractAddress!: string;
    @Column({ name: 'contract_type' })
    public contractType!: string;
    @Column({ type: 'varchar' })
    public maker!: string;
    @Column({ type: 'varchar' })
    public taker!: string;
    @Column({ name: 'amount_buy', type: 'numeric', transformer: bigNumberTransformer })
    public amountBuy!: BigNumber;
    @Column({ name: 'maker_fee_amount', type: 'numeric', transformer: bigNumberTransformer })
    public makerFeeAmount!: BigNumber;
    @Column({ name: 'buy_currency_id', type: 'bigint', transformer: numberToBigIntTransformer })
    public buyCurrencyId!: number;
    @Column({ name: 'buy_symbol' })
    public buySymbol!: string;
    @Column({ name: 'amount_sell', type: 'numeric', transformer: bigNumberTransformer })
    public amountSell!: BigNumber;
    @Column({ name: 'taker_fee_amount', type: 'numeric', transformer: bigNumberTransformer })
    public takerFeeAmount!: BigNumber;
    @Column({ name: 'sell_currency_id', type: 'bigint', transformer: numberToBigIntTransformer })
    public sellCurrencyId!: number;
    @Column({ name: 'sell_symbol' })
    public sellSymbol!: string;
    @Column({ name: 'maker_annotation' })
    public makerAnnotation!: string;
    @Column({ name: 'taker_annotation' })
    public takerAnnotation!: string;
    @Column() public protocol!: string;
    @Column({ name: 'buy_address', type: 'varchar', nullable: true })
    public buyAddress!: string | null;
    @Column({ name: 'sell_address', type: 'varchar', nullable: true })
    public sellAddress!: string | null;
}
