import { blockchainTests } from '@0x/contracts-test-utils';

import { Actor } from '../framework/actors/base';
import { MakerTaker } from '../framework/actors/hybrids';
import { Maker } from '../framework/actors/maker';
import { Taker } from '../framework/actors/taker';
import { filterActorsByRole } from '../framework/actors/utils';
import { AssertionResult } from '../framework/assertions/function_assertion';
import { BlockchainBalanceStore } from '../framework/balances/blockchain_balance_store';
import { DeploymentManager } from '../framework/deployment_manager';
import { Simulation, SimulationEnvironment } from '../framework/simulation';
import { Pseudorandom } from '../framework/utils/pseudorandom';

import { PoolManagementSimulation } from './pool_management_test';

class PoolMembershipSimulation extends Simulation {
    protected async *_assertionGenerator(): AsyncIterableIterator<AssertionResult | void> {
        const { actors } = this.environment;
        const makers = filterActorsByRole(actors, Maker);
        const takers = filterActorsByRole(actors, Taker);

        const poolManagement = new PoolManagementSimulation(this.environment);

        const actions = [
            ...makers.map(maker => maker.simulationActions.validJoinStakingPool),
            ...takers.map(taker => taker.simulationActions.validFillOrder),
            poolManagement.generator,
        ];

        while (true) {
            const action = Pseudorandom.sample(actions);
            yield (await action!.next()).value; // tslint:disable-line:no-non-null-assertion
        }
    }
}

blockchainTests('pool membership fuzz test', env => {
    before(async function(): Promise<void> {
        if (process.env.FUZZ_TEST !== 'pool_membership') {
            this.skip();
        }
    });

    after(async () => {
        Actor.count = 0;
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
        ];
        const takers = filterActorsByRole(actors, Taker);
        for (const taker of takers) {
            await taker.configureERC20TokenAsync(deployment.tokens.weth, deployment.staking.stakingProxy.address);
        }

        for (const actor of actors) {
            balanceStore.registerTokenOwner(actor.address, actor.name);
        }

        const simulation = new PoolMembershipSimulation(simulationEnvironment);
        return simulation.fuzzAsync();
    });
});
