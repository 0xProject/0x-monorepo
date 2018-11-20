import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'trusted_tokens', schema: 'raw' })
export class TrustedToken {
    @PrimaryColumn() public address!: string;
    @PrimaryColumn() public authority!: string;
}
