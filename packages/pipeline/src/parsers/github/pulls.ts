import { GithubPullRequestResponse } from '../../data_sources/github';
import { GithubPullRequest } from '../../entities';

/**
 * Converts a Github response from the API into an GithubRepo entity.
 * @param rawRepo A Github response from the API into an GithubRepo entity.
 */
export function parseGithubPulls(
    response: GithubPullRequestResponse[],
    observedTimestamp: number,
): GithubPullRequest[] {
    return response.map(pull => {
        const parsedPullRequest = new GithubPullRequest();
        parsedPullRequest.observedTimestamp = observedTimestamp;
        parsedPullRequest.repoName = pull.base.repo.name;
        parsedPullRequest.createdAt = Date.parse(pull.created_at);
        parsedPullRequest.updatedAt = Date.parse(pull.updated_at);
        parsedPullRequest.closedAt = pull.closed_at ? Date.parse(pull.closed_at) : null;
        parsedPullRequest.mergedAt = pull.merged_at ? Date.parse(pull.merged_at) : null;
        parsedPullRequest.pullRequestNumber = pull.number;
        parsedPullRequest.state = pull.state;
        parsedPullRequest.title = pull.title;
        parsedPullRequest.userLogin = pull.user.login;
        return parsedPullRequest;
    });
}
