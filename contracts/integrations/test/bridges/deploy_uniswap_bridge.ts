import { artifacts as ERC20Artifacts } from '@0x/contracts-erc20';
import { BlockchainTestsEnvironment } from '@0x/contracts-test-utils';

import { artifacts } from '../artifacts';
import { DeploymentManager } from '../framework/deployment_manager';
import {
    TestUniswapBridgeContract,
    TestUniswapExchangeContract,
    TestUniswapExchangeFactoryContract,
} from '../wrappers';

export async function deployUniswapBridgeAsync(
    deployment: DeploymentManager,
    environment: BlockchainTestsEnvironment,
    tokenAddresses: string[],
): Promise<[TestUniswapBridgeContract, TestUniswapExchangeContract[], TestUniswapExchangeFactoryContract]> {
    const uniswapExchangeFactory = await TestUniswapExchangeFactoryContract.deployFrom0xArtifactAsync(
        artifacts.TestUniswapExchangeFactory,
        environment.provider,
        deployment.txDefaults,
        artifacts,
    );

    const uniswapExchanges = [];
    for (const tokenAddress of tokenAddresses) {
        const uniswapExchange = await TestUniswapExchangeContract.deployFrom0xArtifactAsync(
            artifacts.TestUniswapExchange,
            environment.provider,
            deployment.txDefaults,
            artifacts,
            tokenAddress,
        );
        await uniswapExchangeFactory.addExchange(tokenAddress, uniswapExchange.address).awaitTransactionSuccessAsync();
        uniswapExchanges.push(uniswapExchange);
    }

    const uniswapBridge = await TestUniswapBridgeContract.deployFrom0xArtifactAsync(
        artifacts.TestUniswapBridge,
        environment.provider,
        deployment.txDefaults,
        { ...ERC20Artifacts, ...artifacts },
        deployment.tokens.weth.address,
        uniswapExchangeFactory.address,
    );

    return [uniswapBridge, uniswapExchanges, uniswapExchangeFactory];
}
