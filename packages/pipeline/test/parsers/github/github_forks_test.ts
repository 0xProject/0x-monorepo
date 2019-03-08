import * as chai from 'chai';
import 'mocha';

import { GithubForkResponse } from '../../../src/data_sources/github';
import { parseGithubForks } from '../../../src/parsers/github';

import { ParsedGithubFork } from '../../fixtures/github/api_v3_forks';
import * as githubForksResponse from '../../fixtures/github/api_v3_forks.json';

import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
describe('github_forks', () => {
    describe('parseGithubForks', () => {
        it('converts GithubForksResponse to GithubFork entities', () => {
            const response: GithubForkResponse[] = githubForksResponse;
            const expected = ParsedGithubFork;
            const observedTimestamp = expected.observedTimestamp;
            const actualList = parseGithubForks(response, observedTimestamp);
            const actual = actualList[0];
            expect(actual).deep.equal(expected);
        });
    });
});
