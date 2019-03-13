import 'mocha';
import 'reflect-metadata';

import { GithubFork, GithubIssue, GithubPullRequest, GithubRepo } from '../../src/entities';
import { createDbConnectionOnceAsync } from '../db_setup';
import { chaiSetup } from '../utils/chai_setup';

import { testSaveAndFindEntityAsync } from './util';

chaiSetup.configure();

// tslint:disable:custom-no-magic-numbers
const fork: GithubFork = {
    observedTimestamp: Date.now(),
    fullName: 'NoahZinsmeister/0x-monorepo',
    ownerLogin: 'NoahZinsmeister',
    createdAt: 1552181010000,
    updatedAt: 1552191123000,
    pushedAt: 1552191120000,
    size: 86271,
    stargazers: 0,
    watchers: 0,
    forks: 0,
    openIssues: 0,
    network: undefined,
    subscribers: undefined,
    defaultBranch: 'development',
    status: 'ahead',
    aheadBy: 1,
    behindBy: 0,
    totalCommits: 1,
};

const issue: GithubIssue = {
    observedTimestamp: Date.now(),
    repoFullName: '0xProject/0x-monorepo',
    issueNumber: 1691,
    title: 'An in-range update of source-map-support is breaking the build',
    state: 'open',
    locked: false,
    assigneeLogin: undefined,
    userLogin: 'greenkeeper[bot]',
    userType: 'Bot',
    userSiteAdmin: false,
    comments: 1,
    createdAt: Date.parse('2019-03-12T17:30:58Z'),
    updatedAt: Date.parse('2019-03-12T17:32:26Z'),
    closedAt: undefined,
};

const pullRequest: GithubPullRequest = {
    observedTimestamp: Date.now(),
    repoFullName: '0xProject/0x-monorepo',
    pullRequestNumber: 1684,
    state: 'open',
    title: '[WIP] Pull Github data',
    userLogin: 'askeluv',
    createdAt: 1552019788000,
    updatedAt: 1552019788000,
    closedAt: null,
    mergedAt: null,
};

const repo: GithubRepo = {
    observedTimestamp: Date.now(),
    fullName: '0xProject/0x-monorepo',
    createdAt: 1495549053000,
    updatedAt: 1551908929000,
    pushedAt: 1551916745000,
    size: 86538,
    stargazers: 989,
    watchers: 989,
    forks: 294,
    openIssues: 46,
    network: 294,
    subscribers: 89,
};

describe('GithubFork entity', () => {
    it('save/find', async () => {
        const connection = await createDbConnectionOnceAsync();
        const forkRepository = connection.getRepository(GithubFork);
        await testSaveAndFindEntityAsync(forkRepository, fork);
    });
});

describe('GithubIssue entity', () => {
    it('save/find', async () => {
        const connection = await createDbConnectionOnceAsync();
        const issueRepository = connection.getRepository(GithubIssue);
        await testSaveAndFindEntityAsync(issueRepository, issue);
    });
});

describe('GithubPullRequest entity', () => {
    it('save/find', async () => {
        const connection = await createDbConnectionOnceAsync();
        const pullRequestRepository = connection.getRepository(GithubPullRequest);
        await testSaveAndFindEntityAsync(pullRequestRepository, pullRequest);
    });
});

describe('GithubRepo entity', () => {
    it('save/find', async () => {
        const connection = await createDbConnectionOnceAsync();
        const repoRepository = connection.getRepository(GithubRepo);
        await testSaveAndFindEntityAsync(repoRepository, repo);
    });
});
