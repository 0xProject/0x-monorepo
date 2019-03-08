import { Column, Entity, PrimaryColumn } from 'typeorm';

import { numberToBigIntTransformer } from '../utils';

@Entity({ name: 'github_repo', schema: 'raw' })
export class GithubRepo {
    @PrimaryColumn({ name: 'observed_timestamp', type: 'bigint', transformer: numberToBigIntTransformer })
    public observedTimestamp!: number;

    @PrimaryColumn({ name: 'name' })
    public name!: string;

    @Column({ name: 'created_at', type: 'bigint', transformer: numberToBigIntTransformer })
    public createdAt!: number;

    @Column({ name: 'updated_at', type: 'bigint', transformer: numberToBigIntTransformer })
    public updatedAt!: number;

    @Column({ name: 'pushed_at', type: 'bigint', transformer: numberToBigIntTransformer })
    public pushedAt!: number;

    @Column({ name: 'size', transformer: numberToBigIntTransformer })
    public size!: number;

    @Column({ name: 'stargazers', transformer: numberToBigIntTransformer })
    public stargazers!: number;

    @Column({ name: 'watchers', transformer: numberToBigIntTransformer })
    public watchers!: number;

    @Column({ name: 'forks', transformer: numberToBigIntTransformer })
    public forks!: number;

    @Column({ name: 'open_issues', transformer: numberToBigIntTransformer })
    public openIssues!: number;

    @Column({ name: 'network', transformer: numberToBigIntTransformer })
    public network!: number;

    @Column({ name: 'subscribers', transformer: numberToBigIntTransformer })
    public subscribers!: number;

}
