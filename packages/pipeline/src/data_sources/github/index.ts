import { fetchAsync } from '@0x/utils';

export interface GithubRepoResponse {
    name: string;
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
            name: string;
        };
    };
}

// tslint:disable:prefer-function-over-method
// ^ Keep consistency with other sources and help logical organization
export class GithubSource {
    public readonly _repoUrl: string;
    public readonly _pullsUrl: string;

    constructor(owner: string, repo: string) {
        const urlBase = 'https://api.github.com';
        this._repoUrl = `${urlBase}/repos/${owner}/${repo}`;
        this._pullsUrl = `${urlBase}/repos/${owner}/${repo}/pulls?state=all&per_page=100&page=`;
    }

    /**
     * Call Github API for repo and return result.
     */
    public async getGithubRepoAsync(): Promise<GithubRepoResponse> {
        const resp = await fetchAsync(this._repoUrl);
        const respJson: GithubRepoResponse = await resp.json();
        return respJson;
    }

    /**
     * Call Github API for pull requests and return result.
     */
    public async getGithubPullsAsync(page: number): Promise<GithubPullRequestResponse[]> {
        const resp = await fetchAsync(`${this._pullsUrl}${page}`);
        const respJson: GithubPullRequestResponse[] = await resp.json();
        return respJson;
    }
}
