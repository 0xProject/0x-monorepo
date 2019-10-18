import { DummyERC20TokenContract, WETH9Contract } from '@0x/contracts-erc20';
import { constants } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

import { DeploymentManager } from '../deployment/deployment_mananger';

export type Constructor<T = {}> = new (...args: any[]) => T;

export interface ActorConfig {
    address: string;
    name?: string;
    deployment: DeploymentManager;
    [subclassProperty: string]: any;
}

export class Actor {
    public readonly address: string;
    public readonly name: string;
    public readonly deployment: DeploymentManager;

    constructor(config: ActorConfig) {
        this.address = config.address;
        this.name = config.name || config.address;
        this.deployment = config.deployment;
    }

    /**
     * Sets a balance for an ERC20 token and approves a spender (defaults to the ERC20 asset proxy)
     * to transfer the token.
     */
    public async configureERC20TokenAsync(
        token: DummyERC20TokenContract | WETH9Contract,
        spender?: string,
        amount?: BigNumber,
    ): Promise<void> {
        if (token instanceof DummyERC20TokenContract) {
            await token.setBalance.awaitTransactionSuccessAsync(
                this.address,
                amount || constants.INITIAL_ERC20_BALANCE,
            );
        } else {
            await token.deposit.awaitTransactionSuccessAsync({
                from: this.address,
                value: amount || constants.ONE_ETHER,
            });
        }

        await token.approve.awaitTransactionSuccessAsync(
            spender || this.deployment.assetProxies.erc20Proxy.address,
            constants.MAX_UINT256,
            { from: this.address },
        );
    }
}
