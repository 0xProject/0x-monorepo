import { Column, Entity, PrimaryColumn } from 'typeorm';

import { numberToBigIntTransformer } from '../utils';

@Entity({ name: 'github_fork', schema: 'raw' })
export class GithubFork {
    @PrimaryColumn({ name: 'observed_timestamp', type: 'bigint', transformer: numberToBigIntTransformer })
    public observedTimestamp!: number;

    @PrimaryColumn({ name: 'full_name' })
    public fullName!: string;

    @PrimaryColumn({ name: 'owner_login' })
    public ownerLogin!: string;

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

    @Column({ name: 'network', transformer: numberToBigIntTransformer, nullable: true })
    public network?: number;

    @Column({ name: 'subscribers', transformer: numberToBigIntTransformer, nullable: true })
    public subscribers?: number;

    @Column({ name: 'default_branch' })
    public defaultBranch!: string;

    @Column({ name: 'status', nullable: true })
    public status?: string;

    @Column({ name: 'ahead_by', transformer: numberToBigIntTransformer, nullable: true })
    public aheadBy?: number;

    @Column({ name: 'behind_by', transformer: numberToBigIntTransformer, nullable: true })
    public behindBy?: number;

    @Column({ name: 'total_commits', transformer: numberToBigIntTransformer, nullable: true })
    public totalCommits?: number;
}
