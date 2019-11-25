import { blockchainTests, constants, expect, filterLogsToArguments } from '@0x/contracts-test-utils';
import {
    AuthorizableAuthorizedAddressAddedEventArgs,
    AuthorizableAuthorizedAddressRemovedEventArgs,
    OwnableRevertErrors,
} from '@0x/contracts-utils';

import { artifacts, TestStakingContract, TestStakingEvents } from '../../src';

blockchainTests.resets('Staking Authorization Tests', env => {
    let testContract: TestStakingContract;

    let owner: string;
    let nonOwner: string;

    before(async () => {
        [owner, nonOwner] = await env.getAccountAddressesAsync();

        testContract = await TestStakingContract.deployFrom0xArtifactAsync(
            artifacts.TestStaking,
            env.provider,
            {
                ...env.txDefaults,
                from: owner,
            },
            artifacts,
            constants.NULL_ADDRESS,
            constants.NULL_ADDRESS,
        );
    });

    it("shouldn't have any authorized addresses initially", async () => {
        const authorities = await testContract.getAuthorizedAddresses().callAsync();
        expect(authorities).to.be.deep.eq([]);
    });

    describe('addAuthorizedAddress', () => {
        it('should allow owner to add authorized address', async () => {
            const receipt = await testContract
                .addAuthorizedAddress(nonOwner)
                .awaitTransactionSuccessAsync({ from: owner });

            const args = filterLogsToArguments<AuthorizableAuthorizedAddressAddedEventArgs>(
                receipt.logs,
                TestStakingEvents.AuthorizedAddressAdded,
            );
            expect(args).to.be.deep.eq([{ target: nonOwner, caller: owner }]);

            const authorities = await testContract.getAuthorizedAddresses().callAsync();
            expect(authorities).to.be.deep.eq([nonOwner]);
        });

        it('should throw if non-owner adds authorized address', async () => {
            const tx = testContract.addAuthorizedAddress(owner).awaitTransactionSuccessAsync({ from: nonOwner });
            const expectedError = new OwnableRevertErrors.OnlyOwnerError(nonOwner, owner);
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('removeAuthorizedAddress', () => {
        before(async () => {
            await testContract.addAuthorizedAddress(owner).awaitTransactionSuccessAsync({ from: owner });
            const authorities = await testContract.getAuthorizedAddresses().callAsync();
            expect(authorities).to.be.deep.eq([owner]);
        });

        it('should allow owner to remove authorized address', async () => {
            const receipt = await testContract
                .removeAuthorizedAddress(owner)
                .awaitTransactionSuccessAsync({ from: owner });

            const args = filterLogsToArguments<AuthorizableAuthorizedAddressRemovedEventArgs>(
                receipt.logs,
                TestStakingEvents.AuthorizedAddressRemoved,
            );
            expect(args).to.be.deep.eq([{ target: owner, caller: owner }]);

            const authorities = await testContract.getAuthorizedAddresses().callAsync();
            expect(authorities).to.be.deep.eq([]);
        });

        it('should throw if non-owner removes authorized address', async () => {
            const tx = testContract.removeAuthorizedAddress(owner).awaitTransactionSuccessAsync({ from: nonOwner });
            const expectedError = new OwnableRevertErrors.OnlyOwnerError(nonOwner, owner);
            return expect(tx).to.revertWith(expectedError);
        });
    });
});
