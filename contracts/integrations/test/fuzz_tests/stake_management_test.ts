import { blockchainTests } from '@0x/contracts-test-utils';

import { Actor } from '../framework/actors/base';
import { StakerOperator } from '../framework/actors/hybrids';
import { PoolOperator } from '../framework/actors/pool_operator';
import { Staker } from '../framework/actors/staker';
import { filterActorsByRole } from '../framework/actors/utils';
import { AssertionResult } from '../framework/assertions/function_assertion';
import { BlockchainBalanceStore } from '../framework/balances/blockchain_balance_store';
import { DeploymentManager } from '../framework/deployment_manager';
import { Simulation, SimulationEnvironment } from '../framework/simulation';
import { Pseudorandom } from '../framework/utils/pseudorandom';

import { PoolManagementSimulation } from './pool_management_test';

export class StakeManagementSimulation extends Simulation {
    protected async *_assertionGenerator(): AsyncIterableIterator<AssertionResult | void> {
        const { actors } = this.environment;
        const stakers = filterActorsByRole(actors, Staker);

        const poolManagement = new PoolManagementSimulation(this.environment);

        const actions = [
            ...stakers.map(staker => staker.simulationActions.validStake),
            ...stakers.map(staker => staker.simulationActions.validUnstake),
            ...stakers.map(staker => staker.simulationActions.validMoveStake),
            poolManagement.generator,
        ];
        while (true) {
            const action = Pseudorandom.sample(actions);
            yield (await action!.next()).value; // tslint:disable-line:no-non-null-assertion
        }
    }
}

blockchainTests('Stake management fuzz test', env => {
    before(function(): void {
        if (process.env.FUZZ_TEST !== 'stake_management') {
            this.skip();
        }
    });

    after(async () => {
        Actor.reset();
    });

    it('fuzz', async () => {
        const deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 0,
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

        const actors = [
            new Staker({ name: 'Staker 1', deployment }),
            new Staker({ name: 'Staker 2', deployment }),
            new StakerOperator({ name: 'Staker/Operator', deployment }),
            new PoolOperator({ name: 'Operator', deployment }),
        ];

        const simulationEnvironment = new SimulationEnvironment(deployment, balanceStore, actors);

        const stakers = filterActorsByRole(actors, Staker);
        for (const staker of stakers) {
            await staker.configureERC20TokenAsync(deployment.tokens.zrx);
        }

        const simulation = new StakeManagementSimulation(simulationEnvironment);
        return simulation.fuzzAsync();
    });
});
