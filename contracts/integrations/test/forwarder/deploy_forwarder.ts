import { artifacts as exchangeArtifacts } from '@0x/contracts-exchange';
import { artifacts, ForwarderContract } from '@0x/contracts-exchange-forwarder';
import { BlockchainTestsEnvironment } from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';

import { DeploymentManager } from '../../src/deployment_manager';

/**
 * Deploys a Forwarder contract configured to work alongside the provided `deployment`.
 */
export async function deployForwarderAsync(
    deployment: DeploymentManager,
    environment: BlockchainTestsEnvironment,
): Promise<ForwarderContract> {
    return ForwarderContract.deployFrom0xArtifactAsync(
        artifacts.Forwarder,
        environment.provider,
        deployment.txDefaults,
        { ...exchangeArtifacts, ...artifacts },
        deployment.exchange.address,
        assetDataUtils.encodeERC20AssetData(deployment.tokens.weth.address),
    );
}
