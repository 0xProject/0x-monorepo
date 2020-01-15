import { blockchainTests } from '@0x/contracts-test-utils';
import * as _ from 'lodash';

import { Actor } from '../framework/actors/base';
import { Maker } from '../framework/actors/maker';
import { PoolOperator } from '../framework/actors/pool_operator';
import { Taker } from '../framework/actors/taker';
import { filterActorsByRole } from '../framework/actors/utils';
import { AssertionResult } from '../framework/assertions/function_assertion';
import { BlockchainBalanceStore } from '../framework/balances/blockchain_balance_store';
import { DeploymentManager } from '../framework/deployment_manager';
import { Simulation, SimulationEnvironment } from '../framework/simulation';
import { Pseudorandom } from '../framework/utils/pseudorandom';

import { PoolManagementSimulation } from './pool_management_test';

export class MatchOrdersSimulation extends Simulation {
    protected async *_assertionGenerator(): AsyncIterableIterator<AssertionResult | void> {
        const { actors } = this.environment;
        const makers = filterActorsByRole(actors, Maker);
        const takers = filterActorsByRole(actors, Taker);

        const poolManagement = new PoolManagementSimulation(this.environment);

        const [actions, weights] = _.unzip([
            // 20% chance of executing validJoinStakingPool for a random maker
            ...makers.map(maker => [maker.simulationActions.validJoinStakingPool, 0.2 / makers.length]),
            // 30% chance of executing matchOrders for a random taker
            ...takers.map(taker => [taker.simulationActions.validMatchOrders, 0.3]),
            // 30% chance of executing matchOrders for a random taker
            ...takers.map(taker => [taker.simulationActions.validMatchOrdersWithMaximalFill, 0.3]),
            // 20% chance of executing an assertion generated from the pool management simulation
            [poolManagement.generator, 0.2],
        ]) as [Array<AsyncIterableIterator<AssertionResult | void>>, number[]];
        while (true) {
            const action = Pseudorandom.sample(actions, weights);
            yield (await action!.next()).value; // tslint:disable-line:no-non-null-assertion
        }
    }
}

blockchainTests('Match Orders fuzz test', env => {
    before(function(): void {
        if (process.env.FUZZ_TEST !== 'match_orders') {
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

        // Set up balance store
        const balanceStore = new BlockchainBalanceStore({}, {});

        // Spin up actors
        const actors = [
            new Maker({ deployment, name: 'Maker 1' }),
            new Taker({ deployment, name: 'Taker 1' }),
            new PoolOperator({ deployment, name: 'PoolOperator 1' }),
        ];

        // Set up simulation environment
        const simulationEnvironment = new SimulationEnvironment(deployment, balanceStore, actors);

        // Takers need to set a WETH allowance for the staking proxy in case they pay the protocol fee in WETH
        const takers = filterActorsByRole(actors, Taker);
        for (const taker of takers) {
            await taker.configureERC20TokenAsync(deployment.tokens.weth, deployment.staking.stakingProxy.address);
        }

        // Run simulation
        const simulation = new MatchOrdersSimulation(simulationEnvironment);
        return simulation.fuzzAsync();
    });
});
