import * as chai from 'chai';
import 'mocha';

import { GithubIssueResponse } from '../../../src/data_sources/github';
import { parseGithubIssues } from '../../../src/parsers/github';
import { chaiSetup } from '../../utils/chai_setup';

import { ParsedGithubIssue } from '../../fixtures/github/api_v3_issues';
import * as githubIssuesResponse from '../../fixtures/github/api_v3_issues.json';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
describe('github_issues', () => {
    describe('parseGithubIssues', () => {
        it('converts GithubIssuesResponse to GithubIssue entities', () => {
            const response: GithubIssueResponse[] = githubIssuesResponse;
            const expected = ParsedGithubIssue;
            const observedTimestamp = expected.observedTimestamp;
            const repoFullName = '0xProject/0x-monorepo';
            const actualList = parseGithubIssues(response, observedTimestamp, repoFullName);
            const actual = actualList[0];
            expect(actual).deep.equal(expected);
        });
    });
});
