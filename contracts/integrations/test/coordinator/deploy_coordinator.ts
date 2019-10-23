import { artifacts, CoordinatorContract } from '@0x/contracts-coordinator';
import { artifacts as exchangeArtifacts } from '@0x/contracts-exchange';
import { BlockchainTestsEnvironment } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

import { DeploymentManager } from '../utils/deployment_manager';

export async function deployCoordinatorAsync(
    deployment: DeploymentManager,
    environment: BlockchainTestsEnvironment,
): Promise<CoordinatorContract> {
    return await CoordinatorContract.deployFrom0xArtifactAsync(
        artifacts.Coordinator,
        environment.provider,
        deployment.txDefaults,
        { ...exchangeArtifacts, ...artifacts },
        deployment.exchange.address,
        new BigNumber(deployment.chainId),
    );
}
