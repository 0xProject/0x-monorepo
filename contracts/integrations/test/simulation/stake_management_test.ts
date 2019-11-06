import { BlockchainBalanceStore } from '@0x/contracts-exchange';
import { blockchainTests } from '@0x/contracts-test-utils';
import * as _ from 'lodash';

import { Staker } from '../actors';
import { DeploymentManager } from '../utils/deployment_manager';
import { AssertionResult } from '../utils/function_assertions';

import { Simulation, SimulationEnvironment } from './simulation';

export class StakeManagementSimulation extends Simulation {
    constructor(environment: SimulationEnvironment) {
        super(environment);
    }

    protected async *_assertionGenerator(): AsyncIterableIterator<AssertionResult | void> {
        const { deployment, balanceStore } = this.environment;
        const staker = new Staker({ name: 'Staker', deployment, simulationEnvironment: this.environment });
        await staker.configureERC20TokenAsync(deployment.tokens.zrx);
        balanceStore.registerTokenOwner(staker.address, staker.name);

        const actions = [staker.simulationActions.validStake, staker.simulationActions.validUnstake];
        while (true) {
            const action = _.sample(actions);
            yield (await action!.next()).value;
        }
    }
}

blockchainTests.skip('Stake management fuzz test', env => {
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

        const sim = new StakeManagementSimulation({ balanceStore, deployment });
        return sim.fuzzAsync();
    });
});
