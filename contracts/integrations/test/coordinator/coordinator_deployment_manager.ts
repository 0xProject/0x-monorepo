import { artifacts, CoordinatorContract } from '@0x/contracts-coordinator';
import { artifacts as exchangeArtifacts } from '@0x/contracts-exchange';
import { BlockchainTestsEnvironment } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

import { DeploymentManager, DeploymentOptions } from '../deployment/deployment_mananger';

export class CoordinatorDeploymentManager extends DeploymentManager {
    public coordinator: CoordinatorContract;

    public static async deployAsync(
        environment: BlockchainTestsEnvironment,
        options: Partial<DeploymentOptions> = {},
    ): Promise<CoordinatorDeploymentManager> {
        const baseDeploymentManager = await super.deployAsync(environment, options);

        const coordinator = await CoordinatorContract.deployFrom0xArtifactAsync(
            artifacts.Coordinator,
            environment.provider,
            environment.txDefaults,
            { ...exchangeArtifacts, ...artifacts },
            baseDeploymentManager.exchange.address,
            new BigNumber(baseDeploymentManager.chainId),
        );

        return new CoordinatorDeploymentManager(baseDeploymentManager, coordinator);
    }

    private constructor(baseDeploymentManager: DeploymentManager, coordinator: CoordinatorContract) {
        const { assetProxies, assetProxyOwner, exchange, staking, tokens, chainId, accounts } = baseDeploymentManager;
        super(assetProxies, assetProxyOwner, exchange, staking, tokens, chainId, accounts);
        this.coordinator = coordinator;
    }
}
