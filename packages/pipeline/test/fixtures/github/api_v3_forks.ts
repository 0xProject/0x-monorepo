import { GithubFork } from '../../../src/entities';

// To re-create the JSON file from the API (e.g. if the API output schema changes), run the below command:
// curl https://api.github.com/repos/0xProject/0x-monorepo/forks?per_page=1&page=1
// docs here: https://developer.github.com/v3/repos/forks/#list-forks

const ParsedGithubFork = new GithubFork();
ParsedGithubFork.observedTimestamp = Date.now();
ParsedGithubFork.name = '0x-monorepo';
ParsedGithubFork.ownerLogin = 'AlphaSquadAlgorithms';
ParsedGithubFork.createdAt = 1551979928000; // tslint:disable-line:custom-no-magic-numbers
ParsedGithubFork.updatedAt = 1551979936000; // tslint:disable-line:custom-no-magic-numbers
ParsedGithubFork.pushedAt = 1551979727000; // tslint:disable-line:custom-no-magic-numbers
ParsedGithubFork.size = 86560; // tslint:disable-line:custom-no-magic-numbers
ParsedGithubFork.stargazers = 0;
ParsedGithubFork.watchers = 0;
ParsedGithubFork.forks = 0;
ParsedGithubFork.openIssues = 0;
ParsedGithubFork.network = undefined;
ParsedGithubFork.subscribers = undefined;

export { ParsedGithubFork };
