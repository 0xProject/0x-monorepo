import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import * as Web3 from 'web3';

import { AssetProxyDispatcherContract } from '../../src/contract_wrappers/generated/asset_proxy_dispatcher';
import { constants } from '../../src/utils/constants';
import { ContractName } from '../../src/utils/types';
import { chaiSetup } from '../utils/chai_setup';
import { deployer } from '../utils/deployer';
import { provider, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('AssetProxyDispatcher (Authorization Methods)', () => {
    let owner: string;
    let notOwner: string;
    let address: string;
    let assetProxyDispatcher: AssetProxyDispatcherContract;
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = address = accounts[0];
        notOwner = accounts[1];
        const assetProxyDispatcherInstance = await deployer.deployAsync(ContractName.AssetProxyDispatcher);
        assetProxyDispatcher = new AssetProxyDispatcherContract(
            assetProxyDispatcherInstance.abi,
            assetProxyDispatcherInstance.address,
            provider,
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
                assetProxyDispatcher.addAuthorizedAddress.sendTransactionAsync(notOwner, { from: notOwner }),
            ).to.be.rejectedWith(constants.REVERT);
        });
        it('should allow owner to add an authorized address', async () => {
            await assetProxyDispatcher.addAuthorizedAddress.sendTransactionAsync(address, { from: owner });
            const isAuthorized = await assetProxyDispatcher.authorized.callAsync(address);
            expect(isAuthorized).to.be.true();
        });
        it('should throw if owner attempts to authorize a duplicate address', async () => {
            await assetProxyDispatcher.addAuthorizedAddress.sendTransactionAsync(address, { from: owner });
            return expect(
                assetProxyDispatcher.addAuthorizedAddress.sendTransactionAsync(address, { from: owner }),
            ).to.be.rejectedWith(constants.REVERT);
        });
    });

    describe('removeAuthorizedAddress', () => {
        it('should throw if not called by owner', async () => {
            await assetProxyDispatcher.addAuthorizedAddress.sendTransactionAsync(address, { from: owner });
            return expect(
                assetProxyDispatcher.removeAuthorizedAddress.sendTransactionAsync(address, {
                    from: notOwner,
                }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should allow owner to remove an authorized address', async () => {
            await assetProxyDispatcher.addAuthorizedAddress.sendTransactionAsync(address, { from: owner });
            await assetProxyDispatcher.removeAuthorizedAddress.sendTransactionAsync(address, {
                from: owner,
            });
            const isAuthorized = await assetProxyDispatcher.authorized.callAsync(address);
            expect(isAuthorized).to.be.false();
        });

        it('should throw if owner attempts to remove an address that is not authorized', async () => {
            return expect(
                assetProxyDispatcher.removeAuthorizedAddress.sendTransactionAsync(address, {
                    from: owner,
                }),
            ).to.be.rejectedWith(constants.REVERT);
        });
    });

    describe('getAuthorizedAddresses', () => {
        it('should return all authorized addresses', async () => {
            const initial = await assetProxyDispatcher.getAuthorizedAddresses.callAsync();
            expect(initial).to.have.length(0);
            await assetProxyDispatcher.addAuthorizedAddress.sendTransactionAsync(address, {
                from: owner,
            });
            const afterAdd = await assetProxyDispatcher.getAuthorizedAddresses.callAsync();
            expect(afterAdd).to.have.length(1);
            expect(afterAdd).to.include(address);

            await assetProxyDispatcher.removeAuthorizedAddress.sendTransactionAsync(address, {
                from: owner,
            });
            const afterRemove = await assetProxyDispatcher.getAuthorizedAddresses.callAsync();
            expect(afterRemove).to.have.length(0);
        });
    });
});
