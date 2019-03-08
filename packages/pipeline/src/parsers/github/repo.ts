import { GithubRepoResponse } from '../../data_sources/github';
import { GithubRepo } from '../../entities';

/**
 * Converts a Github response from the API into an GithubRepo entity.
 * @param rawRepo A Github response from the API into an GithubRepo entity.
 */
export function parseGithubRepo(rawRepo: GithubRepoResponse, observedTimestamp: number): GithubRepo {
    const parsedRepo = new GithubRepo();
    parsedRepo.observedTimestamp = observedTimestamp;
    parsedRepo.name = rawRepo.name;
    parsedRepo.createdAt = Date.parse(rawRepo.created_at);
    parsedRepo.updatedAt = Date.parse(rawRepo.updated_at);
    parsedRepo.pushedAt = Date.parse(rawRepo.pushed_at);
    parsedRepo.size = rawRepo.size;
    parsedRepo.stargazers = rawRepo.stargazers_count;
    parsedRepo.watchers = rawRepo.watchers_count;
    parsedRepo.forks = rawRepo.forks;
    parsedRepo.openIssues = rawRepo.open_issues;
    parsedRepo.network = rawRepo.network_count;
    parsedRepo.subscribers = rawRepo.subscribers_count;
    return parsedRepo;
}
