import { blockchainTests, expect, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { artifacts } from './artifacts';

import { MixinAuthorizableContract } from './wrappers';

blockchainTests.resets('Authorizable', () => {
    let owner: string;
    let notOwner: string;
    let address: string;
    let authorizable: MixinAuthorizableContract;

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        [owner, address, notOwner] = accounts.slice(0, 3);
        authorizable = await MixinAuthorizableContract.deployFrom0xArtifactAsync(
            artifacts.MixinAuthorizable,
            provider,
            txDefaults,
            artifacts,
        );
    });

    describe('addAuthorizedAddress', () => {
        it('should revert if not called by owner', async () => {
            const tx = authorizable.addAuthorizedAddress(notOwner).sendTransactionAsync({ from: notOwner });
            return expect(tx).to.revertWith(RevertReason.OnlyContractOwner);
        });

        it('should allow owner to add an authorized address', async () => {
            await authorizable.addAuthorizedAddress(address).awaitTransactionSuccessAsync({ from: owner });
            const isAuthorized = await authorizable.authorized(address).callAsync();
            expect(isAuthorized).to.be.true();
        });

        it('should revert if owner attempts to authorize a duplicate address', async () => {
            await authorizable.addAuthorizedAddress(address).awaitTransactionSuccessAsync({ from: owner });
            const tx = authorizable.addAuthorizedAddress(address).sendTransactionAsync({ from: owner });
            return expect(tx).to.revertWith(RevertReason.TargetAlreadyAuthorized);
        });
    });

    describe('removeAuthorizedAddress', () => {
        it('should revert if not called by owner', async () => {
            await authorizable.addAuthorizedAddress(address).awaitTransactionSuccessAsync({ from: owner });
            const tx = authorizable.removeAuthorizedAddress(address).sendTransactionAsync({ from: notOwner });
            return expect(tx).to.revertWith(RevertReason.OnlyContractOwner);
        });

        it('should allow owner to remove an authorized address', async () => {
            await authorizable.addAuthorizedAddress(address).awaitTransactionSuccessAsync({ from: owner });
            await authorizable.removeAuthorizedAddress(address).awaitTransactionSuccessAsync({ from: owner });
            const isAuthorized = await authorizable.authorized(address).callAsync();
            expect(isAuthorized).to.be.false();
        });

        it('should revert if owner attempts to remove an address that is not authorized', async () => {
            const tx = authorizable.removeAuthorizedAddress(address).sendTransactionAsync({ from: owner });
            return expect(tx).to.revertWith(RevertReason.TargetNotAuthorized);
        });
    });

    describe('removeAuthorizedAddressAtIndex', () => {
        it('should revert if not called by owner', async () => {
            await authorizable.addAuthorizedAddress(address).awaitTransactionSuccessAsync({ from: owner });
            const index = new BigNumber(0);
            const tx = authorizable
                .removeAuthorizedAddressAtIndex(address, index)
                .sendTransactionAsync({ from: notOwner });
            return expect(tx).to.revertWith(RevertReason.OnlyContractOwner);
        });

        it('should revert if index is >= authorities.length', async () => {
            await authorizable.addAuthorizedAddress(address).awaitTransactionSuccessAsync({ from: owner });
            const index = new BigNumber(1);
            const tx = authorizable
                .removeAuthorizedAddressAtIndex(address, index)
                .sendTransactionAsync({ from: owner });
            return expect(tx).to.revertWith(RevertReason.IndexOutOfBounds);
        });

        it('should revert if owner attempts to remove an address that is not authorized', async () => {
            const index = new BigNumber(0);
            const tx = authorizable
                .removeAuthorizedAddressAtIndex(address, index)
                .sendTransactionAsync({ from: owner });
            return expect(tx).to.revertWith(RevertReason.TargetNotAuthorized);
        });

        it('should revert if address at index does not match target', async () => {
            const address1 = address;
            const address2 = notOwner;
            await authorizable.addAuthorizedAddress(address1).awaitTransactionSuccessAsync({ from: owner });
            await authorizable.addAuthorizedAddress(address2).awaitTransactionSuccessAsync({ from: owner });
            const address1Index = new BigNumber(0);
            const tx = authorizable
                .removeAuthorizedAddressAtIndex(address2, address1Index)
                .sendTransactionAsync({ from: owner });
            return expect(tx).to.revertWith(RevertReason.AuthorizedAddressMismatch);
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
        it('should return all authorized addresses', async () => {
            const initial = await authorizable.getAuthorizedAddresses().callAsync();
            expect(initial).to.have.length(0);
            await authorizable.addAuthorizedAddress(address).awaitTransactionSuccessAsync({ from: owner });
            const afterAdd = await authorizable.getAuthorizedAddresses().callAsync();
            expect(afterAdd).to.have.length(1);
            expect(afterAdd).to.include(address);
            await authorizable.removeAuthorizedAddress(address).awaitTransactionSuccessAsync({ from: owner });
            const afterRemove = await authorizable.getAuthorizedAddresses().callAsync();
            expect(afterRemove).to.have.length(0);
        });
    });
});
