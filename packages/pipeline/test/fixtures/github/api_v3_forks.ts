import { GithubFork } from '../../../src/entities';

// To re-create the JSON files from the API (e.g. if the API output schema changes), run the below commands:

// (1) Forks:
// curl https://api.github.com/repos/0xProject/0x-monorepo/forks?per_page=1&page=1
// docs here: https://developer.github.com/v3/repos/forks/#list-forks

// (2) Comparisons:
// curl https://api.github.com/repos/0xProject/0x-monorepo/compare/development...NoahZinsmeister:development
//   --> (replace the last part with the fork owner + branch that you get from the Fork API response)
// docs here: https://developer.github.com/v3/repos/commits/#compare-two-commits

const ParsedGithubFork = new GithubFork();
ParsedGithubFork.observedTimestamp = Date.now();
ParsedGithubFork.fullName = 'NoahZinsmeister/0x-monorepo';
ParsedGithubFork.ownerLogin = 'NoahZinsmeister';
ParsedGithubFork.createdAt = 1552181010000; // tslint:disable-line:custom-no-magic-numbers
ParsedGithubFork.updatedAt = 1552191123000; // tslint:disable-line:custom-no-magic-numbers
ParsedGithubFork.pushedAt = 1552191120000; // tslint:disable-line:custom-no-magic-numbers
ParsedGithubFork.size = 86271; // tslint:disable-line:custom-no-magic-numbers
ParsedGithubFork.stargazers = 0;
ParsedGithubFork.watchers = 0;
ParsedGithubFork.forks = 0;
ParsedGithubFork.openIssues = 0;
ParsedGithubFork.network = undefined;
ParsedGithubFork.subscribers = undefined;
ParsedGithubFork.defaultBranch = 'development';

const EnrichedGithubFork = { ...ParsedGithubFork }; // clone the above
EnrichedGithubFork.status = 'ahead';
EnrichedGithubFork.aheadBy = 1;
EnrichedGithubFork.behindBy = 0;
EnrichedGithubFork.totalCommits = 1;

export { ParsedGithubFork, EnrichedGithubFork };
