import { GithubPullRequest } from '../../../src/entities';

// To re-create the JSON file from the API (e.g. if the API output schema changes), run the below command:
// curl https://api.github.com/repos/0xProject/0x-monorepo/pulls?per_page=1&page=1
// docs here: https://developer.github.com/v3/pulls/#list-pull-requests

const ParsedGithubPulls: GithubPullRequest = {
        observedTimestamp: Date.now(),
        repoName: '0x-monorepo',
        pullRequestNumber: 1684,
        state: 'open',
        title: '[WIP] Pull Github data',
        userLogin: 'askeluv',
        createdAt: 1552019788000,
        updatedAt: 1552019788000,
        closedAt: null,
        mergedAt: null,
      };
export { ParsedGithubPulls };
