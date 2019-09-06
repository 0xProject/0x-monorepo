/*
@TODO (hysz) - update once new staking mechanics are merged

import { ERC20ProxyContract, ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { blockchainTests, expect } from '@0x/contracts-test-utils';
import { StakingRevertErrors } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { Simulation } from './utils/Simulation';
import { StakingWrapper } from './utils/staking_wrapper';
// tslint:disable:no-unnecessary-type-assertion
blockchainTests('End-To-End Simulations', env => {
    // constants
    const ZRX_TOKEN_DECIMALS = new BigNumber(18);
    const PPM_ONE = 1e6;
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
        // create accounts
        accounts = await env.web3Wrapper.getAvailableAddressesAsync();
        owner = accounts[0];
        exchange = accounts[1];
        users = accounts.slice(2);
        users = [...users];

        // deploy erc20 proxy
        erc20Wrapper = new ERC20Wrapper(env.provider, accounts, owner);
        erc20ProxyContract = await erc20Wrapper.deployProxyAsync();
        // deploy zrx token
        [zrxTokenContract] = await erc20Wrapper.deployDummyTokensAsync(1, ZRX_TOKEN_DECIMALS);
        await erc20Wrapper.setBalancesAndAllowancesAsync();
        // deploy staking contracts
        stakingWrapper = new StakingWrapper(env.provider, owner, erc20ProxyContract, zrxTokenContract, accounts);
        await stakingWrapper.deployAndConfigureContractsAsync();
    });
    blockchainTests.resets('Simulations', () => {
        it('Should successfully simulate (no delegators / no shadow balances)', async () => {
            // @TODO - get computations more accurate
            const simulationParams = {
                users,
                numberOfPools: 3,
                poolOperatorShares: [100, 100, 100].map(v => (v / 100) * PPM_ONE),
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
                    new BigNumber('4.7567723629327287936195903273616'),
                    new BigNumber('16.281305003949353165639885849565'),
                    new BigNumber('20.310284473430148345239837590322'),
                ],
                expectedPayoutByPoolOperator: [
                    new BigNumber('4.7567723629327287936195903273616'),
                    new BigNumber('16.281305003949353165639885849565'),
                    new BigNumber('20.310284473430148345239837590322'),
                ],
                expectedMembersPayoutByPool: [new BigNumber('0'), new BigNumber('0'), new BigNumber('0')],
                expectedPayoutByDelegator: [],
                exchangeAddress: exchange,
            };
            const simulator = new Simulation(stakingWrapper, simulationParams);
            await simulator.runAsync();
        });

        it('Should successfully simulate (delegators withdraw by undelegating / no shadow balances)', async () => {
            // @TODO - get computations more accurate

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

            const simulationParams = {
                users,
                numberOfPools: 3,
                poolOperatorShares: [39, 59, 43].map(v => (v / 100) * PPM_ONE),
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
                    new BigNumber('3.0060373101095302067028699237670'),
                    new BigNumber('10.288953635983966866289393130525'),
                    new BigNumber('29.264731802500529663161540874979'),
                ],
                expectedPayoutByPoolOperator: [
                    new BigNumber('1.1723545509427168206625812850596'),
                    new BigNumber('6.0704826452305401312658116198463'),
                    new BigNumber('12.583834675075227560217188236544'),
                ],
                expectedMembersPayoutByPool: [
                    new BigNumber('1.8336827591668133860402886387074'),
                    new BigNumber('4.2184709907534267350235815106787'),
                    new BigNumber('16.680897127425302102944352638435'),
                ],
                expectedPayoutByDelegator: [
                    // note that the on-chain values may be slightly different due to rounding down on each entry
                    // there is a carry over between calls, which we account for here. the result is that delegators
                    // who withdraw later on will scoop up any rounding spillover from those who have already withdrawn.
                    new BigNumber('1.0163987496997496894870114443624'),
                    new BigNumber('4.4841121310283074536191681368932'),
                    new BigNumber('5.3809345572339689443430017642717'),
                ],
                exchangeAddress: exchange,
            };
            const simulator = new Simulation(stakingWrapper, simulationParams);
            await simulator.runAsync();
        });

        it('Should successfully simulate (delegators withdraw by undelegating / includes shadow balances / delegators enter after reward payouts)', async () => {
            // @TODO - get computations more accurate

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

            const simulationParams = {
                users,
                numberOfPools: 3,
                poolOperatorShares: [39, 59, 43].map(v => (v / 100) * PPM_ONE),
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
                    new BigNumber('4.7567723629327287476569912989141'),
                    new BigNumber('16.281305003949352312532097047985'),
                    new BigNumber('20.310284473430147203349271380151'),
                ],
                expectedPayoutByPoolOperator: [
                    new BigNumber('1.8551412215437642749591650093188'),
                    new BigNumber('9.6059699523301173582693060410895'),
                    new BigNumber('8.7334223235749631621465139389311'),
                ],
                expectedMembersPayoutByPool: [
                    new BigNumber('2.9016311413889644726978262895953'),
                    new BigNumber('6.6753350516192349542627910068955'),
                    new BigNumber('11.576862149855184041202757441220'),
                ],
                expectedPayoutByDelegator: [new BigNumber(0), new BigNumber(0), new BigNumber(0)],
                exchangeAddress: exchange,
            };
            const simulator = new Simulation(stakingWrapper, simulationParams);
            await simulator.runAsync();
        });

        it('Should successfully simulate (delegators withdraw without undelegating / includes shadow balances / delegators enter after reward payouts)', async () => {
            // @TODO - get computations more accurate

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

            const simulationParams = {
                users,
                numberOfPools: 3,
                poolOperatorShares: [39, 59, 43].map(v => (v / 100) * PPM_ONE),
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
                    new BigNumber('4.7567723629327287476569912989141'),
                    new BigNumber('16.281305003949352312532097047985'),
                    new BigNumber('20.310284473430147203349271380151'),
                ],
                expectedPayoutByPoolOperator: [
                    new BigNumber('1.8551412215437642749591650093188'),
                    new BigNumber('9.6059699523301173582693060410895'),
                    new BigNumber('8.7334223235749631621465139389311'),
                ],
                expectedMembersPayoutByPool: [
                    new BigNumber('2.9016311413889644726978262895953'),
                    new BigNumber('6.6753350516192349542627910068955'),
                    new BigNumber('11.576862149855184041202757441220'),
                ],
                expectedPayoutByDelegator: [new BigNumber(0), new BigNumber(0), new BigNumber(0)],
                exchangeAddress: exchange,
            };
            const simulator = new Simulation(stakingWrapper, simulationParams);
            await simulator.runAsync();
        });

        it('Should not be able to record a protocol fee from an unknown exchange', async () => {
            const makerAddress = users[1];
            const protocolFee = new BigNumber(1);
            // TODO(jalextowle) I need to update this test when I make my PR on adding protocol fees to the Staking contracts
            const revertError = new StakingRevertErrors.OnlyCallableByExchangeError(owner);
            const tx = stakingWrapper.payProtocolFeeAsync(makerAddress, makerAddress, protocolFee, protocolFee, owner);
            await expect(tx).to.revertWith(revertError);
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
*/
