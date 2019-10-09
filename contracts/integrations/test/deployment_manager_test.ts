import { Authorizable, Ownable } from '@0x/contracts-exchange';
import { constants as stakingConstants } from '@0x/contracts-staking';
import { blockchainTests, expect } from '@0x/contracts-test-utils';

import { DeploymentManager } from './utils/deployment_mananger';

blockchainTests('Deployment Manager', env => {
    let owner: string;
    let deploymentManager: DeploymentManager;

    before(async () => {
        [owner] = await env.getAccountAddressesAsync();
        deploymentManager = await DeploymentManager.deployAsync(env);
    });

    async function batchAssertAuthoritiesAsync(
        authorities: string[],
        authorizedContracts: Authorizable[],
    ): Promise<void> {
        for (const authorized of authorizedContracts) {
            expect(await authorized.getAuthorizedAddresses.callAsync()).to.be.deep.eq(authorities);
        }
    }

    async function batchAssertAuthorizedAsync(
        authorizedAddress: string,
        authorizedContracts: Authorizable[],
    ): Promise<void> {
        for (const authorized of authorizedContracts) {
            expect(await authorized.authorized.callAsync(authorizedAddress)).to.be.true();
        }
    }

    async function batchAssertOwnerAsync(ownerAddress: string, owners: Ownable[]): Promise<void> {
        for (const ownerContract of owners) {
            expect(await ownerContract.owner.callAsync()).to.be.eq(ownerAddress);
        }
    }

    describe('asset proxy owner', () => {
        it('should be owned by `owner`', async () => {
            // Ensure that the owners of the asset proxy only contain the owner.
            const owners = await deploymentManager.assetProxyOwner.getOwners.callAsync();
            expect(owners).to.be.deep.eq([owner]);
        });
    });

    describe('asset proxies', () => {
        it('should be owned be the asset proxy owner', async () => {
            await batchAssertOwnerAsync(deploymentManager.assetProxyOwner.address, [
                deploymentManager.assetProxies.erc1155Proxy,
                deploymentManager.assetProxies.erc20Proxy,
                deploymentManager.assetProxies.erc721Proxy,
                deploymentManager.assetProxies.multiAssetProxy,
            ]);
        });

        it('should have authorized the multi-asset proxy', async () => {
            await batchAssertAuthorizedAsync(deploymentManager.assetProxies.multiAssetProxy.address, [
                deploymentManager.assetProxies.erc1155Proxy,
                deploymentManager.assetProxies.erc20Proxy,
                deploymentManager.assetProxies.erc721Proxy,
            ]);
        });

        it('should have authorized the exchange', async () => {
            await batchAssertAuthorizedAsync(deploymentManager.exchange.address, [
                deploymentManager.assetProxies.erc1155Proxy,
                deploymentManager.assetProxies.erc20Proxy,
                deploymentManager.assetProxies.erc721Proxy,
                deploymentManager.assetProxies.multiAssetProxy,
            ]);
        });

        it('should have the correct authorities list', async () => {
            // The multi-asset proxy should only have the exchange in the authorities list.
            const authorities = await deploymentManager.assetProxies.multiAssetProxy.getAuthorizedAddresses.callAsync();
            expect(authorities).to.be.deep.eq([deploymentManager.exchange.address]);

            // The other asset proxies should have the exchange and the multi-asset proxy in their
            // authorities list.
            await batchAssertAuthoritiesAsync(
                [deploymentManager.assetProxies.multiAssetProxy.address, deploymentManager.exchange.address],
                [
                    deploymentManager.assetProxies.erc1155Proxy,
                    deploymentManager.assetProxies.erc20Proxy,
                    deploymentManager.assetProxies.erc721Proxy,
                ],
            );
        });
    });

    describe('exchange', () => {
        it('should be owned by the asset proxy owner', async () => {
            const exchangeOwner = await deploymentManager.exchange.owner.callAsync();
            expect(exchangeOwner).to.be.eq(deploymentManager.assetProxyOwner.address);
        });

        /*
            TODO(jalextowle): This test should be enabled once the Exchange is
            made an Authorizable contract.
            it('should have authorized the asset proxy owner', async () => {
                const isAuthorized = await deploymentManager.exchange.owner.callAsync(
                    deploymentManager.assetProxyOwner.address,
                );
                expect(isAuthorized).to.be.true();
            });
        */

        it('should have registered the staking proxy', async () => {
            const feeCollector = await deploymentManager.exchange.protocolFeeCollector.callAsync();
            expect(feeCollector).to.be.eq(deploymentManager.staking.stakingProxy.address);
        });

        it('should have set the protocol fee multiplier', async () => {
            const feeMultiplier = await deploymentManager.exchange.protocolFeeMultiplier.callAsync();
            expect(feeMultiplier).bignumber.to.be.eq(DeploymentManager.protocolFeeMultiplier);
        });
    });

    describe('staking', () => {
        it('should be owned by the asset proxy owner', async () => {
            const stakingOwner = await deploymentManager.staking.stakingProxy.owner.callAsync();
            expect(stakingOwner).to.be.eq(deploymentManager.assetProxyOwner.address);
        });

        it('should have authorized the asset proxy owner in the staking proxy', async () => {
            const isAuthorized = await deploymentManager.staking.stakingProxy.authorized.callAsync(
                deploymentManager.assetProxyOwner.address,
            );
            expect(isAuthorized).to.be.true();
        });

        it('should have registered the exchange in the staking proxy', async () => {
            const isValid = await deploymentManager.staking.stakingProxy.validExchanges.callAsync(
                deploymentManager.exchange.address,
            );
            expect(isValid).to.be.true();
        });

        it('should have registered the read-only proxy in the staking proxy', async () => {
            const readOnlyProxy = await deploymentManager.staking.stakingProxy.readOnlyProxy.callAsync();
            expect(readOnlyProxy).to.be.eq(deploymentManager.staking.readOnlyProxy.address);
        });

        it('should have registered the staking contract in the staking proxy', async () => {
            const stakingContract = await deploymentManager.staking.stakingProxy.stakingContract.callAsync();
            expect(stakingContract).to.be.eq(deploymentManager.staking.stakingLogic.address);
        });

        it('should have registered the weth contract in the staking contract', async () => {
            const weth = await deploymentManager.staking.stakingWrapper.testWethAddress.callAsync();
            expect(weth).to.be.eq(deploymentManager.tokens.weth.address);
        });

        it('should have registered the zrx vault in the staking contract', async () => {
            const zrxVault = await deploymentManager.staking.stakingWrapper.testZrxVaultAddress.callAsync();
            expect(zrxVault).to.be.eq(deploymentManager.staking.zrxVault.address);
        });

        it('should have registered the staking proxy in the zrx vault', async () => {
            const stakingProxy = await deploymentManager.staking.zrxVault.stakingProxyAddress.callAsync();
            expect(stakingProxy).to.be.eq(deploymentManager.staking.stakingProxy.address);
        });

        it('should have correctly set the params', async () => {
            const params = await deploymentManager.staking.stakingWrapper.getParams.callAsync();
            expect(params).to.be.deep.eq([
                stakingConstants.DEFAULT_PARAMS.epochDurationInSeconds,
                stakingConstants.DEFAULT_PARAMS.rewardDelegatedStakeWeight,
                stakingConstants.DEFAULT_PARAMS.minimumPoolStake,
                stakingConstants.DEFAULT_PARAMS.cobbDouglasAlphaNumerator,
                stakingConstants.DEFAULT_PARAMS.cobbDouglasAlphaDenominator,
            ]);
        });
    });
});
