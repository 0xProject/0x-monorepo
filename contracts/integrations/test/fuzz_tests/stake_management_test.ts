import { blockchainTests } from '@0x/contracts-test-utils';

import { Actor } from '../framework/actors/base';
import { Staker } from '../framework/actors/staker';
import { AssertionResult } from '../framework/assertions/function_assertion';
import { BlockchainBalanceStore } from '../framework/balances/blockchain_balance_store';
import { DeploymentManager } from '../framework/deployment_manager';
import { Simulation, SimulationEnvironment } from '../framework/simulation';
import { Pseudorandom } from '../framework/utils/pseudorandom';

import { PoolManagementSimulation } from './pool_management_test';

export class StakeManagementSimulation extends Simulation {
    protected async *_assertionGenerator(): AsyncIterableIterator<AssertionResult | void> {
        const { deployment, balanceStore } = this.environment;
        const poolManagement = new PoolManagementSimulation(this.environment);

        const staker = new Staker({ name: 'Staker', deployment, simulationEnvironment: this.environment });
        await staker.configureERC20TokenAsync(deployment.tokens.zrx);
        balanceStore.registerTokenOwner(staker.address, staker.name);

        const actions = [
            staker.simulationActions.validStake,
            staker.simulationActions.validUnstake,
            staker.simulationActions.validMoveStake,
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

        const simulationEnv = new SimulationEnvironment(deployment, balanceStore);
        const simulation = new StakeManagementSimulation(simulationEnv);
        return simulation.fuzzAsync();
    });
});
