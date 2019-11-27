import { blockchainTests, constants, expect } from '@0x/contracts-test-utils';
import { AuthorizableRevertErrors, BigNumber, OwnableRevertErrors } from '@0x/utils';
import * as _ from 'lodash';

import { artifacts } from './artifacts';
import { TestAuthorizableContract } from './wrappers';

blockchainTests.resets('Authorizable', env => {
    let owner: string;
    let notOwner: string;
    let address: string;
    let authorizable: TestAuthorizableContract;

    before(async () => {
        const accounts = await env.getAccountAddressesAsync();
        [owner, address, notOwner] = _.slice(accounts, 0, 3);
        authorizable = await TestAuthorizableContract.deployFrom0xArtifactAsync(
            artifacts.TestAuthorizable,
            env.provider,
            env.txDefaults,
            artifacts,
        );
    });

    describe('addAuthorizedAddress', () => {
        it('should revert if not called by owner', async () => {
            const expectedError = new OwnableRevertErrors.OnlyOwnerError(notOwner, owner);
            const tx = authorizable.addAuthorizedAddress(notOwner).sendTransactionAsync({ from: notOwner });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should allow owner to add an authorized address', async () => {
            await authorizable.addAuthorizedAddress(address).awaitTransactionSuccessAsync({ from: owner });
            const isAuthorized = await authorizable.authorized(address).callAsync();
            expect(isAuthorized).to.be.true();
        });

        it('should revert if owner attempts to authorize the zero address', async () => {
            const expectedError = new AuthorizableRevertErrors.ZeroCantBeAuthorizedError();
            const tx = authorizable.addAuthorizedAddress(constants.NULL_ADDRESS).sendTransactionAsync({ from: owner });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if owner attempts to authorize a duplicate address', async () => {
            await authorizable.addAuthorizedAddress(address).awaitTransactionSuccessAsync({ from: owner });
            const expectedError = new AuthorizableRevertErrors.TargetAlreadyAuthorizedError(address);
            const tx = authorizable.addAuthorizedAddress(address).sendTransactionAsync({ from: owner });
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('onlyAuthorized', () => {
        before(async () => {
            await authorizable.addAuthorizedAddress(owner).awaitTransactionSuccessAsync({ from: owner });
        });

        after(async () => {
            await authorizable.removeAuthorizedAddress(owner).awaitTransactionSuccessAsync({ from: owner });
        });

        it('should revert if sender is not authorized', async () => {
            const tx = authorizable.onlyAuthorizedFn().callAsync({ from: notOwner });
            const expectedError = new AuthorizableRevertErrors.SenderNotAuthorizedError(notOwner);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should succeed if sender is authorized', async () => {
            await authorizable.onlyAuthorizedFn().callAsync({ from: owner });
        });
    });

    describe('removeAuthorizedAddress', () => {
        it('should revert if not called by owner', async () => {
            await authorizable.addAuthorizedAddress(address).awaitTransactionSuccessAsync({ from: owner });
            const expectedError = new OwnableRevertErrors.OnlyOwnerError(notOwner, owner);
            const tx = authorizable.removeAuthorizedAddress(address).sendTransactionAsync({ from: notOwner });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should allow owner to remove an authorized address', async () => {
            await authorizable.addAuthorizedAddress(address).awaitTransactionSuccessAsync({ from: owner });
            await authorizable.removeAuthorizedAddress(address).awaitTransactionSuccessAsync({ from: owner });
            const isAuthorized = await authorizable.authorized(address).callAsync();
            expect(isAuthorized).to.be.false();
        });

        it('should revert if owner attempts to remove an address that is not authorized', async () => {
            const expectedError = new AuthorizableRevertErrors.TargetNotAuthorizedError(address);
            const tx = authorizable.removeAuthorizedAddress(address).sendTransactionAsync({ from: owner });
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('removeAuthorizedAddressAtIndex', () => {
        it('should revert if not called by owner', async () => {
            await authorizable.addAuthorizedAddress(address).awaitTransactionSuccessAsync({ from: owner });
            const index = new BigNumber(0);
            const expectedError = new OwnableRevertErrors.OnlyOwnerError(notOwner, owner);
            const tx = authorizable.removeAuthorizedAddressAtIndex(address, index).sendTransactionAsync({
                from: notOwner,
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if index is >= authorities.length', async () => {
            await authorizable.addAuthorizedAddress(address).awaitTransactionSuccessAsync({ from: owner });
            const index = new BigNumber(1);
            const expectedError = new AuthorizableRevertErrors.IndexOutOfBoundsError(index, index);
            const tx = authorizable.removeAuthorizedAddressAtIndex(address, index).sendTransactionAsync({
                from: owner,
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if owner attempts to remove an address that is not authorized', async () => {
            const index = new BigNumber(0);
            const expectedError = new AuthorizableRevertErrors.TargetNotAuthorizedError(address);
            const tx = authorizable.removeAuthorizedAddressAtIndex(address, index).sendTransactionAsync({
                from: owner,
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if address at index does not match target', async () => {
            const address1 = address;
            const address2 = notOwner;
            await authorizable.addAuthorizedAddress(address1).awaitTransactionSuccessAsync({ from: owner });
            await authorizable.addAuthorizedAddress(address2).awaitTransactionSuccessAsync({ from: owner });
            const address1Index = new BigNumber(0);
            const expectedError = new AuthorizableRevertErrors.AuthorizedAddressMismatchError(address1, address2);
            const tx = authorizable.removeAuthorizedAddressAtIndex(address2, address1Index).sendTransactionAsync({
                from: owner,
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should allow owner to remove an authorized address', async () => {
            await authorizable.addAuthorizedAddress(address).awaitTransactionSuccessAsync({ from: owner });
            const index = new BigNumber(0);
            await authorizable.removeAuthorizedAddressAtIndex(address, index).awaitTransactionSuccessAsync({
                from: owner,
            });
            const isAuthorized = await authorizable.authorized(address).callAsync();
            expect(isAuthorized).to.be.false();
        });
    });

    describe('getAuthorizedAddresses', () => {
        it('should return correct authorized addresses', async () => {
            // Initial Authorities
            let authorities = await authorizable.getAuthorizedAddresses().callAsync();
            expect(authorities).to.be.deep.eq([]);

            // Authorities after addition
            await authorizable.addAuthorizedAddress(address).awaitTransactionSuccessAsync({ from: owner });
            authorities = await authorizable.getAuthorizedAddresses().callAsync();
            expect(authorities).to.be.deep.eq([address]);

            // Authorities after removal
            await authorizable.removeAuthorizedAddress(address).awaitTransactionSuccessAsync({ from: owner });
            authorities = await authorizable.getAuthorizedAddresses().callAsync();
            expect(authorities).to.be.deep.eq([]);
        });
    });
});
