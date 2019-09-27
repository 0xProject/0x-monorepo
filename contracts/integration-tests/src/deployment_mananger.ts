import {
    artifacts as assetProxyArtifacts,
    ERC1155ProxyContract,
    ERC20ProxyContract,
    ERC721ProxyContract,
    MultiAssetProxyContract,
    StaticCallProxyContract,
} from '@0x/contracts-asset-proxy';
import {
    artifacts as exchangeArtifacts,
    AssetProxyDispatcher,
    Authorizable,
    ExchangeContract,
    Ownable,
} from '@0x/contracts-exchange';
import { artifacts as multisigArtifacts, AssetProxyOwnerContract } from '@0x/contracts-multisig';
import {
    artifacts as stakingArtifacts,
    ReadOnlyProxyContract,
    StakingContract,
    StakingProxyContract,
} from '@0x/contracts-staking';
import { BlockchainTestsEnvironment, constants } from '@0x/contracts-test-utils';
import { Web3ProviderEngine } from '@0x/subproviders';
import { BigNumber } from '@0x/utils';
import { TxData } from 'ethereum-types';
import * as _ from 'lodash';

/**
 * Adds a batch of authorities to a list of authorizable contracts.
 * @param owner The owner of the authorizable contracts.
 * @param authorizers The authorizable contracts.
 * @param authorities A list of addresses to authorize in each authorizer contract.
 */
async function batchAddAuthorizedAddressAsync(
    owner: string,
    authorizers: Authorizable[],
    authorities: string[],
): Promise<void> {
    for (const authorizer of authorizers) {
        for (const authority of authorities) {
            await authorizer.addAuthorizedAddress.awaitTransactionSuccessAsync(authority, { from: owner });
        }
    }
}

/**
 * Batch registers asset proxies in a list of registry contracts.
 * @param owner The owner of the registry accounts.
 * @param registries The registries that the asset proxies should be registered in.
 * @param proxies A list of proxy contracts to register.
 */
async function batchRegisterAssetProxyAsync(
    owner: string,
    registries: AssetProxyDispatcher[],
    proxies: string[],
): Promise<void> {
    for (const registry of registries) {
        for (const proxy of proxies) {
            await registry.registerAssetProxy.awaitTransactionSuccessAsync(proxy, { from: owner });
        }
    }
}

/**
 * Transfers ownership of several contracts from one address to another.
 * @param owner The address that currently owns the contract instances.
 * @param newOwner The address that will be given ownership of the contract instances.
 * @param ownedContracts The contracts whose ownership will be transferred.
 */
async function batchTransferOwnershipAsync(
    owner: string,
    newOwner: AssetProxyOwnerContract,
    ownedContracts: Ownable[],
): Promise<void> {
    for (const ownedContract of ownedContracts) {
        await ownedContract.transferOwnership.awaitTransactionSuccessAsync(newOwner.address, { from: owner });
    }
}

// Contract wrappers for all of the asset proxies
interface AssetProxyContracts {
    erc20Proxy: ERC20ProxyContract;
    erc721Proxy: ERC721ProxyContract;
    erc1155Proxy: ERC1155ProxyContract;
    multiAssetProxy: MultiAssetProxyContract;
    staticCallProxy: StaticCallProxyContract;
}

// Contract wrappers for all of the staking contracts
interface StakingContracts {
    readOnlyProxy: ReadOnlyProxyContract;
    stakingLogic: StakingContract;
    stakingProxy: StakingProxyContract;
    stakingWrapper: StakingContract;
}

export class DeploymentManager {
    public static protocolFeeMultiplier = new BigNumber(150000);

    public assetProxies: AssetProxyContracts;
    public assetProxyOwner: AssetProxyOwnerContract;
    public exchange: ExchangeContract;
    public staking: StakingContracts;

    /**
     * Fully deploy the 0x exchange and staking contracts and configure the system with the
     * asset proxy owner multisig.
     * @param environment A blockchain test environment to use for contracts deployment.
     */
    public static async deployAsync(environment: BlockchainTestsEnvironment): Promise<DeploymentManager> {
        const chainId = await environment.getChainIdAsync();
        const [owner] = await environment.getAccountAddressesAsync();
        const txDefaults = {
            ...environment.txDefaults,
            from: owner,
        };

        // Deploy the contracts using the same owner and environment.
        const assetProxies = await DeploymentManager._deployAssetProxyContractsAsync(environment, owner, txDefaults);
        const staking = await DeploymentManager._deployStakingContractsAsync(environment, owner, txDefaults);
        const exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            exchangeArtifacts.Exchange,
            environment.provider,
            environment.txDefaults,
            exchangeArtifacts,
            new BigNumber(chainId),
        );
        const assetProxyOwner = await AssetProxyOwnerContract.deployFrom0xArtifactAsync(
            multisigArtifacts.AssetProxyOwner,
            environment.provider,
            txDefaults,
            multisigArtifacts,
            [],
            [],
            [],
            [owner],
            new BigNumber(1),
            constants.ZERO_AMOUNT,
        );

        // Configure the asset proxies with the exchange and the exchange with the staking contracts.
        await DeploymentManager._configureAssetProxiesWithExchangeAsync(assetProxies, exchange, owner);
        await DeploymentManager._configureExchangeWithStakingAsync(exchange, staking, owner);

        // Transfer complete ownership of the system to the asset proxy owner.
        await batchTransferOwnershipAsync(owner, assetProxyOwner, [
            assetProxies.erc20Proxy,
            assetProxies.erc721Proxy,
            assetProxies.erc1155Proxy,
            assetProxies.multiAssetProxy,
            exchange,
            staking.readOnlyProxy,
            staking.stakingProxy,
        ]);

