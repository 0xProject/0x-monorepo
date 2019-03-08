import { GithubRepo } from '../../../src/entities';

// To re-create the JSON file from the API (e.g. if the API output schema changes), run the below command:
// curl https://api.github.com/repos/0xProject/0x-monorepo
// docs here: https://developer.github.com/v3/repos/#get

const ParsedGithubRepo: GithubRepo = {
        observedTimestamp: Date.now(),
        name: '0x-monorepo',
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
export { ParsedGithubRepo };
