import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import 'make-promises-safe';
import * as Web3 from 'web3';

import { TokenTransferProxyContract } from '../../src/contract_wrappers/generated/token_transfer_proxy';
import { artifacts } from '../../util/artifacts';
import { constants } from '../../util/constants';
import { ContractName } from '../../util/types';
import { chaiSetup } from '../utils/chai_setup';

import { expectRevertOrAlwaysFailingTransaction } from '../utils/assertions';
import { provider, txDefaults, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('TokenTransferProxy', () => {
    let owner: string;
    let notOwner: string;
    let address: string;
    let tokenTransferProxy: TokenTransferProxyContract;
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
        tokenTransferProxy = await TokenTransferProxyContract.deployFrom0xArtifactAsync(
            artifacts.TokenTransferProxy,
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
            return expectRevertOrAlwaysFailingTransaction(
                tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(notOwner, { from: notOwner }),
            );
        });
        it('should allow owner to add an authorized address', async () => {
            await web3Wrapper.awaitTransactionMinedAsync(
                await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(address, { from: owner }),
                constants.TEST_AWAIT_TRANSACTION_MS,
            );
            const isAuthorized = await tokenTransferProxy.authorized.callAsync(address);
            expect(isAuthorized).to.be.true();
        });
        it('should throw if owner attempts to authorize a duplicate address', async () => {
            await web3Wrapper.awaitTransactionMinedAsync(
                await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(address, { from: owner }),
                constants.TEST_AWAIT_TRANSACTION_MS,
            );
            return expectRevertOrAlwaysFailingTransaction(
                tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(address, { from: owner }),
            );
        });
    });

    describe('removeAuthorizedAddress', () => {
        it('should throw if not called by owner', async () => {
            await web3Wrapper.awaitTransactionMinedAsync(
                await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(address, { from: owner }),
                constants.TEST_AWAIT_TRANSACTION_MS,
            );
            return expectRevertOrAlwaysFailingTransaction(
                tokenTransferProxy.removeAuthorizedAddress.sendTransactionAsync(address, {
                    from: notOwner,
                }),
            );
        });

        it('should allow owner to remove an authorized address', async () => {
            await web3Wrapper.awaitTransactionMinedAsync(
                await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(address, { from: owner }),
                constants.TEST_AWAIT_TRANSACTION_MS,
            );
            await web3Wrapper.awaitTransactionMinedAsync(
                await tokenTransferProxy.removeAuthorizedAddress.sendTransactionAsync(address, {
                    from: owner,
                }),
                constants.TEST_AWAIT_TRANSACTION_MS,
            );
            const isAuthorized = await tokenTransferProxy.authorized.callAsync(address);
            expect(isAuthorized).to.be.false();
        });

        it('should throw if owner attempts to remove an address that is not authorized', async () => {
            return expectRevertOrAlwaysFailingTransaction(
                tokenTransferProxy.removeAuthorizedAddress.sendTransactionAsync(address, {
                    from: owner,
                }),
            );
        });
    });

    describe('getAuthorizedAddresses', () => {
        it('should return all authorized addresses', async () => {
            const initial = await tokenTransferProxy.getAuthorizedAddresses.callAsync();
            expect(initial).to.have.length(0);
            await web3Wrapper.awaitTransactionMinedAsync(
                await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(address, {
                    from: owner,
                }),
                constants.TEST_AWAIT_TRANSACTION_MS,
            );
            const afterAdd = await tokenTransferProxy.getAuthorizedAddresses.callAsync();
            expect(afterAdd).to.have.length(1);
            expect(afterAdd).to.include(address);

            await web3Wrapper.awaitTransactionMinedAsync(
                await tokenTransferProxy.removeAuthorizedAddress.sendTransactionAsync(address, {
                    from: owner,
                }),
                constants.TEST_AWAIT_TRANSACTION_MS,
            );
            const afterRemove = await tokenTransferProxy.getAuthorizedAddresses.callAsync();
            expect(afterRemove).to.have.length(0);
        });
    });
});
