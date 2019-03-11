import { GithubComparisonResponse, GithubForkResponse } from '../../data_sources/github';
import { GithubFork } from '../../entities';

/**
 * Converts a Github response from the API into a GithubFork entity.
 * @param response A Github response from the API.
 */
export function parseGithubForks(response: GithubForkResponse[], observedTimestamp: number): GithubFork[] {
    const result: GithubFork[] = response.map(fork => {
        const parsedFork = new GithubFork();
        parsedFork.observedTimestamp = observedTimestamp;
        parsedFork.name = fork.name;
        parsedFork.ownerLogin = fork.owner.login;
        parsedFork.createdAt = Date.parse(fork.created_at);
        parsedFork.updatedAt = Date.parse(fork.updated_at);
        parsedFork.pushedAt = Date.parse(fork.pushed_at);
        parsedFork.size = fork.size;
        parsedFork.stargazers = fork.stargazers_count;
        parsedFork.watchers = fork.watchers_count;
        parsedFork.forks = fork.forks;
        parsedFork.openIssues = fork.open_issues;
        parsedFork.network = fork.network_count;
        parsedFork.subscribers = fork.subscribers_count;
        parsedFork.defaultBranch = fork.default_branch;
        return parsedFork;
    });
    return result;
}

/**
 * Extends a GithubFork object with additional comparison fields.
 */
export function enrichGithubForkWithComparisonDetails(
    githubFork: GithubFork,
    comparisonResponse: GithubComparisonResponse,
): GithubFork {
    const enrichedGithubFork = { ...githubFork }; // clone object
    enrichedGithubFork.status = comparisonResponse.status;
    enrichedGithubFork.aheadBy = comparisonResponse.ahead_by;
    enrichedGithubFork.behindBy = comparisonResponse.behind_by;
    enrichedGithubFork.totalCommits = comparisonResponse.total_commits;
    return enrichedGithubFork;
}
