import { fetchAsync, logUtils } from '@0x/utils';
import Bottleneck from 'bottleneck';

const ONE_SECOND = 1000;

export interface GithubRepoResponse {
    full_name: string;
    created_at: string;
    updated_at: string;
    pushed_at: string;
    size: number;
    stargazers_count: number;
    watchers_count: number;
    forks: number;
    open_issues: number;
    network_count: number;
    subscribers_count: number;
}

export interface GithubPullRequestResponse {
    number: number;
    title: string;
    state: string;
    created_at: string;
    updated_at: string;
    closed_at: string;
    merged_at: string;
    user: {
        login: string;
    };
    base: {
        repo: {
            full_name: string;
        };
    };
}

export interface GithubForkResponse extends GithubRepoResponse {
    owner: {
        login: string;
    };
    default_branch: string;
}

export interface GithubComparisonResponse {
    status: string;
    ahead_by: number;
    behind_by: number;
    total_commits: number;
}

export interface GithubIssueResponse {
    number: number;
    title: string;
    state: string;
    locked: boolean;
    assignee?: {
        login?: string;
    };
    created_at: string;
    updated_at: string;
    closed_at: string;
    user: {
        login: string;
        type: string;
        site_admin: boolean;
    };
    comments: number;
}

// tslint:disable:prefer-function-over-method
// ^ Keep consistency with other sources and help logical organization
export class GithubSource {
    // rate-limit for all API calls through this class instance
    private readonly _limiter: Bottleneck;
    private readonly _urlBase: string = 'https://api.github.com';
    private readonly _owner: string;
    private readonly _repo: string;
    private readonly _branch: string;
    private readonly _accessToken: string;

    constructor(owner: string, repo: string, branch: string, accessToken: string, maxReqsPerSecond: number) {
        this._owner = owner;
        this._repo = repo;
        this._branch = branch;
        this._accessToken = accessToken;
        this._limiter = new Bottleneck({
            minTime: ONE_SECOND / maxReqsPerSecond,
        });
    }

    /**
     * Call Github API for repo and return result.
     */
    public async getGithubRepoAsync(): Promise<GithubRepoResponse> {
        const url = `${this._urlBase}/repos/${this._owner}/${this._repo}?access_token=${this._accessToken}`;
        const resp = await this._limiter.schedule(() => fetchAsync(url));
        const respJson: GithubRepoResponse = await resp.json();
        return respJson;
    }

    /**
     * Call Github API for pull requests and return result - paginated.
     */
    public async getGithubPullsAsync(page: number): Promise<GithubPullRequestResponse[]> {
        const url = `${this._urlBase}/repos/${this._owner}/${this._repo}/pulls?access_token=${
            this._accessToken
        }&state=all&per_page=100&page=${page}`;
        const resp = await this._limiter.schedule(() => fetchAsync(url));
        const respJson: GithubPullRequestResponse[] = await resp.json();
        return respJson;
    }

    /**
     * Call Github API for forks of repo and return result - paginated.
     */
    public async getGithubForksAsync(page: number): Promise<GithubForkResponse[]> {
        const url = `${this._urlBase}/repos/${this._owner}/${this._repo}/forks?access_token=${
            this._accessToken
        }&per_page=100&page=${page}`;
        const resp = await this._limiter.schedule(() => fetchAsync(url));
        const respJson: GithubForkResponse[] = await resp.json();
        return respJson;
    }

    /**
     * Call Github API to get commit status of a fork vs repo's main branch.
     */
    public async getGithubComparisonAsync(forkOwner: string, forkBranch: string): Promise<GithubComparisonResponse> {
        const url = `${this._urlBase}/repos/${this._owner}/${this._repo}/compare/${
            this._branch
        }...${forkOwner}:${forkBranch}?access_token=${this._accessToken}`;
        const resp = await this._limiter.schedule(() => fetchAsync(url));
        const respJson: GithubComparisonResponse = await resp.json();
        return respJson;
    }

    /**
     * Call Github API for pull requests and return result - paginated.
     */
    public async getGithubIssuesAsync(page: number): Promise<GithubIssueResponse[]> {
        const url = `${this._urlBase}/repos/${this._owner}/${this._repo}/issues?access_token=${
            this._accessToken
        }&state=all&per_page=100&page=${page}`;
        const resp = await this._limiter.schedule(() => fetchAsync(url));
        const respJson: GithubIssueResponse[] = await resp.json();
        if (!respJson[0]) {
            logUtils.log(respJson);
        }
        return respJson;
    }
}
