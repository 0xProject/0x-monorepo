import { BigNumber } from '@0x/utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';

import { bigNumberTransformer } from '../utils/transformers';

// Contains metadata about ERC20 tokens.
// See: https://theethereum.wiki/w/index.php/ERC20_Token_Standard
@Entity({ name: 'token_metadata', schema: 'raw' })
export class TokenMetadata {
    // The address of the token contract.
    @PrimaryColumn({ type: 'varchar', nullable: false })
    public address!: string;

    // The "authority" or where this metadata was obtained. Either "0x" for the
    // 0x token registry or "metamask" for the MetaMask "Contract Map" list.
    @PrimaryColumn({ type: 'varchar', nullable: false })
    public authority!: string;

    // The number of decimals which determines the "base unit" for the token.
    @Column({ type: 'numeric', transformer: bigNumberTransformer, nullable: true })
    public decimals!: BigNumber | null;

    // A human-readable symbol for the token (e.g. "ZRX")
    @Column({ type: 'varchar', nullable: true })
    public symbol!: string | null;

    // A hunam-readable name for the token (e.g. "0x Protocol")
    @Column({ type: 'varchar', nullable: true })
    public name!: string | null;
}
