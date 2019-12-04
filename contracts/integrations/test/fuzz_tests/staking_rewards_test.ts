import { blockchainTests } from '@0x/contracts-test-utils';

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

import { PoolManagementSimulation } from './pool_management_test';
import { PoolMembershipSimulation } from './pool_membership_test';
import { StakeManagementSimulation } from './stake_management_test';

export class StakingRewardsSimulation extends Simulation {
    protected async *_assertionGenerator(): AsyncIterableIterator<AssertionResult | void> {
        const { actors } = this.environment;
        const stakers = filterActorsByRole(actors, Staker);
        const keepers = filterActorsByRole(actors, Keeper);

        const poolManagement = new PoolManagementSimulation(this.environment);
        const poolMembership = new PoolMembershipSimulation(this.environment);
        const stakeManagement = new StakeManagementSimulation(this.environment);

        const actions = [
            ...stakers.map(staker => staker.simulationActions.validWithdrawDelegatorRewards),
            ...keepers.map(keeper => keeper.simulationActions.validFinalizePool),
            ...keepers.map(keeper => keeper.simulationActions.validEndEpoch),
            poolManagement.generator,
            poolMembership.generator,
            stakeManagement.generator,
        ];
        while (true) {
            const action = Pseudorandom.sample(actions);
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
        const deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 4,
            numErc721TokensToDeploy: 0,
            numErc1155TokensToDeploy: 0,
        });
        const balanceStore = new BlockchainBalanceStore(
            {
                StakingProxy: deployment.staking.stakingProxy.address,
                ZRXVault: deployment.staking.zrxVault.address,
            },
            { erc20: { ZRX: deployment.tokens.zrx } },
        );
        const simulationEnvironment = new SimulationEnvironment(deployment, balanceStore);

        const actors = [
            new Maker({ deployment, simulationEnvironment, name: 'Maker 1' }),
            new Maker({ deployment, simulationEnvironment, name: 'Maker 2' }),
            new Taker({ deployment, simulationEnvironment, name: 'Taker 1' }),
            new Taker({ deployment, simulationEnvironment, name: 'Taker 2' }),
            new MakerTaker({ deployment, simulationEnvironment, name: 'Maker/Taker' }),
            new Staker({ deployment, simulationEnvironment, name: 'Staker 1' }),
            new Staker({ deployment, simulationEnvironment, name: 'Staker 2' }),
            new Keeper({ deployment, simulationEnvironment, name: 'Keeper' }),
            new StakerKeeper({ deployment, simulationEnvironment, name: 'Staker/Keeper' }),
            new StakerMaker({ deployment, simulationEnvironment, name: 'Staker/Maker' }),
            new PoolOperator({ deployment, simulationEnvironment, name: 'Pool Operator' }),
            new StakerOperator({ deployment, simulationEnvironment, name: 'Staker/Operator' }),
            new OperatorStakerMaker({ deployment, simulationEnvironment, name: 'Operator/Staker/Maker' }),
        ];

        const takers = filterActorsByRole(actors, Taker);
        for (const taker of takers) {
            await taker.configureERC20TokenAsync(deployment.tokens.weth, deployment.staking.stakingProxy.address);
        }
        const stakers = filterActorsByRole(actors, Staker);
        for (const staker of stakers) {
            await staker.configureERC20TokenAsync(deployment.tokens.zrx);
        }
        for (const actor of actors) {
            balanceStore.registerTokenOwner(actor.address, actor.name);
        }

        const simulation = new StakingRewardsSimulation(simulationEnvironment);
        return simulation.fuzzAsync();
    });
});
