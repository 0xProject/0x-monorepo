import { Column, Entity, PrimaryColumn } from 'typeorm';

import { numberToBigIntTransformer } from '../utils';

@Entity({ name: 'github_issue', schema: 'raw' })
export class GithubIssue {
    @PrimaryColumn({ name: 'observed_timestamp', type: 'bigint', transformer: numberToBigIntTransformer })
    public observedTimestamp!: number;

    @PrimaryColumn({ name: 'repo_full_name' })
    public repoFullName!: string;

    @PrimaryColumn({ name: 'issue_number', transformer: numberToBigIntTransformer })
    public issueNumber!: number;

    @Column({ name: 'title' })
    public title!: string;

    @Column({ name: 'state' })
    public state!: string;

    @Column({ name: 'locked', type: 'boolean' })
    public locked!: boolean;

    @Column({ name: 'assignee_login', type: 'varchar', nullable: true })
    public assigneeLogin?: string;

    @Column({ name: 'user_login' })
    public userLogin!: string;

    @Column({ name: 'user_type' })
    public userType!: string;

    @Column({ name: 'user_site_admin', type: 'boolean' })
    public userSiteAdmin!: boolean;

    @Column({ name: 'comments', transformer: numberToBigIntTransformer })
    public comments!: number;

    @Column({ name: 'created_at', type: 'bigint', transformer: numberToBigIntTransformer })
    public createdAt!: number;

    @Column({ name: 'updated_at', type: 'bigint', transformer: numberToBigIntTransformer })
    public updatedAt!: number;

    @Column({ name: 'closed_at', type: 'bigint', transformer: numberToBigIntTransformer, nullable: true })
    public closedAt?: number;
}
