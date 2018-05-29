import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import 'make-promises-safe';
import * as Web3 from 'web3';

import { MixinAuthorizableContract } from '../../src/contract_wrappers/generated/mixin_authorizable';
import { artifacts } from '../../src/utils/artifacts';
import { chaiSetup } from '../../src/utils/chai_setup';
import { constants } from '../../src/utils/constants';
import { provider, txDefaults, web3Wrapper } from '../../src/utils/web3_wrapper';

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
        owner = address = accounts[0];
        notOwner = accounts[1];
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
            return expect(
                authorizable.addAuthorizedAddress.sendTransactionAsync(notOwner, { from: notOwner }),
            ).to.be.rejectedWith(constants.REVERT);
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
            return expect(
                authorizable.addAuthorizedAddress.sendTransactionAsync(address, { from: owner }),
            ).to.be.rejectedWith(constants.REVERT);
        });
    });

    describe('removeAuthorizedAddress', () => {
        it('should throw if not called by owner', async () => {
            await web3Wrapper.awaitTransactionSuccessAsync(
                await authorizable.addAuthorizedAddress.sendTransactionAsync(address, { from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            return expect(
                authorizable.removeAuthorizedAddress.sendTransactionAsync(address, {
                    from: notOwner,
                }),
            ).to.be.rejectedWith(constants.REVERT);
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
            return expect(
                authorizable.removeAuthorizedAddress.sendTransactionAsync(address, {
                    from: owner,
                }),
            ).to.be.rejectedWith(constants.REVERT);
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
