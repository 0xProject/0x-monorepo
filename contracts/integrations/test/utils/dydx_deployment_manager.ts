import { BlockchainTestsEnvironment } from '@0x/contracts-test-utils';

import { DeploymentManager, DeploymentOptions } from './deployment_mananger';
import { artifacts, ZeroExV3ExchangeWrapperContract, ZeroExV3MultiOrderExchangeWrapperContract } from '../../src';

export interface DydxContracts {
    exchangeWrapper: ZeroExV3ExchangeWrapperContract;
    multiOrderExchangeWrapper: ZeroExV3MultiOrderExchangeWrapperContract;
}

export interface DydxDeploymentOptions extends DeploymentOptions {
    trustedMsgSenders: string[];
}

export class DydxDeploymentManager extends DeploymentManager {
    public dydx: DydxContracts;

    public static async deployAsync(
        environment: BlockchainTestsEnvironment,
        options: Partial<DydxDeploymentOptions> = {},
    ): Promise<DydxDeploymentManager> {
        const baseDeploymentManager = await super.deployAsync(environment, options);

        const dydxExchangeWrapper = await ZeroExV3ExchangeWrapperContract.deployFrom0xArtifactAsync(
            artifacts.ZeroExV3ExchangeWrapper,
            environment.provider,
            environment.txDefaults,
            artifacts,
            baseDeploymentManager.exchange.address,
            baseDeploymentManager.assetProxies.erc20Proxy.address,
            baseDeploymentManager.tokens.weth.address,
            options.trustedMsgSenders || [],
        );

        const dydxMultiOrderExchangeWrapper = await ZeroExV3MultiOrderExchangeWrapperContract.deployFrom0xArtifactAsync(
            artifacts.ZeroExV3MultiOrderExchangeWrapper,
            environment.provider,
            environment.txDefaults,
            artifacts,
            baseDeploymentManager.exchange.address,
            baseDeploymentManager.assetProxies.erc20Proxy.address,
            baseDeploymentManager.tokens.weth.address,
            options.trustedMsgSenders || [],
        );

        return new DydxDeploymentManager(baseDeploymentManager, {
            exchangeWrapper: dydxExchangeWrapper,
            multiOrderExchangeWrapper: dydxMultiOrderExchangeWrapper,
        });
    }

    private constructor(baseDeploymentManager: DeploymentManager, dydx: DydxContracts) {
        const { assetProxies, assetProxyOwner, exchange, staking, tokens } = baseDeploymentManager;
        super(assetProxies, assetProxyOwner, exchange, staking, tokens);
        this.dydx = dydx;
    }
}
