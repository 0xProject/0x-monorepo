import * as chai from 'chai';
import 'mocha';

import { GithubComparisonResponse, GithubForkResponse } from '../../../src/data_sources/github';
import { enrichGithubForkWithComparisonDetails, parseGithubForks } from '../../../src/parsers/github';

import * as githubComparisonResponse from '../../fixtures/github/api_v3_compare.json';
import { EnrichedGithubFork, ParsedGithubFork } from '../../fixtures/github/api_v3_forks';
import * as githubForksResponse from '../../fixtures/github/api_v3_forks.json';

import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
describe('github_forks', () => {
    describe('parseGithubForks', () => {
        it('converts GithubForksResponse to GithubFork entities', () => {
            const forksResponse: GithubForkResponse[] = githubForksResponse;
            const expected = ParsedGithubFork;
            const observedTimestamp = expected.observedTimestamp;
            const actualList = parseGithubForks(forksResponse, observedTimestamp);
            const actual = actualList[0];
            expect(actual).deep.equal(expected);
        });
    });

    describe('enrichGithubFork', () => {
        it('enriches GithubFork with comparison details', () => {
            const comparisonResponse: GithubComparisonResponse = githubComparisonResponse;
            const expected = EnrichedGithubFork;
            const actual = enrichGithubForkWithComparisonDetails(ParsedGithubFork, comparisonResponse);
            expect(actual).deep.equal(expected);
        });
    });
});
