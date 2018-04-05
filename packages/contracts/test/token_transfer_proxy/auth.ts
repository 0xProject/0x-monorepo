import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import * as Web3 from 'web3';

import { TokenTransferProxyContract } from '../../src/contract_wrappers/generated/token_transfer_proxy';
import { constants } from '../../util/constants';
import { ContractName } from '../../util/types';
import { chaiSetup } from '../utils/chai_setup';
import { deployer } from '../utils/deployer';
import { provider, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('TokenTransferProxy', () => {
    let owner: string;
    let notOwner: string;
    let address: string;
    let tokenTransferProxy: TokenTransferProxyContract;
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = address = accounts[0];
        notOwner = accounts[1];
        const tokenTransferProxyInstance = await deployer.deployAsync(ContractName.TokenTransferProxy);
        tokenTransferProxy = new TokenTransferProxyContract(
            tokenTransferProxyInstance.abi,
            tokenTransferProxyInstance.address,
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
                tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(notOwner, { from: notOwner }),
            ).to.be.rejectedWith(constants.REVERT);
        });
        it('should allow owner to add an authorized address', async () => {
            await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(address, { from: owner });
            const isAuthorized = await tokenTransferProxy.authorized.callAsync(address);
            expect(isAuthorized).to.be.true();
        });
        it('should throw if owner attempts to authorize a duplicate address', async () => {
            await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(address, { from: owner });
            return expect(
                tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(address, { from: owner }),
            ).to.be.rejectedWith(constants.REVERT);
        });
    });

    describe('removeAuthorizedAddress', () => {
        it('should throw if not called by owner', async () => {
            await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(address, { from: owner });
            return expect(
                tokenTransferProxy.removeAuthorizedAddress.sendTransactionAsync(address, {
                    from: notOwner,
                }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should allow owner to remove an authorized address', async () => {
            await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(address, { from: owner });
            await tokenTransferProxy.removeAuthorizedAddress.sendTransactionAsync(address, {
                from: owner,
            });
            const isAuthorized = await tokenTransferProxy.authorized.callAsync(address);
            expect(isAuthorized).to.be.false();
        });

        it('should throw if owner attempts to remove an address that is not authorized', async () => {
            return expect(
                tokenTransferProxy.removeAuthorizedAddress.sendTransactionAsync(address, {
                    from: owner,
                }),
            ).to.be.rejectedWith(constants.REVERT);
        });
    });

    describe('getAuthorizedAddresses', () => {
        it('should return all authorized addresses', async () => {
            const initial = await tokenTransferProxy.getAuthorizedAddresses.callAsync();
            expect(initial).to.have.length(0);
            await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(address, {
                from: owner,
            });
            const afterAdd = await tokenTransferProxy.getAuthorizedAddresses.callAsync();
            expect(afterAdd).to.have.length(1);
            expect(afterAdd).to.include(address);

            await tokenTransferProxy.removeAuthorizedAddress.sendTransactionAsync(address, {
                from: owner,
            });
            const afterRemove = await tokenTransferProxy.getAuthorizedAddresses.callAsync();
            expect(afterRemove).to.have.length(0);
        });
    });
});
