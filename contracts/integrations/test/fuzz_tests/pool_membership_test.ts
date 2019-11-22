import { blockchainTests, constants } from '@0x/contracts-test-utils';
import * as _ from 'lodash';

import { Maker } from '../framework/actors/maker';
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
            member.simulationActions.validFillOrderCompleteFill,
        ];

        while (true) {
            const action = _.sample(actions);
            yield (await action!.next()).value; // tslint:disable-line:no-non-null-assertion
        }
    }
}

blockchainTests.skip('pool membership fuzz test', env => {
    let deployment: DeploymentManager;
    let maker: Maker;

    before(async () => {
        deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 2,
            numErc721TokensToDeploy: 0,
            numErc1155TokensToDeploy: 0,
        });

        const makerToken = deployment.tokens.erc20[0];
        const takerToken = deployment.tokens.erc20[1];

        const orderConfig = {
            feeRecipientAddress: constants.NULL_ADDRESS,
            makerAssetData: deployment.assetDataEncoder.ERC20Token(makerToken.address).getABIEncodedTransactionData(),
            takerAssetData: deployment.assetDataEncoder.ERC20Token(takerToken.address).getABIEncodedTransactionData(),
            makerFeeAssetData: deployment.assetDataEncoder
                .ERC20Token(makerToken.address)
                .getABIEncodedTransactionData(),
            takerFeeAssetData: deployment.assetDataEncoder
                .ERC20Token(takerToken.address)
                .getABIEncodedTransactionData(),
            makerFee: constants.ZERO_AMOUNT,
            takerFee: constants.ZERO_AMOUNT,
        };

        maker = new Maker({
            name: 'maker',
            deployment,
            orderConfig,
        });
    });

    it('fuzz', async () => {
        const balanceStore = new BlockchainBalanceStore({}, {});

        const simulationEnv = new SimulationEnvironment(deployment, balanceStore, [maker]);
        const simulation = new PoolMembershipSimulation(simulationEnv);
        return simulation.fuzzAsync();
    });
});
