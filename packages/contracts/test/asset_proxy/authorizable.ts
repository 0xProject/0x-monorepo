import { BlockchainLifecycle } from '@0x/dev-utils';
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';

import { MixinAuthorizableContract } from '../../generated-wrappers/mixin_authorizable';
import { artifacts } from '../../src/artifacts';
import { expectTransactionFailedAsync } from '../utils/assertions';
import { chaiSetup } from '../utils/chai_setup';
import { constants } from '../utils/constants';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Authorizable', () => {
    let owner: string;
    let notOwner: string;
    let address: string;
    let authorizable: MixinAuthorizableContract;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        [owner, address, notOwner] = _.slice(accounts, 0, 3);
        authorizable = await MixinAuthorizableContract.deployFrom0xArtifactAsync(
            artifacts.MixinAuthorizable,
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
        it('should throw if not called by owner', async () => {
            return expectTransactionFailedAsync(
                authorizable.addAuthorizedAddress.sendTransactionAsync(notOwner, { from: notOwner }),
                RevertReason.OnlyContractOwner,
            );
        });
        it('should allow owner to add an authorized address', async () => {
            await web3Wrapper.awaitTransactionSuccessAsync(
                await authorizable.addAuthorizedAddress.sendTransactionAsync(address, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const isAuthorized = await authorizable.authorized.callAsync(address);
            expect(isAuthorized).to.be.true();
        });
        it('should throw if owner attempts to authorize a duplicate address', async () => {
            await web3Wrapper.awaitTransactionSuccessAsync(
                await authorizable.addAuthorizedAddress.sendTransactionAsync(address, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            return expectTransactionFailedAsync(
                authorizable.addAuthorizedAddress.sendTransactionAsync(address, { from: owner }),
                RevertReason.TargetAlreadyAuthorized,
            );
        });
    });

    describe('removeAuthorizedAddress', () => {
        it('should throw if not called by owner', async () => {
            await web3Wrapper.awaitTransactionSuccessAsync(
                await authorizable.addAuthorizedAddress.sendTransactionAsync(address, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            return expectTransactionFailedAsync(
                authorizable.removeAuthorizedAddress.sendTransactionAsync(address, {
                    from: notOwner,
                }),
                RevertReason.OnlyContractOwner,
            );
        });

        it('should allow owner to remove an authorized address', async () => {
            await web3Wrapper.awaitTransactionSuccessAsync(
                await authorizable.addAuthorizedAddress.sendTransactionAsync(address, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await authorizable.removeAuthorizedAddress.sendTransactionAsync(address, {
                    from: owner,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const isAuthorized = await authorizable.authorized.callAsync(address);
            expect(isAuthorized).to.be.false();
        });

        it('should throw if owner attempts to remove an address that is not authorized', async () => {
            return expectTransactionFailedAsync(
                authorizable.removeAuthorizedAddress.sendTransactionAsync(address, {
                    from: owner,
                }),
                RevertReason.TargetNotAuthorized,
            );
        });
    });

    describe('removeAuthorizedAddressAtIndex', () => {
        it('should throw if not called by owner', async () => {
            await web3Wrapper.awaitTransactionSuccessAsync(
                await authorizable.addAuthorizedAddress.sendTransactionAsync(address, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const index = new BigNumber(0);
            return expectTransactionFailedAsync(
                authorizable.removeAuthorizedAddressAtIndex.sendTransactionAsync(address, index, {
                    from: notOwner,
                }),
                RevertReason.OnlyContractOwner,
            );
        });
        it('should throw if index is >= authorities.length', async () => {
            await web3Wrapper.awaitTransactionSuccessAsync(
                await authorizable.addAuthorizedAddress.sendTransactionAsync(address, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const index = new BigNumber(1);
            return expectTransactionFailedAsync(
                authorizable.removeAuthorizedAddressAtIndex.sendTransactionAsync(address, index, {
                    from: owner,
                }),
                RevertReason.IndexOutOfBounds,
            );
        });
        it('should throw if owner attempts to remove an address that is not authorized', async () => {
            const index = new BigNumber(0);
            return expectTransactionFailedAsync(
                authorizable.removeAuthorizedAddressAtIndex.sendTransactionAsync(address, index, {
                    from: owner,
                }),
                RevertReason.TargetNotAuthorized,
            );
        });
        it('should throw if address at index does not match target', async () => {
            const address1 = address;
            const address2 = notOwner;
            await web3Wrapper.awaitTransactionSuccessAsync(
                await authorizable.addAuthorizedAddress.sendTransactionAsync(address1, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await authorizable.addAuthorizedAddress.sendTransactionAsync(address2, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const address1Index = new BigNumber(0);
            return expectTransactionFailedAsync(
                authorizable.removeAuthorizedAddressAtIndex.sendTransactionAsync(address2, address1Index, {
                    from: owner,
                }),
                RevertReason.AuthorizedAddressMismatch,
            );
        });
        it('should allow owner to remove an authorized address', async () => {
            await web3Wrapper.awaitTransactionSuccessAsync(
                await authorizable.addAuthorizedAddress.sendTransactionAsync(address, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const index = new BigNumber(0);
            await web3Wrapper.awaitTransactionSuccessAsync(
                await authorizable.removeAuthorizedAddressAtIndex.sendTransactionAsync(address, index, {
                    from: owner,
                }),
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
            await web3Wrapper.awaitTransactionSuccessAsync(
                await authorizable.addAuthorizedAddress.sendTransactionAsync(address, {
                    from: owner,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const afterAdd = await authorizable.getAuthorizedAddresses.callAsync();
            expect(afterAdd).to.have.length(1);
            expect(afterAdd).to.include(address);

            await web3Wrapper.awaitTransactionSuccessAsync(
                await authorizable.removeAuthorizedAddress.sendTransactionAsync(address, {
                    from: owner,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const afterRemove = await authorizable.getAuthorizedAddresses.callAsync();
            expect(afterRemove).to.have.length(0);
        });
    });
});
