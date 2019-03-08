import { Column, Entity, PrimaryColumn } from 'typeorm';

import { numberToBigIntTransformer } from '../utils';

@Entity({ name: 'github_pull_request', schema: 'raw' })
export class GithubPullRequest {
    @PrimaryColumn({ name: 'observed_timestamp', type: 'bigint', transformer: numberToBigIntTransformer })
    public observedTimestamp!: number;

    @PrimaryColumn({ name: 'repo_name' })
    public repoName!: string;

    @PrimaryColumn({ name: 'pull_request_number', transformer: numberToBigIntTransformer })
    public pullRequestNumber!: number;

    @Column({ name: 'created_at', type: 'bigint', transformer: numberToBigIntTransformer })
    public createdAt!: number;

    @Column({ name: 'updated_at', type: 'bigint', transformer: numberToBigIntTransformer })
    public updatedAt!: number;

    @Column({ name: 'closed_at', type: 'bigint', transformer: numberToBigIntTransformer })
    public closedAt?: number | null;

    @Column({ name: 'merged_at', type: 'bigint', transformer: numberToBigIntTransformer })
    public mergedAt?: number | null;

    @Column({ name: 'state' })
    public state!: string;

    @Column({ name: 'title' })
    public title!: string;

    @Column({ name: 'user_login' })
    public userLogin!: string;
}
