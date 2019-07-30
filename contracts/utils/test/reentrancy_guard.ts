import { chaiSetup, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { ReentrancyGuardRevertErrors } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';

import { artifacts, TestReentrancyGuardContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('ReentrancyGuard', () => {
    let guard: TestReentrancyGuardContract;

    before(async () => {
        await blockchainLifecycle.startAsync();
        // Deploy TestReentrancyGuard
        guard = await TestReentrancyGuardContract.deployFrom0xArtifactAsync(
            artifacts.TestReentrancyGuard,
            provider,
            txDefaults,
        );
    });

    after(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('nonReentrant', () => {
        it('should throw if reentrancy occurs', async () => {
            const expectedError = new ReentrancyGuardRevertErrors.IllegalReentrancyError();
            return expect(guard.guarded.sendTransactionAsync(true)).to.revertWith(expectedError);
        });

        it('should succeed if reentrancy does not occur', async () => {
            return expect(guard.guarded.sendTransactionAsync(false)).to.be.fulfilled('');
        });
    });
});
