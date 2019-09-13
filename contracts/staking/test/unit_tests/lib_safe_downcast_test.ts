import { blockchainTests, expect, Numberish } from '@0x/contracts-test-utils';
import { BigNumber, SafeMathRevertErrors } from '@0x/utils';
import * as _ from 'lodash';

import { artifacts, TestLibSafeDowncastContract } from '../../src/';

blockchainTests('LibSafeDowncast', env => {
    let testContract: TestLibSafeDowncastContract;

    before(async () => {
        testContract = await TestLibSafeDowncastContract.deployFrom0xArtifactAsync(
            artifacts.TestLibSafeDowncast,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    const MAX_UINT_64 = new BigNumber(2).pow(64).minus(1);
    const MAX_UINT_96 = new BigNumber(2).pow(96).minus(1);
    const MAX_UINT_256 = new BigNumber(2).pow(256).minus(1);

    describe('downcastToUint96', async () => {
        async function verifyCorrectDowncastAsync(n: Numberish): Promise<void> {
            const actual = await testContract.downcastToUint96.callAsync(new BigNumber(n));
            expect(actual).to.bignumber.eq(n);
        }
        async function verifyDowncastErrorAsync(n: Numberish): Promise<void> {
            const expectedError = new SafeMathRevertErrors.Uint256DowncastError(
                SafeMathRevertErrors.DowncastErrorCodes.ValueTooLargeToDowncastToUint96,
                new BigNumber(n),
            );
            const tx = testContract.downcastToUint96.callAsync(new BigNumber(n));
            await expect(tx).to.revertWith(expectedError);
        }

        it('correctly downcasts 0', async () => {
            await verifyCorrectDowncastAsync(0);
        });
        it('correctly downcasts 1337', async () => {
            await verifyCorrectDowncastAsync(1337);
        });
        it('correctly downcasts MAX_UINT_96', async () => {
            await verifyCorrectDowncastAsync(MAX_UINT_96);
        });
        it('reverts on MAX_UINT_96 + 1', async () => {
            await verifyDowncastErrorAsync(MAX_UINT_96.plus(1));
        });
        it('reverts on MAX_UINT_256', async () => {
            await verifyDowncastErrorAsync(MAX_UINT_256);
        });
    });

    describe('downcastToUint64', async () => {
        async function verifyCorrectDowncastAsync(n: Numberish): Promise<void> {
            const actual = await testContract.downcastToUint64.callAsync(new BigNumber(n));
            expect(actual).to.bignumber.eq(n);
        }
        async function verifyDowncastErrorAsync(n: Numberish): Promise<void> {
            const expectedError = new SafeMathRevertErrors.Uint256DowncastError(
                SafeMathRevertErrors.DowncastErrorCodes.ValueTooLargeToDowncastToUint64,
                new BigNumber(n),
            );
            const tx = testContract.downcastToUint64.callAsync(new BigNumber(n));
            await expect(tx).to.revertWith(expectedError);
        }

        it('correctly downcasts 0', async () => {
            await verifyCorrectDowncastAsync(0);
        });
        it('correctly downcasts 1337', async () => {
            await verifyCorrectDowncastAsync(1337);
        });
        it('correctly downcasts MAX_UINT_64', async () => {
            await verifyCorrectDowncastAsync(MAX_UINT_64);
        });
        it('reverts on MAX_UINT_64 + 1', async () => {
            await verifyDowncastErrorAsync(MAX_UINT_64.plus(1));
        });
        it('reverts on MAX_UINT_256', async () => {
            await verifyDowncastErrorAsync(MAX_UINT_256);
        });
    });
});
