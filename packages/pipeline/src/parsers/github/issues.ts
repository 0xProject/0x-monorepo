import { GithubIssueResponse } from '../../data_sources/github';
import { GithubIssue } from '../../entities';

/**
 * Converts a Github response from the API into an array GithubIssue entity.
 * @param response A Github response from the API.
 * @param observedTimestamp The timestamp to record for the observation of the entities.
 */
export function parseGithubIssues(
    response: GithubIssueResponse[],
    observedTimestamp: number,
    repoFullName: string,
): GithubIssue[] {
    const emptyResponse: GithubIssue[] = [];
    return response && response[0]
        ? response.map(issue => {
              const parsedIssue = new GithubIssue();
              parsedIssue.observedTimestamp = observedTimestamp;
              parsedIssue.repoFullName = repoFullName;
              parsedIssue.issueNumber = issue.number;
              parsedIssue.title = issue.title;
              parsedIssue.state = issue.state;
              parsedIssue.locked = issue.locked;
              parsedIssue.assigneeLogin = issue.assignee ? issue.assignee.login : undefined;
              parsedIssue.userLogin = issue.user.login;
              parsedIssue.userType = issue.user.type;
              parsedIssue.userSiteAdmin = issue.user.site_admin;
              parsedIssue.comments = issue.comments;
              parsedIssue.createdAt = Date.parse(issue.created_at);
              parsedIssue.updatedAt = Date.parse(issue.updated_at);
              parsedIssue.closedAt = issue.closed_at ? Date.parse(issue.closed_at) : undefined;
              return parsedIssue;
          })
        : emptyResponse;
}
