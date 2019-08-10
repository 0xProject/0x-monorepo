import { blockchainTests, constants, describe, expect } from '@0x/contracts-test-utils';
import { BigNumber, SafeMathRevertErrors } from '@0x/utils';
import * as _ from 'lodash';

import { artifacts, ReferenceFunctions, TestLibsContract } from '../src';

blockchainTests('LibFillResults', env => {
    const CHAIN_ID = 1337;
    const { ONE_ETHER, MAX_UINT256 } = constants;
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
        describe('explicit tests', () => {
            const DEFAULT_FILL_RESULTS = [
                {
                    makerAssetFilledAmount: ONE_ETHER,
                    takerAssetFilledAmount: ONE_ETHER.times(2),
                    makerFeePaid: ONE_ETHER.times(0.001),
                    takerFeePaid: ONE_ETHER.times(0.002),
                },
                {
                    makerAssetFilledAmount: ONE_ETHER.times(0.01),
                    takerAssetFilledAmount: ONE_ETHER.times(2).times(0.01),
                    makerFeePaid: ONE_ETHER.times(0.001).times(0.01),
                    takerFeePaid: ONE_ETHER.times(0.002).times(0.01),
                },
            ];

            it('matches the output of the reference function', async () => {
                const [a, b] = DEFAULT_FILL_RESULTS;
                const expected = ReferenceFunctions.addFillResults(a, b);
                const actual = await libsContract.addFillResults.callAsync(a, b);
                expect(actual).to.deep.equal(expected);
            });

            it('reverts if computing `makerAssetFilledAmount` overflows', async () => {
                const [a, b] = _.cloneDeep(DEFAULT_FILL_RESULTS);
                b.makerAssetFilledAmount = MAX_UINT256;
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256AdditionOverflow,
                    a.makerAssetFilledAmount,
                    b.makerAssetFilledAmount,
                );
                return expect(libsContract.addFillResults.callAsync(a, b)).to.revertWith(expectedError);
            });

            it('reverts if computing `takerAssetFilledAmount` overflows', async () => {
                const [a, b] = _.cloneDeep(DEFAULT_FILL_RESULTS);
                b.takerAssetFilledAmount = MAX_UINT256;
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256AdditionOverflow,
                    a.takerAssetFilledAmount,
                    b.takerAssetFilledAmount,
                );
                return expect(libsContract.addFillResults.callAsync(a, b)).to.revertWith(expectedError);
            });

            it('reverts if computing `makerFeePaid` overflows', async () => {
                const [a, b] = _.cloneDeep(DEFAULT_FILL_RESULTS);
                b.makerFeePaid = MAX_UINT256;
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256AdditionOverflow,
                    a.makerFeePaid,
                    b.makerFeePaid,
                );
                return expect(libsContract.addFillResults.callAsync(a, b)).to.revertWith(expectedError);
            });

            it('reverts if computing `takerFeePaid` overflows', async () => {
                const [a, b] = _.cloneDeep(DEFAULT_FILL_RESULTS);
                b.takerFeePaid = MAX_UINT256;
                const expectedError = new SafeMathRevertErrors.SafeMathError(
                    SafeMathRevertErrors.SafeMathErrorCodes.Uint256AdditionOverflow,
                    a.takerFeePaid,
                    b.takerFeePaid,
                );
                return expect(libsContract.addFillResults.callAsync(a, b)).to.revertWith(expectedError);
            });
        });
    });
});
