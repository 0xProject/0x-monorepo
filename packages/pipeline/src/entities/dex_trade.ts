import { BigNumber } from '@0x/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

import { bigNumberTransformer, numberToBigIntTransformer } from '../utils';

// dex_trades contains on-chain trades that have occurred on a decentralized
// exchange (including 0x and some competitors).
@Entity({ name: 'dex_trades', schema: 'raw' })
export class DexTrade {
    // Typically an API URL where this trade was obtained.
    @PrimaryColumn({ name: 'source_url' })
    public sourceUrl!: string;
    // The hash of the transaction this trade was a part of.
    @PrimaryColumn({ name: 'tx_hash' })
    public txHash!: string;
    // Trade index is a unique identifier for the trade. Not necessarily
    // supported by all sources.
    @PrimaryColumn({ name: 'trade_index' })
    public tradeIndex!: string;

    // The timestamp at which this transaction occurred (in ms since Unix Epoch).
    @Column({ name: 'tx_timestamp', type: 'bigint', transformer: numberToBigIntTransformer })
    public txTimestamp!: number;
    // Deprecated. Recently removed from the Bloxy API.
    @Column({ name: 'tx_date' })
    public txDate!: string;
    // The sender of the on-chain transaction.
    @Column({ name: 'tx_sender' })
    public txSender!: string;
    // Deprecated? No longer seems to be part of the Bloxy API.
    @Column({ name: 'smart_contract_id', type: 'bigint', transformer: numberToBigIntTransformer })
    public smartContractId!: number;
    // The address of the smart contract where the trade was executed.
    @Column({ name: 'smart_contract_address' })
    public smartContractAddress!: string;
    // Deprecated? No longer seems to be part of the Bloxy API.
    @Column({ name: 'contract_type' })
    public contractType!: string;
    // The address of the maker.
    @Column({ type: 'varchar' })
    public maker!: string;
    // The address of the taker.
    @Column({ type: 'varchar' })
    public taker!: string;
    // The amount of asset being bought.
    @Column({ name: 'amount_buy', type: 'numeric', transformer: bigNumberTransformer })
    public amountBuy!: BigNumber;
    // The fee paid by the maker.
    @Column({ name: 'maker_fee_amount', type: 'numeric', transformer: bigNumberTransformer })
    public makerFeeAmount!: BigNumber;
    // Deprecated? No longer seems to be part of the Bloxy API.
    @Column({ name: 'buy_currency_id', type: 'bigint', transformer: numberToBigIntTransformer })
    public buyCurrencyId!: number;
    // The symbol of the asset being bought.
    @Column({ name: 'buy_symbol' })
    public buySymbol!: string;
    // The amount being sold.
    @Column({ name: 'amount_sell', type: 'numeric', transformer: bigNumberTransformer })
    public amountSell!: BigNumber;
    // The fee paid by the taker.
    @Column({ name: 'taker_fee_amount', type: 'numeric', transformer: bigNumberTransformer })
    public takerFeeAmount!: BigNumber;
    // Deprecated? No longer seems to be part of the Bloxy API.
    @Column({ name: 'sell_currency_id', type: 'bigint', transformer: numberToBigIntTransformer })
    public sellCurrencyId!: number;
    // The symbol of the asset being sold.
    @Column({ name: 'sell_symbol' })
    public sellSymbol!: string;
    // Annotation for the maker address.
    @Column({ name: 'maker_annotation' })
    public makerAnnotation!: string;
    // Annotation for the taker address.
    @Column({ name: 'taker_annotation' })
    public takerAnnotation!: string;
    // String representation of the DEX protocol (e.g. "IDEX")
    @Column() public protocol!: string;
    // The address of the token being bought.
    @Column({ name: 'buy_address', type: 'varchar', nullable: true })
    public buyAddress!: string | null;
    // The address of the token being sold.
    @Column({ name: 'sell_address', type: 'varchar', nullable: true })
    public sellAddress!: string | null;
}
