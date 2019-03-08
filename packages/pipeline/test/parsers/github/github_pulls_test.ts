import * as chai from 'chai';
import 'mocha';

import { GithubPullRequestResponse } from '../../../src/data_sources/github';
import { parseGithubPulls } from '../../../src/parsers/github';
import { chaiSetup } from '../../utils/chai_setup';

import { ParsedGithubPullRequest } from '../../fixtures/github/api_v3_pulls';
import * as githubPullsResponse from '../../fixtures/github/api_v3_pulls.json';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
describe('github_pulls', () => {
    describe('parseGithubPulls', () => {
        it('converts GithubPullsResponse to GithubPullRequest entities', () => {
            const response: GithubPullRequestResponse[] = githubPullsResponse;
            const expected = ParsedGithubPullRequest;
            const observedTimestamp = expected.observedTimestamp;
            const actualList = parseGithubPulls(response, observedTimestamp);
            const actual = actualList[0];
            expect(actual).deep.equal(expected);
        });
    });
});
