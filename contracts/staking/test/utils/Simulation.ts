import { expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { DelegatorActor } from '../actors/delegator_actor';
import { MakerActor } from '../actors/maker_actor';
import { PoolOperatorActor } from '../actors/pool_operator_actor';

import { Queue } from './queue';
import { StakingWrapper } from './staking_wrapper';
import { SimulationParams } from './types';

const REWARD_PRECISION = 12;

export class Simulation {
    /*


    private readonly _stakingWrapper: StakingWrapper;
    private readonly _p: SimulationParams;
    private _userQueue: Queue<string>;
    private readonly _poolOperators: PoolOperatorActor[];
    private readonly _poolOperatorsAsDelegators: DelegatorActor[];
    private readonly _poolIds: string[];
    private readonly _makers: MakerActor[];
    private readonly _delegators: DelegatorActor[];

    private static _assertRewardsEqual(actual: BigNumber, expected: BigNumber, message?: string): void {
        expect(
            StakingWrapper.trimFloat(StakingWrapper.toFloatingPoint(actual, 18), REWARD_PRECISION),
            message,
        ).to.be.bignumber.equal(StakingWrapper.trimFloat(expected, REWARD_PRECISION));
    }

    constructor(stakingWrapper: StakingWrapper, simulationParams: SimulationParams) {
        this._stakingWrapper = stakingWrapper;
        this._p = simulationParams;
        this._userQueue = new Queue<string>();
        this._poolOperators = [];
        this._poolOperatorsAsDelegators = [];
        this._poolIds = [];
        this._makers = [];
        this._delegators = [];
    }

    public async runAsync(): Promise<void> {
        this._userQueue = new Queue<string>(this._p.users);
        await this._stakingWrapper.addExchangeAddressAsync(this._p.exchangeAddress);
        await this._setupPoolsAsync(this._p);
        await this._setupMakersAsync(this._p);
        await this._payProtocolFeesAsync(this._p);
        if (this._p.delegateInNextEpoch) {
            // this property forces the staking contracts to use shadow ether
            await this._stakingWrapper.skipToNextEpochAsync();
        }
        await this._setupDelegatorsAsync(this._p);
        await this._stakingWrapper.skipToNextEpochAsync();
        // everyone has been paid out into the vault. check balances.
        await this._assertVaultBalancesAsync(this._p);
        await this._withdrawRewardForStakingPoolMemberForOperatorsAsync(this._p);
        if (this._p.withdrawByUndelegating) {
            await this._withdrawRewardForStakingPoolMemberForDelegatorsAsync(this._p);
        } else {
            await this._withdrawRewardForStakingPoolMemberForDelegatorsByUndelegatingAsync(this._p);
        }

        // @TODO cleanup status and verify the staking contract is empty
    }

    private async _withdrawRewardForStakingPoolMemberForDelegatorsByUndelegatingAsync(
        p: SimulationParams,
    ): Promise<void> {
        let delegatorIdx = 0;
        let poolIdx = 0;
        for (const numberOfDelegatorsInPool of p.numberOfDelegatorsPerPool) {
            const poolId = this._poolIds[poolIdx];
            // tslint:disable-next-line no-unused-variable
            for (const j of _.range(numberOfDelegatorsInPool)) {
                const delegator = this._delegators[delegatorIdx];
                const delegatorAddress = delegator.getOwner();
                const amountOfStakeDelegated = p.stakeByDelegator[delegatorIdx];
                const initEthBalance = await this._stakingWrapper.getEthBalanceAsync(delegatorAddress);
                await delegator.deactivateAndTimeLockDelegatedStakeAsync(poolId, amountOfStakeDelegated);
                const finalEthBalance = await this._stakingWrapper.getEthBalanceAsync(delegatorAddress);
                const reward = finalEthBalance.minus(initEthBalance);
                const expectedReward = p.expectedPayoutByDelegator[delegatorIdx];
                Simulation._assertRewardsEqual(
                    reward,
                    expectedReward,
                    `reward withdrawn from pool ${poolId} for delegator ${delegatorAddress}`,
                );
                delegatorIdx += 1;
            }
            poolIdx += 1;
        }
    }

    private async _withdrawRewardForStakingPoolMemberForDelegatorsAsync(p: SimulationParams): Promise<void> {
        let delegatorIdx = 0;
        let poolIdx = 0;
        for (const numberOfDelegatorsInPool of p.numberOfDelegatorsPerPool) {
            const poolId = this._poolIds[poolIdx];
            // tslint:disable-next-line no-unused-variable
            for (const j of _.range(numberOfDelegatorsInPool)) {
                const delegator = this._delegators[delegatorIdx];
                const delegatorAddress = delegator.getOwner();
                const initEthBalance = await this._stakingWrapper.getEthBalanceAsync(delegatorAddress);
                await this._stakingWrapper.withdrawTotalRewardForStakingPoolMemberAsync(poolId, delegatorAddress);
                const finalEthBalance = await this._stakingWrapper.getEthBalanceAsync(delegatorAddress);
                const reward = finalEthBalance.minus(initEthBalance);
                const expectedReward = p.expectedPayoutByDelegator[delegatorIdx];
                Simulation._assertRewardsEqual(
                    reward,
                    expectedReward,
                    `reward withdrawn from pool ${poolId} for delegator ${delegatorAddress}`,
                );
                delegatorIdx += 1;
            }
            poolIdx += 1;
        }
    }

    private async _setupPoolsAsync(p: SimulationParams): Promise<void> {
        // tslint:disable-next-line no-unused-variable
        for (const i of _.range(p.numberOfPools)) {
            // create operator
            const poolOperatorAddress = this._userQueue.popFront();
            const poolOperator = new PoolOperatorActor(poolOperatorAddress, this._stakingWrapper);
            this._poolOperators.push(poolOperator);
            // create a pool id for this operator
            const poolId = await poolOperator.createStakingPoolAsync(p.poolOperatorShares[i]);
            this._poolIds.push(poolId);
            // each pool operator can also be a staker/delegator
            const poolOperatorAsDelegator = new DelegatorActor(poolOperatorAddress, this._stakingWrapper);
            this._poolOperatorsAsDelegators.push(poolOperatorAsDelegator);
            // add stake to the operator's pool
            const amountOfStake = p.stakeByPoolOperator[i];
            await poolOperatorAsDelegator.depositZrxAndDelegateToStakingPoolAsync(poolId, amountOfStake);
        }
    }

    private async _setupMakersAsync(p: SimulationParams): Promise<void> {
        // create makers
        // tslint:disable-next-line no-unused-variable
        for (const i of _.range(p.numberOfMakers)) {
            const makerAddress = this._userQueue.popFront();
            const maker = new MakerActor(makerAddress, this._stakingWrapper);
            this._makers.push(maker);
        }
        // add each maker to their respective pool
        let makerIdx = 0;
        let poolIdx = 0;
        for (const numberOfMakersInPool of p.numberOfMakersPerPool) {
            const poolId = this._poolIds[poolIdx];
            const poolOperator = this._poolOperators[poolIdx];
            // tslint:disable-next-line no-unused-variable
            for (const j of _.range(numberOfMakersInPool)) {
                const maker = this._makers[makerIdx];
                const makerApproval = maker.signApprovalForStakingPool(poolId);
                const makerAddress = maker.getOwner();
                await poolOperator.addMakerToStakingPoolAsync(poolId, makerAddress, makerApproval.signature);
                makerIdx += 1;
            }
            poolIdx += 1;
        }
    }

    private async _setupDelegatorsAsync(p: SimulationParams): Promise<void> {
        // create delegators
        // tslint:disable-next-line no-unused-variable
        for (const i of _.range(p.numberOfDelegators)) {
            const delegatorAddress = this._userQueue.popFront();
            const delegator = new DelegatorActor(delegatorAddress, this._stakingWrapper);
            this._delegators.push(delegator);
        }
        // delegate to pools
        // currently each actor delegates to a single pool
        let delegatorIdx = 0;
        let poolIdx = 0;
        for (const numberOfDelegatorsInPool of p.numberOfDelegatorsPerPool) {
            const poolId = this._poolIds[poolIdx];
            // tslint:disable-next-line no-unused-variable
            for (const j of _.range(numberOfDelegatorsInPool)) {
                const delegator = this._delegators[delegatorIdx];
                const amount = p.stakeByDelegator[delegatorIdx];
                await delegator.depositZrxAndDelegateToStakingPoolAsync(poolId, amount);
                delegatorIdx += 1;
            }
            poolIdx += 1;
        }
    }

    private async _payProtocolFeesAsync(p: SimulationParams): Promise<void> {
        // pay fees
        // tslint:disable-next-line no-unused-variable
        for (const i of _.range(this._makers.length)) {
            const maker = this._makers[i];
            const makerAddress = maker.getOwner();
            const feeAmount = p.protocolFeesByMaker[i];
            // TODO(jalextowle): I'll need to fix this once I make my PR on protocol fees. The arguments
            // I'm adding are just placeholders for now.
            await this._stakingWrapper.payProtocolFeeAsync(
                makerAddress,
                makerAddress,
                feeAmount,
                feeAmount,
                p.exchangeAddress,
            );
        }
        // validate fees per pool
        let expectedTotalFeesThisEpoch = new BigNumber(0);
        // tslint:disable-next-line no-unused-variable
        for (const i of _.range(this._poolIds.length)) {
            const poolId = this._poolIds[i];
            const expectedFees = p.expectedFeesByPool[i];
            const fees = await this._stakingWrapper.getProtocolFeesThisEpochByPoolAsync(poolId);
            expect(fees, `fees for pool ${poolId}`).to.be.bignumber.equal(expectedFees);
            expectedTotalFeesThisEpoch = expectedTotalFeesThisEpoch.plus(fees);
        }
        // validate total fees
        const totalFeesThisEpoch = await this._stakingWrapper.getTotalProtocolFeesThisEpochAsync();
        expect(expectedTotalFeesThisEpoch, 'total fees earned').to.be.bignumber.equal(totalFeesThisEpoch);
    }

    private async _assertVaultBalancesAsync(p: SimulationParams): Promise<void> {
        // tslint:disable-next-line no-unused-variable
        for (const i of _.range(p.numberOfPools)) {
            // @TODO -  we trim balances in here because payouts are accurate only to REWARD_PRECISION decimal places.
            //          update once more accurate.
            // check pool balance in vault
            const poolId = this._poolIds[i];
            const rewardVaultBalance = await this._stakingWrapper.rewardVaultBalanceOfAsync(poolId);
            const expectedRewardBalance = p.expectedPayoutByPool[i];
            Simulation._assertRewardsEqual(
                rewardVaultBalance,
                expectedRewardBalance,
                `expected balance in vault for pool with id ${poolId}`,
            );
            // check operator's balance
            const poolOperatorVaultBalance = await this._stakingWrapper.getRewardBalanceOfStakingPoolOperatorAsync(
                poolId,
            );
            const expectedPoolOperatorVaultBalance = p.expectedPayoutByPoolOperator[i];
            Simulation._assertRewardsEqual(
                poolOperatorVaultBalance,
                expectedPoolOperatorVaultBalance,
                `operator balance in vault for pool with id ${poolId}`,
            );
            // check balance of pool members
            const membersVaultBalance = await this._stakingWrapper.getRewardBalanceOfStakingPoolMembersAsync(poolId);
            const expectedMembersVaultBalance = p.expectedMembersPayoutByPool[i];
            Simulation._assertRewardsEqual(
                membersVaultBalance,
                expectedMembersVaultBalance,
                `members balance in vault for pool with id ${poolId}`,
            );
            // @TODO compute balance of each member
        }
    }

    private async _withdrawRewardForStakingPoolMemberForOperatorsAsync(p: SimulationParams): Promise<void> {
        // tslint:disable-next-line no-unused-variable
        for (const i of _.range(p.numberOfPools)) {
            // @TODO -  we trim balances in here because payouts are accurate only to REWARD_PRECISION decimal places.
            //          update once more accurate.
            // check pool balance in vault
            const poolId = this._poolIds[i];
            const poolOperator = this._poolOperators[i];
            const poolOperatorAddress = poolOperator.getOwner();
            const initEthBalance = await this._stakingWrapper.getEthBalanceAsync(poolOperatorAddress);
            await this._stakingWrapper.withdrawTotalRewardForStakingPoolOperatorAsync(poolId, poolOperatorAddress);
            const finalEthBalance = await this._stakingWrapper.getEthBalanceAsync(poolOperatorAddress);
            const reward = finalEthBalance.minus(initEthBalance);
            const expectedReward = p.expectedPayoutByPoolOperator[i];
            Simulation._assertRewardsEqual(reward, expectedReward, `reward withdrawn from pool ${poolId} for operator`);
        }
    }
    */
}
