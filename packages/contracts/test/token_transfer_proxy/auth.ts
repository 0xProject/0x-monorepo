import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import * as Web3 from 'web3';

import { constants } from '../../util/constants';
import { ContractName } from '../../util/types';
import { chaiSetup } from '../utils/chai_setup';
import { deployer } from '../utils/deployer';

chaiSetup.configure();
const expect = chai.expect;
const web3 = web3Factory.create();
const web3Wrapper = new Web3Wrapper(web3.currentProvider);
const blockchainLifecycle = new BlockchainLifecycle();

describe('TokenTransferProxy', () => {
    let owner: string;
    let notOwner: string;
    let address: string;
    let tokenTransferProxy: Web3.ContractInstance;
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = address = accounts[0];
        notOwner = accounts[1];
        tokenTransferProxy = await deployer.deployAsync(ContractName.TokenTransferProxy);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('addAuthorizedAddress', () => {
        it('should throw if not called by owner', async () => {
            return expect(tokenTransferProxy.addAuthorizedAddress(notOwner, { from: notOwner })).to.be.rejectedWith(
                constants.REVERT,
            );
        });
        it('should allow owner to add an authorized address', async () => {
            await tokenTransferProxy.addAuthorizedAddress(address, { from: owner });
            const isAuthorized = await tokenTransferProxy.authorized(address);
            expect(isAuthorized).to.be.true();
        });
        it('should throw if owner attempts to authorize a duplicate address', async () => {
            await tokenTransferProxy.addAuthorizedAddress(address, { from: owner });
            return expect(tokenTransferProxy.addAuthorizedAddress(address, { from: owner })).to.be.rejectedWith(
                constants.REVERT,
            );
        });
    });

    describe('removeAuthorizedAddress', () => {
        it('should throw if not called by owner', async () => {
            await tokenTransferProxy.addAuthorizedAddress(address, { from: owner });
            return expect(
                tokenTransferProxy.removeAuthorizedAddress(address, {
                    from: notOwner,
                }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should allow owner to remove an authorized address', async () => {
            await tokenTransferProxy.addAuthorizedAddress(address, { from: owner });
            await tokenTransferProxy.removeAuthorizedAddress(address, {
                from: owner,
            });
            const isAuthorized = await tokenTransferProxy.authorized(address);
            expect(isAuthorized).to.be.false();
        });

        it('should throw if owner attempts to remove an address that is not authorized', async () => {
            return expect(
                tokenTransferProxy.removeAuthorizedAddress(address, {
                    from: owner,
                }),
            ).to.be.rejectedWith(constants.REVERT);
        });
    });

    describe('getAuthorizedAddresses', () => {
        it('should return all authorized addresses', async () => {
            const initial = await tokenTransferProxy.getAuthorizedAddresses();
            expect(initial).to.have.length(0);
            await tokenTransferProxy.addAuthorizedAddress(address, {
                from: owner,
            });
            const afterAdd = await tokenTransferProxy.getAuthorizedAddresses();
            expect(afterAdd).to.have.length(1);
            expect(afterAdd).to.include(address);

            await tokenTransferProxy.removeAuthorizedAddress(address, {
                from: owner,
            });
            const afterRemove = await tokenTransferProxy.getAuthorizedAddresses();
            expect(afterRemove).to.have.length(0);
        });
    });
});
