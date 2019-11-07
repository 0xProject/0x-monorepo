import { BlockchainBalanceStore } from '@0x/contracts-exchange';
import { blockchainTests } from '@0x/contracts-test-utils';
import * as _ from 'lodash';

import { PoolOperator } from '../actors';
import { DeploymentManager } from '../utils/deployment_manager';
import { AssertionResult } from '../utils/function_assertions';

import { Simulation, SimulationEnvironment } from './simulation';

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
            const action = _.sample(actions);
            yield (await action!.next()).value; // tslint:disable-line:no-non-null-assertion
        }
    }
}

blockchainTests.skip('Pool management fuzz test', env => {
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
