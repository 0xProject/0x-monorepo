import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as dirtyChai from 'dirty-chai';
import * as _ from 'lodash';
import 'mocha';
import {
    NewmanRunExecution,
    NewmanRunExecutionAssertion,
    NewmanRunExecutionAssertionError,
    NewmanRunSummary,
} from 'newman';
import * as nock from 'nock';

import * as sraReportCollectionJSON from '../../postman_collections/sra_report.postman_collection.json';
import { utils } from '../src/utils';

import * as postmanEnvironmentJSON from './environments/postman_environment.json';

chai.config.includeStack = true;
chai.use(dirtyChai);
chai.use(chaiAsPromised);
const expect = chai.expect;

const CONTENT_TYPE_ASSERTION_NAME = 'Has Content-Type header with value application/json';
const SCHEMA_ASSERTION_NAME = 'Schema is valid';
const baseNewmanRunOptions = {
    collection: sraReportCollectionJSON,
    environment: postmanEnvironmentJSON,
    reporter: {
        cli: {
            noConsole: true,
        },
    },
};

export const testRunner = {
    runContentTypeTests(
        nockInterceptor: nock.Interceptor,
        postmanCollectionFolderName: string,
        postmanCollectionRequestName: string,
    ): void {
        const newmanRunOptions = {
            ...baseNewmanRunOptions,
            folder: postmanCollectionFolderName,
        };
        describe(CONTENT_TYPE_ASSERTION_NAME, () => {
            it('fails when there are no headers', async () => {
                nockInterceptor.reply(200, {});
                const summary = await utils.newmanRunAsync(newmanRunOptions);
                const error = findAssertionErrorIfExists(
                    summary,
                    postmanCollectionRequestName,
                    CONTENT_TYPE_ASSERTION_NAME,
                );
                const errorMessage = _.get(error, 'message');
                expect(error).to.not.be.undefined();
                expect(errorMessage).to.equal(`expected response to have header with key 'Content-Type'`);
            });
            it('fails when Content-Type header exists but not with value application/json', async () => {
                const headers = {
                    'Content-Type': 'text/html',
                };
                nockInterceptor.reply(200, {}, headers);
                const summary = await utils.newmanRunAsync(newmanRunOptions);
                const error = findAssertionErrorIfExists(
                    summary,
                    postmanCollectionRequestName,
                    CONTENT_TYPE_ASSERTION_NAME,
                );
                const errorMessage = _.get(error, 'message');
                expect(error).to.not.be.undefined();
                expect(errorMessage).to.equal(`expected 'text/html' to include 'application/json'`);
            });
            it('passes when Content-Type header exists with value application/json', async () => {
                const headers = {
                    'Content-Type': 'charset=utf-8; application/json',
                };
                nockInterceptor.reply(200, {}, headers);
                const summary = await utils.newmanRunAsync(newmanRunOptions);
                const error = findAssertionErrorIfExists(
                    summary,
                    postmanCollectionRequestName,
                    CONTENT_TYPE_ASSERTION_NAME,
                );
                expect(error).to.be.undefined();
            });
        });
    },
    runSchemaTests(
        nockInterceptor: nock.Interceptor,
        postmanCollectionFolderName: string,
        postmanCollectionRequestName: string,
        malformedJson: object,
        correctJson: object,
    ): void {
        const newmanRunOptions = {
            ...baseNewmanRunOptions,
            folder: postmanCollectionFolderName,
        };
        describe(SCHEMA_ASSERTION_NAME, () => {
            it('fails when schema is invalid', async () => {
                nockInterceptor.reply(200, malformedJson);
                const summary = await utils.newmanRunAsync(newmanRunOptions);
                const error = findAssertionErrorIfExists(summary, postmanCollectionRequestName, SCHEMA_ASSERTION_NAME);
                const errorMessage = _.get(error, 'message');
                expect(error).to.not.be.undefined();
                expect(errorMessage).to.equal('expected false to be true');
            });
            it('passes when schema is valid', async () => {
                nockInterceptor.reply(200, correctJson);
                const summary = await utils.newmanRunAsync(newmanRunOptions);
                const error = findAssertionErrorIfExists(summary, postmanCollectionRequestName, SCHEMA_ASSERTION_NAME);
                const errorMessage = _.get(error, 'message');
                expect(error).to.be.undefined();
            });
        });
    },
};

function findAssertionErrorIfExists(
    summary: NewmanRunSummary,
    postmanCollectionRequestName: string,
    postmanCollectionAssertionName: string,
): NewmanRunExecutionAssertionError | undefined {
    const matchingExecutionIfExists = _.find(summary.run.executions, (execution: NewmanRunExecution) => {
        return execution.item.name === postmanCollectionRequestName;
    });
    if (_.isUndefined(matchingExecutionIfExists)) {
        return undefined;
    }
    const matchingAssertionIfExists = _.find(
        matchingExecutionIfExists.assertions,
        (assertion: NewmanRunExecutionAssertion) => {
            return assertion.assertion === postmanCollectionAssertionName;
        },
    );
    if (_.isUndefined(matchingAssertionIfExists)) {
        return undefined;
    } else {
        const error = matchingAssertionIfExists.error;
        return error;
    }
}
