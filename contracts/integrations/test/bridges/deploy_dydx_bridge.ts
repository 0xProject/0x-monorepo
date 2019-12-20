import { artifacts as assetProxyArtifacts, TestDydxBridgeContract } from '@0x/contracts-asset-proxy';
import { BlockchainTestsEnvironment } from '@0x/contracts-test-utils';

import { DeploymentManager } from '../framework/deployment_manager';

/**
 * Deploys test DydxBridge contract configured to work alongside the provided `deployment`.
 */
export async function deployDydxBridgeAsync(
    deployment: DeploymentManager,
    environment: BlockchainTestsEnvironment,
): Promise<TestDydxBridgeContract> {
    const tokenHolders = deployment.accounts;
    const dydxBridge = await TestDydxBridgeContract.deployFrom0xArtifactAsync(
        assetProxyArtifacts.TestDydxBridge,
        environment.provider,
        deployment.txDefaults,
        assetProxyArtifacts,
        tokenHolders,
    );
    return dydxBridge;
}
