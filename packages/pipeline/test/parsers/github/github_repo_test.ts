import * as chai from 'chai';
import 'mocha';

import { ParsedGithubRepo } from '../../fixtures/github/api_v3_repo';
import * as githubRepoResponse from '../../fixtures/github/api_v3_repo.json';

import { GithubRepoResponse } from '../../../src/data_sources/github';
import { parseGithubRepo } from '../../../src/parsers/github';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
describe('github_repo', () => {
    describe('parseGithubRepo', () => {
        it('converts GithubRepoResponse to GithubRepo entities', () => {
            const response: GithubRepoResponse = githubRepoResponse;
            const expected = ParsedGithubRepo;
            const observedTimestamp = expected.observedTimestamp;
            const actual = parseGithubRepo(response, observedTimestamp);
            expect(actual).deep.equal(expected);
        });
    });
});
