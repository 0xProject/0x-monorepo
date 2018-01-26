import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import * as Web3 from 'web3';

import { Balances } from '../../util/balances';
import { constants } from '../../util/constants';
import { ContractName } from '../../util/types';
import { chaiSetup } from '../utils/chai_setup';
import { deployer } from '../utils/deployer';

chaiSetup.configure();
const expect = chai.expect;
const web3 = web3Factory.create();
const web3Wrapper = new Web3Wrapper(web3.currentProvider);
const blockchainLifecycle = new BlockchainLifecycle(devConstants.RPC_URL);

describe('TokenTransferProxy', () => {
    let accounts: string[];
    let owner: string;
    let notAuthorized: string;
    const INIT_BAL = 100000000;
    const INIT_ALLOW = 100000000;

    let tokenTransferProxy: Web3.ContractInstance;
    let rep: Web3.ContractInstance;
    let dmyBalances: Balances;

    before(async () => {
        accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = notAuthorized = accounts[0];
        tokenTransferProxy = await deployer.deployAsync(ContractName.TokenTransferProxy);
        rep = await deployer.deployAsync(ContractName.DummyToken);

        dmyBalances = new Balances([rep], [accounts[0], accounts[1]]);
        await Promise.all([
            rep.approve(tokenTransferProxy.address, INIT_ALLOW, {
                from: accounts[0],
            }),
            rep.setBalance(accounts[0], INIT_BAL, { from: owner }),
            rep.approve(tokenTransferProxy.address, INIT_ALLOW, {
                from: accounts[1],
            }),
            rep.setBalance(accounts[1], INIT_BAL, { from: owner }),
        ]);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('transferFrom', () => {
        it('should throw when called by an unauthorized address', async () => {
            expect(
                tokenTransferProxy.transferFrom(rep.address, accounts[0], accounts[1], 1000, { from: notAuthorized }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should allow an authorized address to transfer', async () => {
            const balances = await dmyBalances.getAsync();

            await tokenTransferProxy.addAuthorizedAddress(notAuthorized, {
                from: owner,
            });
            const transferAmt = 10000;
            await tokenTransferProxy.transferFrom(rep.address, accounts[0], accounts[1], transferAmt, {
                from: notAuthorized,
            });

            const newBalances = await dmyBalances.getAsync();
            expect(newBalances[accounts[0]][rep.address]).to.be.bignumber.equal(
                balances[accounts[0]][rep.address].minus(transferAmt),
            );
            expect(newBalances[accounts[1]][rep.address]).to.be.bignumber.equal(
                balances[accounts[1]][rep.address].add(transferAmt),
            );
        });
    });
});
