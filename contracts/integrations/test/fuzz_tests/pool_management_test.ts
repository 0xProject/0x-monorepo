import { blockchainTests } from '@0x/contracts-test-utils';

import { Actor } from '../framework/actors/base';
import { PoolOperator } from '../framework/actors/pool_operator';
import { AssertionResult } from '../framework/assertions/function_assertion';
import { BlockchainBalanceStore } from '../framework/balances/blockchain_balance_store';
import { DeploymentManager } from '../framework/deployment_manager';
import { Simulation, SimulationEnvironment } from '../framework/simulation';
import { Pseudorandom } from '../framework/utils/pseudorandom';

export class PoolManagementSimulation extends Simulation {
    protected async *_assertionGenerator(): AsyncIterableIterator<AssertionResult | void> {
        const { deployment } = this.environment;
        const operator = new PoolOperator({
            name: 'Operator',
            deployment,
            simulationEnvironment: this.environment,
        });

        const actions = [
            operator.simulationActions.validCreateStakingPool,
            operator.simulationActions.validDecreaseStakingPoolOperatorShare,
        ];
        while (true) {
            const action = Pseudorandom.sample(actions);
            yield (await action!.next()).value; // tslint:disable-line:no-non-null-assertion
        }
    }
}

blockchainTests('Pool management fuzz test', env => {
    before(function(): void {
        if (process.env.FUZZ_TEST !== 'pool_management') {
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
        const balanceStore = new BlockchainBalanceStore({}, {});

        const simulationEnv = new SimulationEnvironment(deployment, balanceStore);
        const simulation = new PoolManagementSimulation(simulationEnv);
        return simulation.fuzzAsync();
    });
});
