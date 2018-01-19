import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import * as Web3 from 'web3';

import { Artifacts } from '../../util/artifacts';
import { Balances } from '../../util/balances';
import { constants } from '../../util/constants';
import { ContractInstance } from '../../util/types';
import { chaiSetup } from '../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;
const { TokenTransferProxy, DummyToken, TokenRegistry } = new Artifacts(artifacts);
// In order to benefit from type-safety, we re-assign the global web3 instance injected by Truffle
// with type `any` to a variable of type `Web3`.
const web3: Web3 = (global as any).web3;
const blockchainLifecycle = new BlockchainLifecycle(constants.RPC_URL);

describe('TokenTransferProxy', () => {
    const web3Wrapper = new Web3Wrapper(web3.currentProvider);
    let accounts: string[];
    let owner: string;
    let notAuthorized: string;
    const INIT_BAL = 100000000;
    const INIT_ALLOW = 100000000;

    let tokenTransferProxy: ContractInstance;
    let tokenRegistry: ContractInstance;
    let rep: ContractInstance;
    let dmyBalances: Balances;

    before(async () => {
        accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = notAuthorized = accounts[0];
        [tokenTransferProxy, tokenRegistry] = await Promise.all([
            TokenTransferProxy.deployed(),
            TokenRegistry.deployed(),
        ]);
        const repAddress = await tokenRegistry.getTokenAddressBySymbol('REP');
        rep = DummyToken.at(repAddress);

        dmyBalances = new Balances([rep], [accounts[0], accounts[1]]);
        await Promise.all([
            rep.approve(TokenTransferProxy.address, INIT_ALLOW, {
                from: accounts[0],
            }),
            rep.setBalance(accounts[0], INIT_BAL, { from: owner }),
            rep.approve(TokenTransferProxy.address, INIT_ALLOW, {
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
