import {
    blockchainTests,
    describe,
    testCombinatoriallyWithReferenceFunc,
    uint256Values,
} from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

import { artifacts, ReferenceFunctions, TestLibsContract } from '../src';

blockchainTests('LibMath', env => {
    const CHAIN_ID = 1337;
    let libsContract: TestLibsContract;

    before(async () => {
        libsContract = await TestLibsContract.deployFrom0xArtifactAsync(
            artifacts.TestLibs,
            env.provider,
            env.txDefaults,
            new BigNumber(CHAIN_ID),
        );
    });

    // Wrap a reference function with identical arguments in a promise.
    function createAsyncReferenceFunction<T>(
        ref: (...args: any[]) => T,
    ): (...args: any[]) => Promise<T> {
        return async (...args: any[]): Promise<T> => {
            return ref(...args);
        };
    }

    function createContractTestFunction<T>(
        name: string,
    ): (...args: any[]) => Promise<T> {
        return async (...args: any[]): Promise<T> => {
            const method = (libsContract as any)[name] as { callAsync: (...args: any[]) => Promise<T> };
            return method.callAsync(...args);
        };
    }

    describe('getPartialAmountFloor', () => {
        describe.optional('combinatorial tests', () => {
            testCombinatoriallyWithReferenceFunc(
                'getPartialAmountFloor',
                createAsyncReferenceFunction(ReferenceFunctions.getPartialAmountFloor),
                createContractTestFunction('getPartialAmountFloor'),
                [uint256Values, uint256Values, uint256Values],
            );
        });
    });

    describe('getPartialAmountCeil', () => {
        describe.optional('combinatorial tests', () => {
            testCombinatoriallyWithReferenceFunc(
                'getPartialAmountCeil',
                createAsyncReferenceFunction(ReferenceFunctions.getPartialAmountCeil),
                createContractTestFunction('getPartialAmountCeil'),
                [uint256Values, uint256Values, uint256Values],
            );
        });
    });

    describe('safeGetPartialAmountFloor', () => {
        describe.optional('combinatorial tests', () => {
            testCombinatoriallyWithReferenceFunc(
                'safeGetPartialAmountFloor',
                createAsyncReferenceFunction(ReferenceFunctions.safeGetPartialAmountFloor),
                createContractTestFunction('safeGetPartialAmountFloor'),
                [uint256Values, uint256Values, uint256Values],
            );
        });
    });

    describe('safeGetPartialAmountCeil', () => {
        describe.optional('combinatorial tests', () => {
            testCombinatoriallyWithReferenceFunc(
                'safeGetPartialAmountCeil',
                createAsyncReferenceFunction(ReferenceFunctions.safeGetPartialAmountCeil),
                createContractTestFunction('safeGetPartialAmountCeil'),
                [uint256Values, uint256Values, uint256Values],
            );
        });
    });

    describe('isRoundingErrorFloor', () => {
        describe.optional('combinatorial tests', () => {
            testCombinatoriallyWithReferenceFunc(
                'isRoundingErrorFloor',
                createAsyncReferenceFunction(ReferenceFunctions.isRoundingErrorFloor),
                createContractTestFunction('isRoundingErrorFloor'),
                [uint256Values, uint256Values, uint256Values],
            );
        });
    });

    describe('isRoundingErrorCeil', () => {
        describe.optional('combinatorial tests', () => {
            testCombinatoriallyWithReferenceFunc(
                'isRoundingErrorCeil',
                createAsyncReferenceFunction(ReferenceFunctions.isRoundingErrorCeil),
                createContractTestFunction('isRoundingErrorCeil'),
                [uint256Values, uint256Values, uint256Values],
            );
        });
    });
});
