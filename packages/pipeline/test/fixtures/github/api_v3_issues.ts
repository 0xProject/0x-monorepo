import { GithubIssue } from '../../../src/entities';

// To re-create the JSON files from the API (e.g. if the API output schema changes), run the below command:
// curl "https://api.github.com/repos/0xProject/0x-monorepo/issues?state=all&per_page=1"
// docs here: https://developer.github.com/v3/issues/#list-issues-for-a-repository

const ParsedGithubIssue: GithubIssue = {
    observedTimestamp: Date.now(),
    repoFullName: '0xProject/0x-monorepo',
    issueNumber: 1691,
    title: 'An in-range update of source-map-support is breaking the build 🚨',
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

export { ParsedGithubIssue };
