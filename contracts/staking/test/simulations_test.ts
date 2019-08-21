import { ERC20ProxyContract, ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { chaiSetup, expectTransactionFailedAsync, provider, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { Simulation } from './utils/Simulation';
import { StakingWrapper } from './utils/staking_wrapper';
chaiSetup.configure();
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
// tslint:disable:no-unnecessary-type-assertion
describe('End-To-End Simulations', () => {
    // constants
    const ZRX_TOKEN_DECIMALS = new BigNumber(18);
    // tokens & addresses
    let accounts: string[];
    let owner: string;
    let exchange: string;
    let users: string[];
    let zrxTokenContract: DummyERC20TokenContract;
    let erc20ProxyContract: ERC20ProxyContract;
    // wrappers
    let stakingWrapper: StakingWrapper;
    let erc20Wrapper: ERC20Wrapper;
    // tests
    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        // create accounts
        accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = accounts[0];
        exchange = accounts[1];
        users = accounts.slice(2);
        users = [...users, ...users]; // @TODO figure out how to get more addresses from `web3Wrapper`

        // deploy erc20 proxy
        erc20Wrapper = new ERC20Wrapper(provider, accounts, owner);
        erc20ProxyContract = await erc20Wrapper.deployProxyAsync();
        // deploy zrx token
        [zrxTokenContract] = await erc20Wrapper.deployDummyTokensAsync(1, ZRX_TOKEN_DECIMALS);
        await erc20Wrapper.setBalancesAndAllowancesAsync();
        // deploy staking contracts
        stakingWrapper = new StakingWrapper(provider, owner, erc20ProxyContract, zrxTokenContract, accounts);
        await stakingWrapper.deployAndConfigureContractsAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('Simulations', () => {
        it('Should successfully simulate (no delegators / no shadow balances)', async () => {
            // @TODO - get computations more accurate
            const simulationParams = {
                users,
                numberOfPools: 3,
                poolOperatorShares: [100, 100, 100],
                stakeByPoolOperator: [
                    StakingWrapper.toBaseUnitAmount(42),
                    StakingWrapper.toBaseUnitAmount(84),
                    StakingWrapper.toBaseUnitAmount(97),
                ],
                numberOfMakers: 6,
                numberOfMakersPerPool: [1, 2, 3],
                protocolFeesByMaker: [
                    // pool 1
                    StakingWrapper.toBaseUnitAmount(0.304958),
                    // pool 2
                    StakingWrapper.toBaseUnitAmount(3.2),
                    StakingWrapper.toBaseUnitAmount(12.123258),
                    // pool 3
                    StakingWrapper.toBaseUnitAmount(23.577),
                    StakingWrapper.toBaseUnitAmount(4.54522236),
                    StakingWrapper.toBaseUnitAmount(0),
                ],
                numberOfDelegators: 0,
                numberOfDelegatorsPerPool: [0, 0, 0],
                stakeByDelegator: [],
                delegateInNextEpoch: false, // no shadow eth
                withdrawByUndelegating: false, // profits are withdrawn without undelegating
                expectedFeesByPool: [
                    StakingWrapper.toBaseUnitAmount(0.304958),
                    StakingWrapper.toBaseUnitAmount(15.323258),
                    StakingWrapper.toBaseUnitAmount(28.12222236),
                ],
                expectedPayoutByPool: [
                    new BigNumber('4.75677'), // 4.756772362932728793619590327361600155564384201215274334070
                    new BigNumber('16.28130'), // 16.28130500394935316563988584956596823402223838026190634525
                    new BigNumber('20.31028'), // 20.31028447343014834523983759032242063760612769662934308289
                ],
                expectedPayoutByPoolOperator: [
                    new BigNumber('4.75677'), // 4.756772362932728793619590327361600155564384201215274334070
                    new BigNumber('16.28130'), // 16.28130500394935316563988584956596823402223838026190634525
                    new BigNumber('20.31028'), // 20.31028447343014834523983759032242063760612769662934308289
                ],
                expectedMembersPayoutByPool: [new BigNumber('0'), new BigNumber('0'), new BigNumber('0')],
                expectedPayoutByDelegator: [],
                exchangeAddress: exchange,
            };
            const simulator = new Simulation(stakingWrapper, simulationParams);
            await simulator.runAsync();
        });

        it('Should successfully simulate (delegators withdraw by undeleating / no shadow balances)', async () => {
            // @TODO - get computations more accurate
            /*
\           // the expected payouts were computed by hand
            // @TODO - get computations more accurate
                Pool | Total Fees  | Total Stake | Total Delegated Stake | Total Stake (Weighted) | Payout
                0    |  0.304958   | 42          | 0                     | 42                     | 3.0060373...
                1    | 15.323258   | 84          | 0                     | 84                     |
                3    | 28.12222236 | 97          | 182                   | 260.8
                ...
                Cumulative Fees = 43.75043836
                Cumulative Weighted Stake = 386.8
                Total Rewards = 43.75043836
            */
            const simulationParams = {
                users,
                numberOfPools: 3,
                poolOperatorShares: [39, 59, 43],
                stakeByPoolOperator: [
                    StakingWrapper.toBaseUnitAmount(42),
                    StakingWrapper.toBaseUnitAmount(84),
                    StakingWrapper.toBaseUnitAmount(97),
                ],
                numberOfMakers: 6,
                numberOfMakersPerPool: [1, 2, 3],
                protocolFeesByMaker: [
                    // pool 1
                    StakingWrapper.toBaseUnitAmount(0.304958),
                    // pool 2
                    StakingWrapper.toBaseUnitAmount(3.2),
                    StakingWrapper.toBaseUnitAmount(12.123258),
                    // pool 3
                    StakingWrapper.toBaseUnitAmount(23.577),
                    StakingWrapper.toBaseUnitAmount(4.54522236),
                    StakingWrapper.toBaseUnitAmount(0),
                ],
                numberOfDelegators: 3,
                numberOfDelegatorsPerPool: [0, 0, 3],
                stakeByDelegator: [
                    StakingWrapper.toBaseUnitAmount(17),
                    StakingWrapper.toBaseUnitAmount(75),
                    StakingWrapper.toBaseUnitAmount(90),
                ],
                delegateInNextEpoch: false, // delegated stake is included in payout computation + no shadow ether
                withdrawByUndelegating: false, // profits are withdrawn without undelegating
                expectedFeesByPool: [
                    StakingWrapper.toBaseUnitAmount(0.304958),
                    StakingWrapper.toBaseUnitAmount(15.323258),
                    StakingWrapper.toBaseUnitAmount(28.12222236),
                ],
                expectedPayoutByPool: [
                    new BigNumber('3.00603'), // 3.006037310109530277237724562632303034914024715508955780682
                    new BigNumber('10.28895'), // 10.28895363598396754741643198605226143579652264694121578135
                    new BigNumber('29.26472'), // 29.26473180250053106672049765968527817034954761113582833460
                ],
                expectedPayoutByPoolOperator: [
                    new BigNumber('1.17235'), // 0.39 * 3.00603
                    new BigNumber('6.07048'), // 0.59 * 10.28895
                    new BigNumber('12.58383'), // 0.43 * 29.26472
                ],
                expectedMembersPayoutByPool: [
                    new BigNumber('1.83368'), // (1 - 0.39) * 3.00603
                    new BigNumber('4.21847'), // (1 - 0.59) * 10.28895
                    new BigNumber('16.68089'), // (1 - 0.43) * 29.26472
                ],
                expectedPayoutByDelegator: [
                    // note that the on-chain values may be slightly different due to rounding down on each entry
                    // there is a carry over between calls, which we account for here. the result is that delegators
                    // who withdraw later on will scoop up any rounding spillover from those who have already withdrawn.
                    new BigNumber('1.55810'), // (17 / 182) * 16.6809
                    new BigNumber('6.87399'), // (75 / 182) * 16.6809
                    new BigNumber('8.24879'), // (90 / 182) * 16.6809
                ],
                exchangeAddress: exchange,
            };
            const simulator = new Simulation(stakingWrapper, simulationParams);
            await simulator.runAsync();
        });

        it('Should successfully simulate (delegators withdraw by undelegating / includes shadow balances / delegators enter after reward payouts)', async () => {
            // @TODO - get computations more accurate
            /*
                Pool | Total Fees  | Total Stake | Total Delegated Stake | Total Stake (Scaled)
                0    |  0.304958   | 42          | 0                     | 42
                1    | 15.323258   | 84          | 0                     | 84
                3    | 28.12222236 | 97          | 182                   | 260.8
                ...
                Cumulative Fees = 43.75043836
                Cumulative Weighted Stake = 386.8
                Total Rewards = 43.75043836

                // In this case, there was already a pot of ETH in the delegator pool that nobody had claimed.
                // The first delegator got to claim it all. This is due to the necessary conservation of payouts.
                // When a new delegator arrives, their new stake should not affect existing delegator payouts.
                // In this case, there was unclaimed $$ in the delegator pool - which is claimed by the first delegator.
            */
            const simulationParams = {
                users,
                numberOfPools: 3,
                poolOperatorShares: [39, 59, 43],
                stakeByPoolOperator: [
                    StakingWrapper.toBaseUnitAmount(42),
                    StakingWrapper.toBaseUnitAmount(84),
                    StakingWrapper.toBaseUnitAmount(97),
                ],
                numberOfMakers: 6,
                numberOfMakersPerPool: [1, 2, 3],
                protocolFeesByMaker: [
                    // pool 1
                    StakingWrapper.toBaseUnitAmount(0.304958),
                    // pool 2
                    StakingWrapper.toBaseUnitAmount(3.2),
                    StakingWrapper.toBaseUnitAmount(12.123258),
                    // pool 3
                    StakingWrapper.toBaseUnitAmount(23.577),
                    StakingWrapper.toBaseUnitAmount(4.54522236),
                    StakingWrapper.toBaseUnitAmount(0),
                ],
                numberOfDelegators: 3,
                numberOfDelegatorsPerPool: [0, 0, 3],
                stakeByDelegator: [
                    StakingWrapper.toBaseUnitAmount(17),
                    StakingWrapper.toBaseUnitAmount(75),
                    StakingWrapper.toBaseUnitAmount(90),
                ],
                delegateInNextEpoch: true, // delegated stake is included in payout computation + forces shadow eth
                withdrawByUndelegating: true, // profits are withdrawn as result of undelegating
                expectedFeesByPool: [
                    StakingWrapper.toBaseUnitAmount(0.304958),
                    StakingWrapper.toBaseUnitAmount(15.323258),
                    StakingWrapper.toBaseUnitAmount(28.12222236),
                ],
                expectedPayoutByPool: [
                    new BigNumber('4.75677'), // 4.756772362932728793619590327361600155564384201215274334070
                    new BigNumber('16.28130'), // 16.28130500394935316563988584956596823402223838026190634525
                    new BigNumber('20.31028'), // 20.31028447343014834523983759032242063760612769662934308289
                ],
                expectedPayoutByPoolOperator: [
                    new BigNumber('1.85514'), // 0.39 * 4.75677
                    new BigNumber('9.60597'), // 0.59 * 16.28130
                    new BigNumber('8.73342'), // 0.43 * 20.31028
                ],
                expectedMembersPayoutByPool: [
                    new BigNumber('2.90163'), // (1 - 0.39) * 4.75677
                    new BigNumber('6.67533'), // (1 - 0.59) * 16.28130
                    new BigNumber('11.57686'), // (1 - 0.43) * 20.31028
                ],
                expectedPayoutByDelegator: [
                    new BigNumber('11.57686'), // (1 - 0.43) * 20.31028
                    new BigNumber(0),
                    new BigNumber(0),
                ],
                exchangeAddress: exchange,
            };
            const simulator = new Simulation(stakingWrapper, simulationParams);
            await simulator.runAsync();
        });

        it('Should successfully simulate (delegators withdraw without undelegating / includes shadow balances / delegators enter after reward payouts)', async () => {
            // @TODO - get computations more accurate
            /*
                Pool | Total Fees  | Total Stake | Total Delegated Stake | Total Stake (Scaled)
                0    |  0.304958   | 42          | 0                     | 42
                1    | 15.323258   | 84          | 0                     | 84
                3    | 28.12222236 | 97          | 182                   | 260.8
                ...
                Cumulative Fees = 43.75043836
                Cumulative Weighted Stake = 386.8
                Total Rewards = 43.75043836

                // In this case, there was already a pot of ETH in the delegator pool that nobody had claimed.
                // The first delegator got to claim it all. This is due to the necessary conservation of payouts.
                // When a new delegator arrives, their new stake should not affect existing delegator payouts.
                // In this case, there was unclaimed $$ in the delegator pool - which is claimed by the first delegator.
            */
            const simulationParams = {
                users,
                numberOfPools: 3,
                poolOperatorShares: [39, 59, 43],
                stakeByPoolOperator: [
                    StakingWrapper.toBaseUnitAmount(42),
                    StakingWrapper.toBaseUnitAmount(84),
                    StakingWrapper.toBaseUnitAmount(97),
                ],
                numberOfMakers: 6,
                numberOfMakersPerPool: [1, 2, 3],
                protocolFeesByMaker: [
                    // pool 1
                    StakingWrapper.toBaseUnitAmount(0.304958),
                    // pool 2
                    StakingWrapper.toBaseUnitAmount(3.2),
                    StakingWrapper.toBaseUnitAmount(12.123258),
                    // pool 3
                    StakingWrapper.toBaseUnitAmount(23.577),
                    StakingWrapper.toBaseUnitAmount(4.54522236),
                    StakingWrapper.toBaseUnitAmount(0),
                ],
                numberOfDelegators: 3,
                numberOfDelegatorsPerPool: [0, 0, 3],
                stakeByDelegator: [
                    StakingWrapper.toBaseUnitAmount(17),
                    StakingWrapper.toBaseUnitAmount(75),
                    StakingWrapper.toBaseUnitAmount(90),
                ],
                delegateInNextEpoch: true, // delegated stake is included in payout computation + forces shadow eth
                withdrawByUndelegating: false, // profits are withdrawn without undelegating
                expectedFeesByPool: [
                    StakingWrapper.toBaseUnitAmount(0.304958),
                    StakingWrapper.toBaseUnitAmount(15.323258),
                    StakingWrapper.toBaseUnitAmount(28.12222236),
                ],
                expectedPayoutByPool: [
                    new BigNumber('4.75677'), // 4.756772362932728793619590327361600155564384201215274334070
                    new BigNumber('16.28130'), // 16.28130500394935316563988584956596823402223838026190634525
                    new BigNumber('20.31028'), // 20.31028447343014834523983759032242063760612769662934308289
                ],
                expectedPayoutByPoolOperator: [
                    new BigNumber('1.85514'), // 0.39 * 4.75677
                    new BigNumber('9.60597'), // 0.59 * 16.28130
                    new BigNumber('8.73342'), // 0.43 * 20.31028
                ],
                expectedMembersPayoutByPool: [
                    new BigNumber('2.90163'), // (1 - 0.39) * 4.75677
                    new BigNumber('6.67533'), // (1 - 0.59) * 16.28130
                    new BigNumber('11.57686'), // (1 - 0.43) * 20.31028
                ],
                expectedPayoutByDelegator: [
                    new BigNumber('11.57686'), // (1 - 0.43) * 20.31028
                    new BigNumber(0),
                    new BigNumber(0),
                ],
                exchangeAddress: exchange,
            };
            const simulator = new Simulation(stakingWrapper, simulationParams);
            await simulator.runAsync();
        });

        it('Should not be able to record a protocol fee from an unknown exchange', async () => {
            const makerAddress = users[1];
            const protocolFee = new BigNumber(1);
            await expectTransactionFailedAsync(
                stakingWrapper.payProtocolFeeAsync(makerAddress, protocolFee, owner),
                RevertReason.OnlyCallableByExchange,
            );
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