        return new DeploymentManager(assetProxies, assetProxyOwner, exchange, staking);
    }

    protected static async _configureAssetProxiesWithExchangeAsync(
        assetProxies: AssetProxyContracts,
        exchange: ExchangeContract,
        owner: string,
    ): Promise<void> {
        // Register the asset proxies in the exchange contract.
        await batchRegisterAssetProxyAsync(
            owner,
            [exchange],
            [
                assetProxies.erc20Proxy.address,
                assetProxies.erc721Proxy.address,
                assetProxies.erc1155Proxy.address,
                assetProxies.multiAssetProxy.address,
                assetProxies.staticCallProxy.address,
            ],
        );

        // Register the asset proxies in the multi-asset proxy.
        await batchRegisterAssetProxyAsync(
            owner,
            [assetProxies.multiAssetProxy],
            [
                assetProxies.erc20Proxy.address,
                assetProxies.erc721Proxy.address,
                assetProxies.erc1155Proxy.address,
                assetProxies.staticCallProxy.address,
            ],
        );

        // Add the multi-asset proxy as an authorized address of the token proxies.
        await batchAddAuthorizedAddressAsync(
            owner,
            [assetProxies.erc20Proxy, assetProxies.erc721Proxy, assetProxies.erc1155Proxy],
            [assetProxies.multiAssetProxy.address],
        );

        // Add the exchange as an authorized address in all of the proxies.
        await batchAddAuthorizedAddressAsync(
            owner,
            [
                assetProxies.erc20Proxy,
                assetProxies.erc721Proxy,
                assetProxies.erc1155Proxy,
                assetProxies.multiAssetProxy,
            ],
            [exchange.address],
        );
    }

    protected static async _configureExchangeWithStakingAsync(
        exchange: ExchangeContract,
        staking: StakingContracts,
        owner: string,
    ): Promise<void> {
        // Configure the exchange for staking.
        await exchange.setProtocolFeeCollectorAddress.awaitTransactionSuccessAsync(staking.stakingProxy.address, {
            from: owner,
        });
        await exchange.setProtocolFeeMultiplier.awaitTransactionSuccessAsync(DeploymentManager.protocolFeeMultiplier);

        // Register the exchange contract in staking.
        await staking.stakingWrapper.addExchangeAddress.awaitTransactionSuccessAsync(exchange.address, { from: owner });
    }

    protected static async _deployAssetProxyContractsAsync(
        environment: BlockchainTestsEnvironment,
        owner: string,
        txDefaults: Partial<TxData>,
    ): Promise<AssetProxyContracts> {
        const erc20Proxy = await ERC20ProxyContract.deployFrom0xArtifactAsync(
            assetProxyArtifacts.ERC20Proxy,
            environment.provider,
            txDefaults,
            assetProxyArtifacts,
        );
        const erc721Proxy = await ERC721ProxyContract.deployFrom0xArtifactAsync(
            assetProxyArtifacts.ERC721Proxy,
            environment.provider,
            txDefaults,
            assetProxyArtifacts,
        );
        const erc1155Proxy = await ERC1155ProxyContract.deployFrom0xArtifactAsync(
            assetProxyArtifacts.ERC1155Proxy,
            environment.provider,
            txDefaults,
            assetProxyArtifacts,
        );
        const multiAssetProxy = await MultiAssetProxyContract.deployFrom0xArtifactAsync(
            assetProxyArtifacts.MultiAssetProxy,
            environment.provider,
            txDefaults,
            assetProxyArtifacts,
        );
        const staticCallProxy = await StaticCallProxyContract.deployFrom0xArtifactAsync(
            assetProxyArtifacts.StaticCallProxy,
            environment.provider,
            txDefaults,
            assetProxyArtifacts,
        );
        return {
            erc20Proxy,
            erc721Proxy,
            erc1155Proxy,
            multiAssetProxy,
            staticCallProxy,
        };
    }

    protected static async _deployStakingContractsAsync(
        environment: BlockchainTestsEnvironment,
        owner: string,
        txDefaults: Partial<TxData>,
    ): Promise<StakingContracts> {
        const readOnlyProxy = await ReadOnlyProxyContract.deployFrom0xArtifactAsync(
            stakingArtifacts.ReadOnlyProxy,
            environment.provider,
            txDefaults,
            stakingArtifacts,
        );
        const stakingLogic = await StakingContract.deployFrom0xArtifactAsync(
            stakingArtifacts.Staking,
            environment.provider,
            txDefaults,
            stakingArtifacts,
        );
        const stakingProxy = await StakingProxyContract.deployFrom0xArtifactAsync(
            stakingArtifacts.StakingProxy,
            environment.provider,
            txDefaults,
            stakingArtifacts,
            stakingLogic.address,
            readOnlyProxy.address,
        );
        return {
            readOnlyProxy,
            stakingLogic,
            stakingProxy,
            stakingWrapper: new StakingContract(stakingProxy.address, environment.provider),
        };
    }

    private constructor(
        assetProxies: AssetProxyContracts,
        assetProxyOwner: AssetProxyOwnerContract,
        exchange: ExchangeContract,
        staking: StakingContracts,
    ) {
        this.assetProxies = assetProxies;
        this.assetProxyOwner = assetProxyOwner;
        this.exchange = exchange;
        this.staking = staking;
    }
}
