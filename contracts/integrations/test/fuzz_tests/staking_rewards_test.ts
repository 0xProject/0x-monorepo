import { blockchainTests } from '@0x/contracts-test-utils';
import * as _ from 'lodash';

import { Actor } from '../framework/actors/base';
import {
    MakerTaker,
    OperatorStakerMaker,
    StakerKeeper,
    StakerMaker,
    StakerOperator,
} from '../framework/actors/hybrids';
import { Keeper } from '../framework/actors/keeper';
import { Maker } from '../framework/actors/maker';
import { PoolOperator } from '../framework/actors/pool_operator';
import { Staker } from '../framework/actors/staker';
import { Taker } from '../framework/actors/taker';
import { filterActorsByRole } from '../framework/actors/utils';
import { AssertionResult } from '../framework/assertions/function_assertion';
import { BlockchainBalanceStore } from '../framework/balances/blockchain_balance_store';
import { DeploymentManager } from '../framework/deployment_manager';
import { Simulation, SimulationEnvironment } from '../framework/simulation';
import { Pseudorandom } from '../framework/utils/pseudorandom';

import { PoolMembershipSimulation } from './pool_membership_test';
import { StakeManagementSimulation } from './stake_management_test';

export class StakingRewardsSimulation extends Simulation {
    protected async *_assertionGenerator(): AsyncIterableIterator<AssertionResult | void> {
        const { actors } = this.environment;
        const stakers = filterActorsByRole(actors, Staker);
        const keepers = filterActorsByRole(actors, Keeper);

        const poolMembership = new PoolMembershipSimulation(this.environment);
        const stakeManagement = new StakeManagementSimulation(this.environment);

        const [actions, weights] = _.unzip([
            ...stakers.map(staker => [staker.simulationActions.validWithdrawDelegatorRewards, 0.1 / stakers.length]),
            ...keepers.map(keeper => [keeper.simulationActions.validFinalizePool, 0.1 / keepers.length]),
            ...keepers.map(keeper => [keeper.simulationActions.validEndEpoch, 0.1 / keepers.length]),
            [poolMembership.generator, 0.5],
            [stakeManagement.generator, 0.2],
        ]) as [AsyncIterableIterator<AssertionResult | void>[], number[]];
        while (true) {
            const action = Pseudorandom.sample(actions, weights);
            yield (await action!.next()).value; // tslint:disable-line:no-non-null-assertion
        }
    }
}

blockchainTests('Staking rewards fuzz test', env => {
    before(function(): void {
        if (process.env.FUZZ_TEST !== 'staking_rewards') {
            this.skip();
        }
    });

    after(async () => {
        Actor.reset();
    });

    it('fuzz', async () => {
        // Deploy contracts
        const deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 4,
            numErc721TokensToDeploy: 0,
            numErc1155TokensToDeploy: 0,
        });
        const [ERC20TokenA, ERC20TokenB, ERC20TokenC, ERC20TokenD] = deployment.tokens.erc20;

        // Set up balance store
        const balanceStore = new BlockchainBalanceStore(
            {
                StakingProxy: deployment.staking.stakingProxy.address,
                ZRXVault: deployment.staking.zrxVault.address,
            },
            {
                erc20: {
                    ZRX: deployment.tokens.zrx,
                    WETH: deployment.tokens.weth,
                    ERC20TokenA,
                    ERC20TokenB,
                    ERC20TokenC,
                    ERC20TokenD,
                },
            },
        );

        // Spin up actors
        const actors = [
            new Maker({ deployment, name: 'Maker 1' }),
            new Maker({ deployment, name: 'Maker 2' }),
            new Taker({ deployment, name: 'Taker 1' }),
            new Taker({ deployment, name: 'Taker 2' }),
            new MakerTaker({ deployment, name: 'Maker/Taker' }),
            new Staker({ deployment, name: 'Staker 1' }),
            new Staker({ deployment, name: 'Staker 2' }),
            new Keeper({ deployment, name: 'Keeper' }),
            new StakerKeeper({ deployment, name: 'Staker/Keeper' }),
            new StakerMaker({ deployment, name: 'Staker/Maker' }),
            new PoolOperator({ deployment, name: 'Pool Operator' }),
            new StakerOperator({ deployment, name: 'Staker/Operator' }),
            new OperatorStakerMaker({ deployment, name: 'Operator/Staker/Maker' }),
        ];

        // Set up simulation environment
        const simulationEnvironment = new SimulationEnvironment(deployment, balanceStore, actors);

        // Takers need to set a WETH allowance for the staking proxy in case they pay the protocol fee in WETH
        const takers = filterActorsByRole(actors, Taker);
        for (const taker of takers) {
            await taker.configureERC20TokenAsync(deployment.tokens.weth, deployment.staking.stakingProxy.address);
        }
        // Stakers need to set a ZRX allowance to deposit their ZRX into the zrxVault
        const stakers = filterActorsByRole(actors, Staker);
        for (const staker of stakers) {
            await staker.configureERC20TokenAsync(deployment.tokens.zrx);
        }
        const simulation = new StakingRewardsSimulation(simulationEnvironment);
        return simulation.fuzzAsync();
    });
});
