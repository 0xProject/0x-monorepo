import { Connection, ConnectionOptions, createConnection } from 'typeorm';

import { logUtils } from '@0x/utils';

import { GithubSource } from '../data_sources/github';
import { GithubFork, GithubPullRequest, GithubRepo } from '../entities';
import * as ormConfig from '../ormconfig';
import {
    enrichGithubForkWithComparisonDetails,
    parseGithubForks,
    parseGithubPulls,
    parseGithubRepo,
} from '../parsers/github';
import { handleError } from '../utils';

const GITHUB_OWNER = '0xProject';
const GITHUB_REPO = '0x-monorepo';
const GITHUB_BRANCH = 'development';
const RECORDS_PER_PAGE = 100;

let connection: Connection;

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    const accessToken = process.env.GITHUB_ACCESS_TOKEN;
    if (accessToken === undefined) {
        throw new Error('Missing required env var: GITHUB_ACCESS_TOKEN');
    }
    const githubSource = new GithubSource(GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, accessToken);
    const observedTimestamp = Date.now();

    // get repo and save
    const GithubRepoRepository = connection.getRepository(GithubRepo);
    logUtils.log('Fetching Github repo from API.');
    const rawRepo = await githubSource.getGithubRepoAsync();
    const repo = parseGithubRepo(rawRepo, observedTimestamp);
    logUtils.log('Saving Github repo to database.');
    await GithubRepoRepository.save(repo);

    // get pull requests and save
    const GithubPullRequestRepository = connection.getRepository(GithubPullRequest);
    let numberOfRecords = RECORDS_PER_PAGE;
    let page = 1;
    while (numberOfRecords === RECORDS_PER_PAGE) {
        logUtils.log(`Fetching Github pull requests from API, page: ${page}.`);
        const rawPulls = await githubSource.getGithubPullsAsync(page);
        const pulls = parseGithubPulls(rawPulls, observedTimestamp);
        numberOfRecords = pulls.length;
        page++;
        logUtils.log(`Saving ${pulls.length} pull requests to database.`);
        await GithubPullRequestRepository.save(pulls);
    }

    // get forks and save
    const GithubForkRepository = connection.getRepository(GithubFork);
    numberOfRecords = RECORDS_PER_PAGE;
    page = 1;
    while (numberOfRecords === RECORDS_PER_PAGE) {
        logUtils.log(`Fetching Github forks from API, page: ${page}.`);
        const rawForks = await githubSource.getGithubForksAsync(page);
        const forks = parseGithubForks(rawForks, observedTimestamp);
        logUtils.log('Fetching compare stats for each fork from API.');
        const enrichedForks = await Promise.all(
            forks.map(async fork => {
                const comparison = await githubSource.getGithubComparisonAsync(fork.ownerLogin, fork.defaultBranch);
                const enriched = enrichGithubForkWithComparisonDetails(fork, comparison);
                return enriched;
            }),
        );
        numberOfRecords = enrichedForks.length;
        page++;
        logUtils.log(`Saving ${enrichedForks.length} forks to database.`);
        await GithubForkRepository.save(enrichedForks);
    }

    process.exit(0);
})().catch(handleError);
