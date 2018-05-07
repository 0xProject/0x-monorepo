import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import * as Web3 from 'web3';

import { DummyTokenContract } from '../../src/contract_wrappers/generated/dummy_token';
import { TokenTransferProxyContract } from '../../src/contract_wrappers/generated/token_transfer_proxy';
import { artifacts } from '../../util/artifacts';
import { Balances } from '../../util/balances';
import { constants } from '../../util/constants';
import { ContractName } from '../../util/types';
import { chaiSetup } from '../utils/chai_setup';

import { defaults, provider, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('TokenTransferProxy', () => {
    let accounts: string[];
    let owner: string;
    let notAuthorized: string;
    const INIT_BAL = new BigNumber(100000000);
    const INIT_ALLOW = new BigNumber(100000000);

    let tokenTransferProxy: TokenTransferProxyContract;
    let rep: DummyTokenContract;
    let dmyBalances: Balances;

    before(async () => {
        accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = notAuthorized = accounts[0];
        tokenTransferProxy = await TokenTransferProxyContract.deploy0xArtifactAsync(
            artifacts.TokenTransferProxy,
            provider,
            defaults,
        );
        rep = await DummyTokenContract.deploy0xArtifactAsync(
            artifacts.DummyToken,
            provider,
            defaults,
            constants.DUMMY_TOKEN_NAME,
            constants.DUMMY_TOKEN_SYMBOL,
            constants.DUMMY_TOKEN_DECIMALS,
            constants.DUMMY_TOKEN_TOTAL_SUPPLY,
        );
        dmyBalances = new Balances([rep], [accounts[0], accounts[1]]);
        await Promise.all([
            rep.approve.sendTransactionAsync(tokenTransferProxy.address, INIT_ALLOW, {
                from: accounts[0],
            }),
            rep.setBalance.sendTransactionAsync(accounts[0], INIT_BAL, { from: owner }),
            rep.approve.sendTransactionAsync(tokenTransferProxy.address, INIT_ALLOW, {
                from: accounts[1],
            }),
            rep.setBalance.sendTransactionAsync(accounts[1], INIT_BAL, { from: owner }),
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
                tokenTransferProxy.transferFrom.sendTransactionAsync(
                    rep.address,
                    accounts[0],
                    accounts[1],
                    new BigNumber(1000),
                    {
                        from: notAuthorized,
                    },
                ),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should allow an authorized address to transfer', async () => {
            const balances = await dmyBalances.getAsync();

            await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(notAuthorized, {
                from: owner,
            });
            const transferAmt = new BigNumber(10000);
            await tokenTransferProxy.transferFrom.sendTransactionAsync(
                rep.address,
                accounts[0],
                accounts[1],
                transferAmt,
                {
                    from: notAuthorized,
                },
            );

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
