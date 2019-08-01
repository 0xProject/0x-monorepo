import {
    blockchainTests,
    describe,
    testCombinatoriallyWithReferenceFunc,
    uint256Values,
} from '@0x/contracts-test-utils';
import { FillResults } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { artifacts, ReferenceFunctions, TestLibsContract } from '../src';

blockchainTests('LibFillResults', env => {
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

    describe('addFillResults', () => {
        function makeFillResults(value: BigNumber): FillResults {
            // We reuse values across fields, but this is fine because
            // `addFillResults()` never does any math between them.
            return {
                makerAssetFilledAmount: value,
                takerAssetFilledAmount: value,
                makerFeePaid: value,
                takerFeePaid: value,
            };
        }

        async function referenceAddFillResultsAsync(
            totalValue: BigNumber,
            singleValue: BigNumber,
        ): Promise<FillResults> {
            return ReferenceFunctions.addFillResults(
                makeFillResults(totalValue),
                makeFillResults(singleValue),
            );
        }

        async function testAddFillResultsAsync(
            totalValue: BigNumber,
            singleValue: BigNumber,
        ): Promise<FillResults> {
            return libsContract.addFillResults.callAsync(
                makeFillResults(totalValue),
                makeFillResults(singleValue),
            );
        }

        describe.optional('combinatorial tests', () => {
            testCombinatoriallyWithReferenceFunc(
                'addFillResults',
                referenceAddFillResultsAsync,
                testAddFillResultsAsync,
                [uint256Values, uint256Values],
            );
        });
    });
});
