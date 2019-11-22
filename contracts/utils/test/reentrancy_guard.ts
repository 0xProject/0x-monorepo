import { chaiSetup, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import * as chai from 'chai';
import * as _ from 'lodash';

import { ReentrancyGuardRevertErrors } from '@0x/utils';

import { artifacts } from './artifacts';
import { TestReentrancyGuardContract } from './wrappers';

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
            {},
        );
    });

    after(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('nonReentrant', () => {
        it('should revert if reentrancy occurs', async () => {
            const expectedError = new ReentrancyGuardRevertErrors.IllegalReentrancyError();
            return expect(guard.guarded(true).sendTransactionAsync()).to.revertWith(expectedError);
        });

        it('should succeed if reentrancy does not occur', async () => {
            const isSuccessful = await guard.guarded(false).callAsync();
            expect(isSuccessful).to.be.true();
        });
    });
});
