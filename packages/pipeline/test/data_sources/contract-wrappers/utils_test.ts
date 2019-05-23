// tslint:disable:custom-no-magic-numbers
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import 'mocha';

import { _getEventsWithRetriesAsync } from '../../../src/data_sources/contract-wrappers/utils';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

const retryableMessage = 'network timeout: (simulated network timeout error)';
const retryableError = new Error(retryableMessage);

describe('data_sources/contract-wrappers/utils', () => {
    describe('_getEventsWithRetriesAsync', () => {
        it('sends a single request if it was successful', async () => {
            // Pre-declare values for the fromBlock and toBlock arguments.
            const expectedFromBlock = 100;
            const expectedToBlock = 200;
            const expectedLogs: Array<LogWithDecodedArgs<any>> = [
                {
                    logIndex: 123,
                    transactionIndex: 456,
                    transactionHash: '0x6dd106d002873746072fc5e496dd0fb2541b68c77bcf9184ae19a42fd33657fe',
                    blockHash: '0x6dd106d002873746072fc5e496dd0fb2541b68c77bcf9184ae19a42fd33657ff',
                    blockNumber: 789,
                    address: '0x6dd106d002873746072fc5e496dd0fb2541b68c77bcf9184ae19a42fd3365800',
                    data: 'fake raw data',
                    topics: [],
                    event: 'TEST_EVENT',
                    args: [1, 2, 3],
                },
            ];

            // mockGetEventsAsync checks its arguments, increments `callCount`
            // and returns `expectedLogs`.
            let callCount = 0;
            const mockGetEventsAsync = async (
                fromBlock: number,
                toBlock: number,
            ): Promise<Array<LogWithDecodedArgs<any>>> => {
                expect(fromBlock).equals(expectedFromBlock);
                expect(toBlock).equals(expectedToBlock);
                callCount += 1;
                return expectedLogs;
            };

            // Make sure that we get what we expected and that the mock function
            // was called exactly once.
            const gotLogs = await _getEventsWithRetriesAsync(mockGetEventsAsync, 3, expectedFromBlock, expectedToBlock);
            expect(gotLogs).deep.equals(expectedLogs);
            expect(callCount).equals(
                1,
                'getEventsAsync function was called more than once even though it was successful',
            );
        });
        it('retries and eventually succeeds', async () => {
            const numRetries = 5;
            let callCount = 0;
            // mockGetEventsAsync throws unless callCount == numRetries + 1.
            const mockGetEventsAsync = async (
                _fromBlock: number,
                _toBlock: number,
            ): Promise<Array<LogWithDecodedArgs<any>>> => {
                callCount += 1;
                if (callCount === numRetries + 1) {
                    return [];
                }
                throw retryableError;
            };
            await _getEventsWithRetriesAsync(mockGetEventsAsync, numRetries, 100, 300);
            expect(callCount).equals(numRetries + 1, 'getEventsAsync function was called the wrong number of times');
        });
        it('throws for non-retryable errors', async () => {
            const numRetries = 5;
            const expectedMessage = 'Non-retryable error';
            // mockGetEventsAsync always throws a non-retryable error.
            const mockGetEventsAsync = async (
                _fromBlock: number,
                _toBlock: number,
            ): Promise<Array<LogWithDecodedArgs<any>>> => {
                throw new Error(expectedMessage);
            };
            // Note(albrow): This does actually return a promise (or at least a
            // "promise-like object" and is a false positive in TSLint.
            // tslint:disable-next-line:await-promise
            await expect(_getEventsWithRetriesAsync(mockGetEventsAsync, numRetries, 100, 300)).to.be.rejectedWith(
                expectedMessage,
            );
        });
        it('throws after too many retries', async () => {
            const numRetries = 5;
            // mockGetEventsAsync always throws a retryable error.
            const mockGetEventsAsync = async (
                _fromBlock: number,
                _toBlock: number,
            ): Promise<Array<LogWithDecodedArgs<any>>> => {
                throw retryableError;
            };
            // Note(albrow): This does actually return a promise (or at least a
            // "promise-like object" and is a false positive in TSLint.
            // tslint:disable-next-line:await-promise
            await expect(_getEventsWithRetriesAsync(mockGetEventsAsync, numRetries, 100, 300)).to.be.rejectedWith(
                retryableMessage,
            );
        });
    });
});
