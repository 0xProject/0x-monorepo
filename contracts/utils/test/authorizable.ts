import { chaiSetup, constants, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { AuthorizableRevertErrors, BigNumber, OwnableRevertErrors } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';

import { artifacts, AuthorizableContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Authorizable', () => {
    let owner: string;
    let notOwner: string;
    let address: string;
    let authorizable: AuthorizableContract;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });

    after(async () => {
        await blockchainLifecycle.revertAsync();
    });

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        [owner, address, notOwner] = _.slice(accounts, 0, 3);
        authorizable = await AuthorizableContract.deployFrom0xArtifactAsync(
            artifacts.Authorizable,
            provider,
            txDefaults,
        );
    });

    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });

    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('addAuthorizedAddress', () => {
        it('should revert if not called by owner', async () => {
            const expectedError = new OwnableRevertErrors.OnlyOwnerError(notOwner, owner);
            const tx = authorizable.addAuthorizedAddress.sendTransactionAsync(notOwner, { from: notOwner });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should allow owner to add an authorized address', async () => {
            await authorizable.addAuthorizedAddress.awaitTransactionSuccessAsync(address, { from: owner });
            const isAuthorized = await authorizable.authorized.callAsync(address);
            expect(isAuthorized).to.be.true();
        });

        it('should revert if owner attempts to authorize the zero address', async () => {
            const expectedError = new AuthorizableRevertErrors.ZeroCantBeAuthorizedError();
            const tx = authorizable.addAuthorizedAddress.sendTransactionAsync(constants.NULL_ADDRESS, { from: owner });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if owner attempts to authorize a duplicate address', async () => {
            await authorizable.addAuthorizedAddress.awaitTransactionSuccessAsync(
                address,
                { from: owner },
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const expectedError = new AuthorizableRevertErrors.TargetAlreadyAuthorizedError(address);
            const tx = authorizable.addAuthorizedAddress.sendTransactionAsync(address, { from: owner });
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('removeAuthorizedAddress', () => {
        it('should revert if not called by owner', async () => {
            await authorizable.addAuthorizedAddress.awaitTransactionSuccessAsync(
                address,
                { from: owner },
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const expectedError = new OwnableRevertErrors.OnlyOwnerError(notOwner, owner);
            const tx = authorizable.removeAuthorizedAddress.sendTransactionAsync(address, { from: notOwner });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should allow owner to remove an authorized address', async () => {
            await authorizable.addAuthorizedAddress.awaitTransactionSuccessAsync(
                address,
                { from: owner },
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await authorizable.removeAuthorizedAddress.awaitTransactionSuccessAsync(
                address,
                { from: owner },
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const isAuthorized = await authorizable.authorized.callAsync(address);
            expect(isAuthorized).to.be.false();
        });

        it('should revert if owner attempts to remove an address that is not authorized', async () => {
            const expectedError = new AuthorizableRevertErrors.TargetNotAuthorizedError(address);
            const tx = authorizable.removeAuthorizedAddress.sendTransactionAsync(address, { from: owner });
            return expect(tx).to.revertWith(expectedError);
        });
    });

    describe('removeAuthorizedAddressAtIndex', () => {
        it('should revert if not called by owner', async () => {
            await authorizable.addAuthorizedAddress.awaitTransactionSuccessAsync(
                address,
                { from: owner },
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const index = new BigNumber(0);
            const expectedError = new OwnableRevertErrors.OnlyOwnerError(notOwner, owner);
            const tx = authorizable.removeAuthorizedAddressAtIndex.sendTransactionAsync(address, index, {
                from: notOwner,
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if index is >= authorities.length', async () => {
            await authorizable.addAuthorizedAddress.awaitTransactionSuccessAsync(
                address,
                { from: owner },
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const index = new BigNumber(1);
            const expectedError = new AuthorizableRevertErrors.IndexOutOfBoundsError(index, constants.ZERO_AMOUNT);
            const tx = authorizable.removeAuthorizedAddressAtIndex.sendTransactionAsync(address, index, {
                from: owner,
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if owner attempts to remove an address that is not authorized', async () => {
            const index = new BigNumber(0);
            const expectedError = new AuthorizableRevertErrors.TargetNotAuthorizedError(address);
            const tx = authorizable.removeAuthorizedAddressAtIndex.sendTransactionAsync(address, index, {
                from: owner,
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if address at index does not match target', async () => {
            const address1 = address;
            const address2 = notOwner;
            await authorizable.addAuthorizedAddress.awaitTransactionSuccessAsync(
                address1,
                { from: owner },
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await authorizable.addAuthorizedAddress.awaitTransactionSuccessAsync(
                address2,
                { from: owner },
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const address1Index = new BigNumber(0);
            const expectedError = new AuthorizableRevertErrors.AuthorizedAddressMismatchError(address1, address2);
            const tx = authorizable.removeAuthorizedAddressAtIndex.sendTransactionAsync(address2, address1Index, {
                from: owner,
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should allow owner to remove an authorized address', async () => {
            await authorizable.addAuthorizedAddress.awaitTransactionSuccessAsync(
                address,
                { from: owner },
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const index = new BigNumber(0);
            await authorizable.removeAuthorizedAddressAtIndex.awaitTransactionSuccessAsync(
                address,
                index,
                { from: owner },
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const isAuthorized = await authorizable.authorized.callAsync(address);
            expect(isAuthorized).to.be.false();
        });
    });

    describe('getAuthorizedAddresses', () => {
        it('should return all authorized addresses', async () => {
            const initial = await authorizable.getAuthorizedAddresses.callAsync();
            expect(initial).to.have.length(0);
            await authorizable.addAuthorizedAddress.awaitTransactionSuccessAsync(
                address,
                { from: owner },
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const afterAdd = await authorizable.getAuthorizedAddresses.callAsync();
            expect(afterAdd).to.have.length(1);
            expect(afterAdd).to.include(address);
            await authorizable.removeAuthorizedAddress.awaitTransactionSuccessAsync(
                address,
                { from: owner },
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const afterRemove = await authorizable.getAuthorizedAddresses.callAsync();
            expect(afterRemove).to.have.length(0);
        });
    });
});
