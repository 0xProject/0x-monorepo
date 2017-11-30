import * as chai from 'chai';

import {Artifacts} from '../../../util/artifacts';
import {Balances} from '../../../util/balances';
import {constants} from '../../../util/constants';
import {ContractInstance} from '../../../util/types';
import {chaiSetup} from '../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;
const {
    TokenTransferProxy,
    DummyToken,
    TokenRegistry,
} = new Artifacts(artifacts);

contract('TokenTransferProxy', (accounts: string[]) => {
    const INIT_BAL = 100000000;
    const INIT_ALLOW = 100000000;

    const owner = accounts[0];
    const notAuthorized = owner;

    let tokenTransferProxy: ContractInstance;
    let tokenRegistry: ContractInstance;
    let rep: ContractInstance;
    let dmyBalances: Balances;

    before(async () => {
        [tokenTransferProxy, tokenRegistry] = await Promise.all([
            TokenTransferProxy.deployed(),
            TokenRegistry.deployed(),
        ]);
        const repAddress = await tokenRegistry.getTokenAddressBySymbol('REP');
        rep = DummyToken.at(repAddress);

        dmyBalances = new Balances([rep], [accounts[0], accounts[1]]);
        await Promise.all([
            rep.approve(TokenTransferProxy.address, INIT_ALLOW, {from: accounts[0]}),
            rep.setBalance(accounts[0], INIT_BAL, {from: owner}),
            rep.approve(TokenTransferProxy.address, INIT_ALLOW, {from: accounts[1]}),
            rep.setBalance(accounts[1], INIT_BAL, {from: owner}),
        ]);
    });

    describe('transferFrom', () => {
        it('should throw when called by an unauthorized address', async () => {
            expect(tokenTransferProxy.transferFrom(rep.address, accounts[0], accounts[1], 1000, {from: notAuthorized}))
                .to.be.rejectedWith(constants.INVALID_OPCODE);
        });

        it('should allow an authorized address to transfer', async () => {
            const balances = await dmyBalances.getAsync();

            await tokenTransferProxy.addAuthorizedAddress(notAuthorized, {from: owner});
            const transferAmt = 10000;
            await tokenTransferProxy.transferFrom(rep.address, accounts[0], accounts[1],
                                                  transferAmt, {from: notAuthorized});

            const newBalances = await dmyBalances.getAsync();
            expect(newBalances[accounts[0]][rep.address])
                .to.be.bignumber.equal(balances[accounts[0]][rep.address].minus(transferAmt));
            expect(newBalances[accounts[1]][rep.address])
                .to.be.bignumber.equal(balances[accounts[1]][rep.address].add(transferAmt));
        });
    });
});
