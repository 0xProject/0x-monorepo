import { Connection, ConnectionOptions, createConnection } from 'typeorm';

import { GithubSource } from '../data_sources/github';
import { GithubRepo } from '../entities';
import * as ormConfig from '../ormconfig';
import { parseGithubRepo } from '../parsers/github';
import { handleError } from '../utils';

const GITHUB_OWNER = '0xProject';
const GITHUB_REPO = '0x-monorepo';

let connection: Connection;

(async () => {
    connection = await createConnection(ormConfig as ConnectionOptions);
    const GithubRepoRepository = connection.getRepository(GithubRepo);
    const githubSource = new GithubSource(GITHUB_OWNER, GITHUB_REPO);

    // get repo and save
    const rawRepo = await githubSource.getGithubRepoAsync();
    const observedTimestamp = Date.now();
    const record = parseGithubRepo(rawRepo, observedTimestamp);
    await GithubRepoRepository.save(record);

    // TODO: get pull requests and save

    process.exit(0);
})().catch(handleError);
