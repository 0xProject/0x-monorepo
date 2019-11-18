import { artifacts as ERC20Artifacts } from '@0x/contracts-erc20';
import { BlockchainTestsEnvironment } from '@0x/contracts-test-utils';

import { artifacts } from '../artifacts';
import { DeploymentManager } from '../framework/deployment_manager';
import { TestEth2DaiBridgeContract, TestEth2DaiContract } from '../wrappers';

export async function deployEth2DaiBridgeAsync(
    deployment: DeploymentManager,
    environment: BlockchainTestsEnvironment,
): Promise<[TestEth2DaiBridgeContract, TestEth2DaiContract]> {
    const eth2Dai = await TestEth2DaiContract.deployFrom0xArtifactAsync(
        artifacts.TestEth2Dai,
        environment.provider,
        deployment.txDefaults,
        artifacts,
    );

    const eth2DaiBridge = await TestEth2DaiBridgeContract.deployFrom0xArtifactAsync(
        artifacts.TestEth2DaiBridge,
        environment.provider,
        deployment.txDefaults,
        { ...ERC20Artifacts, ...artifacts },
        eth2Dai.address,
    );

    return [eth2DaiBridge, eth2Dai];
}
