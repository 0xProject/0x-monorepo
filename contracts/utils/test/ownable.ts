import { blockchainTests, constants, expect, filterLogsToArguments } from '@0x/contracts-test-utils';

import {
    artifacts,
    IOwnableEvents,
    IOwnableOwnershipTransferredEventArgs,
    OwnableRevertErrors,
    TestOwnableContract,
} from '../src';

blockchainTests.resets('Ownable', env => {
    let ownable: TestOwnableContract;
    let owner: string;
    let nonOwner: string;

    before(async () => {
        const accounts = await env.getAccountAddressesAsync();
        owner = await accounts[0];
        nonOwner = await accounts[1];
        ownable = await TestOwnableContract.deployFrom0xArtifactAsync(
            artifacts.TestOwnable,
            env.provider,
            { ...env.txDefaults, from: owner },
            artifacts,
        );
    });

    describe('onlyOwner', () => {
        it('should revert if sender is not the owner', async () => {
            const expectedError = new OwnableRevertErrors.OnlyOwnerError(nonOwner, owner);
            return expect(ownable.externalOnlyOwner.callAsync({ from: nonOwner })).to.revertWith(expectedError);
        });

        it('should succeed if sender is the owner', async () => {
            const isSuccessful = await ownable.externalOnlyOwner.callAsync({ from: owner });
            expect(isSuccessful).to.be.true();
        });
    });

    describe('transferOwnership', () => {
        it('should revert if the specified new owner is the zero address', async () => {
            const expectedError = new OwnableRevertErrors.TransferOwnerToZeroError();
            const tx = ownable.transferOwnership.sendTransactionAsync(constants.NULL_ADDRESS, { from: owner });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should transfer ownership if the specified new owner is not the zero address', async () => {
            const receipt = await ownable.transferOwnership.awaitTransactionSuccessAsync(nonOwner, { from: owner });

            // Ensure that the correct logs were emitted.
            expect(receipt.logs.length).to.be.eq(1);
            const [event] = filterLogsToArguments<IOwnableOwnershipTransferredEventArgs>(
                receipt.logs,
                IOwnableEvents.OwnershipTransferred,
            );
            expect(event).to.be.deep.eq({ previousOwner: owner, newOwner: nonOwner });

            // Ensure that the owner was actually updated
            const updatedOwner = await ownable.owner.callAsync();
            expect(updatedOwner).to.be.eq(nonOwner);
        });
    });
});
