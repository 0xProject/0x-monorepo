import * as chai from 'chai';

import {constants} from '../../../util/constants';
import {ContractInstance} from '../../../util/types';
import {chaiSetup} from '../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;
const TokenTransferProxy = artifacts.require('./db/TokenTransferProxy.sol');

contract('TokenTransferProxy', (accounts: string[]) => {
    const owner = accounts[0];
    const notOwner = accounts[1];

    let tokenTransferProxy: ContractInstance;
    let authorized: string;
    let notAuthorized = owner;

    before(async () => {
        tokenTransferProxy = await TokenTransferProxy.deployed();
    });

    describe('addAuthorizedAddress', () => {
        it('should throw if not called by owner', async () => {
            return expect(tokenTransferProxy.addAuthorizedAddress(notOwner, {from: notOwner}))
                .to.be.rejectedWith(constants.REVERT);
        });

        it('should allow owner to add an authorized address', async () => {
            await tokenTransferProxy.addAuthorizedAddress(notAuthorized, {from: owner});
            authorized = notAuthorized;
            notAuthorized = null;
            const isAuthorized = await tokenTransferProxy.authorized.call(authorized);
            expect(isAuthorized).to.be.true();
        });

        it('should throw if owner attempts to authorize a duplicate address', async () => {
            return expect(tokenTransferProxy.addAuthorizedAddress(authorized, {from: owner}))
                .to.be.rejectedWith(constants.REVERT);
        });
    });

    describe('removeAuthorizedAddress', () => {
        it('should throw if not called by owner', async () => {
            return expect(tokenTransferProxy.removeAuthorizedAddress(authorized, {from: notOwner}))
                .to.be.rejectedWith(constants.REVERT);
        });

        it('should allow owner to remove an authorized address', async () => {
            await tokenTransferProxy.removeAuthorizedAddress(authorized, {from: owner});
            notAuthorized = authorized;
            authorized = null;

            const isAuthorized = await tokenTransferProxy.authorized.call(notAuthorized);
            expect(isAuthorized).to.be.false();
        });

        it('should throw if owner attempts to remove an address that is not authorized', async () => {
            return expect(tokenTransferProxy.removeAuthorizedAddress(notAuthorized, {from: owner}))
                .to.be.rejectedWith(constants.REVERT);
        });
    });

    describe('getAuthorizedAddresses', () => {
        it('should return all authorized addresses', async () => {
            const initial = await tokenTransferProxy.getAuthorizedAddresses();
            expect(initial).to.have.length(1);
            await tokenTransferProxy.addAuthorizedAddress(notAuthorized, {from: owner});

            authorized = notAuthorized;
            notAuthorized = null;
            const afterAdd = await tokenTransferProxy.getAuthorizedAddresses();
            expect(afterAdd).to.have.length(2);
            expect(afterAdd).to.include(authorized);

            await tokenTransferProxy.removeAuthorizedAddress(authorized, {from: owner});
            notAuthorized = authorized;
            authorized = null;
            const afterRemove = await tokenTransferProxy.getAuthorizedAddresses();
            expect(afterRemove).to.have.length(1);
        });
    });
});
