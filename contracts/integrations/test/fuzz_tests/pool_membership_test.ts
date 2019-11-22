import { blockchainTests } from '@0x/contracts-test-utils';
import * as _ from 'lodash';

import { PoolMember } from '../framework/actors/pool_member';
import { PoolOperator } from '../framework/actors/pool_operator';
import { AssertionResult } from '../framework/assertions/function_assertion';
import { BlockchainBalanceStore } from '../framework/balances/blockchain_balance_store';
import { DeploymentManager } from '../framework/deployment_manager';
import { Simulation, SimulationEnvironment } from '../framework/simulation';

class PoolMembershipSimulation extends Simulation {
    protected async *_assertionGenerator(): AsyncIterableIterator<AssertionResult | void> {
        const { deployment } = this.environment;

        const operator = new PoolOperator({
            name: 'operator',
            deployment,
            simulationEnvironment: this.environment,
        });

        const member = new PoolMember({
            name: 'member',
            deployment,
            simulationEnvironment: this.environment,
        });

        const actions = [
            operator.simulationActions.validCreateStakingPool,
            member.simulationActions.validJoinStakingPool,
        ];

        while (true) {
            const action = _.sample(actions);
            yield (await action!.next()).value; // tslint:disable-line:no-non-null-assertion
        }
    }
}

blockchainTests('pool membership fuzz test', env => {
    it('fuzz', async () => {
        const deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 0,
            numErc721TokensToDeploy: 0,
            numErc1155TokensToDeploy: 0,
        });

        const balanceStore = new BlockchainBalanceStore({}, {});

        const simulationEnv = new SimulationEnvironment(deployment, balanceStore);
        const simulation = new PoolMembershipSimulation(simulationEnv);
        return simulation.fuzzAsync();
    });
});
