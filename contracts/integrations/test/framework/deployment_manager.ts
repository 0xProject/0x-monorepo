import {
    artifacts as assetProxyArtifacts,
    ERC1155ProxyContract,
    ERC20ProxyContract,
    ERC721ProxyContract,
    IAssetDataContract,
    MultiAssetProxyContract,
    StaticCallProxyContract,
} from '@0x/contracts-asset-proxy';
import { DevUtilsContract } from '@0x/contracts-dev-utils';
import { artifacts as ERC1155Artifacts, ERC1155MintableContract } from '@0x/contracts-erc1155';
import { artifacts as ERC20Artifacts, DummyERC20TokenContract, WETH9Contract } from '@0x/contracts-erc20';
import { artifacts as ERC721Artifacts, DummyERC721TokenContract } from '@0x/contracts-erc721';
import { artifacts as exchangeArtifacts, ExchangeContract } from '@0x/contracts-exchange';
import { artifacts as multisigArtifacts, ZeroExGovernorContract } from '@0x/contracts-multisig';
import {
    artifacts as stakingArtifacts,
    StakingProxyContract,
    TestStakingContract,
    ZrxVaultContract,
} from '@0x/contracts-staking';
import { BlockchainTestsEnvironment, constants, TransactionHelper } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { TxData } from 'ethereum-types';
import * as _ from 'lodash';

import { AssetProxyDispatcher, Authorizable, Ownable } from './wrapper_interfaces';

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
            await authorizer.addAuthorizedAddress(authority).awaitTransactionSuccessAsync({ from: owner });
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
            await registry.registerAssetProxy(proxy).awaitTransactionSuccessAsync({ from: owner });
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
    newOwner: ZeroExGovernorContract,
    ownedContracts: Ownable[],
): Promise<void> {
    for (const ownedContract of ownedContracts) {
        await ownedContract.transferOwnership(newOwner.address).awaitTransactionSuccessAsync({ from: owner });
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
    stakingLogic: TestStakingContract;
    stakingProxy: StakingProxyContract;
    stakingWrapper: TestStakingContract;
    zrxVault: ZrxVaultContract;
}

// Contract wrappers for tokens.
interface TokenContracts {
    erc20: DummyERC20TokenContract[];
    erc721: DummyERC721TokenContract[];
    erc1155: ERC1155MintableContract[];
    weth: WETH9Contract;
    zrx: DummyERC20TokenContract;
}

// Options to be passed to `deployAsync`
export interface DeploymentOptions {
    owner: string;
    numErc1155TokensToDeploy: number;
    numErc20TokensToDeploy: number;
    numErc721TokensToDeploy: number;
}

export class DeploymentManager {
    public static readonly protocolFeeMultiplier = new BigNumber(150000);
    public static readonly gasPrice = new BigNumber(1e9); // 1 Gwei
    public static readonly protocolFee = DeploymentManager.gasPrice.times(DeploymentManager.protocolFeeMultiplier);

    /**
     * Fully deploy the 0x exchange and staking contracts and configure the system with the
     * asset proxy owner multisig.
     * @param environment A blockchain test environment to use for contracts deployment.
     * @param options Specifies the owner address and number of tokens to deploy.
     */
    public static async deployAsync(
        environment: BlockchainTestsEnvironment,
        options: Partial<DeploymentOptions> = {},
    ): Promise<DeploymentManager> {
        const chainId = await environment.getChainIdAsync();
        const accounts = await environment.getAccountAddressesAsync();

        const owner = options.owner || (await environment.getAccountAddressesAsync())[0];
        const txDefaults = {
            ...environment.txDefaults,
            from: owner,
            gasPrice: DeploymentManager.gasPrice,
        };

        // Deploy the contracts using the same owner and environment.
        const assetProxies = await DeploymentManager._deployAssetProxyContractsAsync(environment, txDefaults);
        const exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            exchangeArtifacts.Exchange,
            environment.provider,
            txDefaults,
            { ...ERC20Artifacts, ...exchangeArtifacts, ...stakingArtifacts },
            new BigNumber(chainId),
        );
        const governor = await ZeroExGovernorContract.deployFrom0xArtifactAsync(
            multisigArtifacts.ZeroExGovernor,
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
        const tokens = await DeploymentManager._deployTokenContractsAsync(environment, txDefaults, options);
        const staking = await DeploymentManager._deployStakingContractsAsync(
            environment,
            owner,
            txDefaults,
            tokens,
            assetProxies,
        );

        // Configure the asset proxies with the exchange and the exchange with the staking contracts.
        await DeploymentManager._configureAssetProxiesWithExchangeAsync(assetProxies, exchange, owner);
        await DeploymentManager._configureExchangeWithStakingAsync(exchange, staking, owner);

        // Authorize the asset-proxy owner in the staking proxy and in the zrx vault.
        await staking.stakingProxy.addAuthorizedAddress(governor.address).awaitTransactionSuccessAsync({
            from: owner,
        });
        await staking.zrxVault.addAuthorizedAddress(governor.address).awaitTransactionSuccessAsync({
            from: owner,
        });

        // Remove authorization for the original owner address.
        await staking.stakingProxy.removeAuthorizedAddress(owner).awaitTransactionSuccessAsync({ from: owner });
        await staking.zrxVault.removeAuthorizedAddress(owner).awaitTransactionSuccessAsync({ from: owner });

        // Transfer complete ownership of the system to the asset proxy owner.
        await batchTransferOwnershipAsync(owner, governor, [
            assetProxies.erc20Proxy,
            assetProxies.erc721Proxy,
            assetProxies.erc1155Proxy,
            assetProxies.multiAssetProxy,
            exchange,
            staking.stakingProxy,
        ]);

        const devUtils = new DevUtilsContract(constants.NULL_ADDRESS, environment.provider);
        const assetDataEncoder = new IAssetDataContract(constants.NULL_ADDRESS, environment.provider);

        // Create a `TransactionHelper` object that uses all of the packages artifacts.
        const txHelper = new TransactionHelper(environment.web3Wrapper, {
            ...assetProxyArtifacts,
            ...ERC20Artifacts,
            ...ERC721Artifacts,
            ...ERC1155Artifacts,
            ...exchangeArtifacts,
            ...stakingArtifacts,
        });

        // Construct the new instance and return it.
        return new DeploymentManager(
            assetProxies,
            governor,
            exchange,
            staking,
            tokens,
            chainId,
            accounts,
            txDefaults,
            devUtils,
            assetDataEncoder,
            txHelper,
        );
    }

    /**
     * Configures a set of asset proxies with an exchange contract.
     * @param assetProxies A set of asset proxies to be configured.
     * @param exchange An exchange contract to configure with the asset proxies.
     * @param owner An owner address to use when configuring the asset proxies.
     */
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

    /**
     * Configures an exchange contract with staking contracts
     * @param exchange The Exchange contract.
     * @param staking The Staking contracts.
     * @param owner An owner address to use when configuring the asset proxies.
     */
    protected static async _configureExchangeWithStakingAsync(
        exchange: ExchangeContract,
        staking: StakingContracts,
        owner: string,
    ): Promise<void> {
        // Configure the exchange for staking.
        await exchange.setProtocolFeeCollectorAddress(staking.stakingProxy.address).awaitTransactionSuccessAsync({
            from: owner,
        });
        await exchange.setProtocolFeeMultiplier(DeploymentManager.protocolFeeMultiplier).awaitTransactionSuccessAsync();

        // Register the exchange contract in staking.
        await staking.stakingWrapper.addExchangeAddress(exchange.address).awaitTransactionSuccessAsync({ from: owner });
    }

    /**
     * Deploy a set of asset proxy contracts.
     * @param environment The blockchain environment to use.
     * @param txDefaults Defaults to use when deploying the asset proxies.
     */
    protected static async _deployAssetProxyContractsAsync(
        environment: BlockchainTestsEnvironment,
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

    /**
     * Deploy a set of staking contracts.
     * @param environment The blockchain environment to use.
     * @param owner An owner address to use when configuring the asset proxies.
     * @param txDefaults Defaults to use when deploying the asset proxies.
     * @param tokens A set of token contracts to use during deployment of the staking contracts.
     * @param assetProxies A set of asset proxies to use with the staking contracts.
     */
    protected static async _deployStakingContractsAsync(
        environment: BlockchainTestsEnvironment,
        owner: string,
        txDefaults: Partial<TxData>,
        tokens: TokenContracts,
        assetProxies: AssetProxyContracts,
    ): Promise<StakingContracts> {
        const zrxVault = await ZrxVaultContract.deployFrom0xArtifactAsync(
            stakingArtifacts.ZrxVault,
            environment.provider,
            txDefaults,
            stakingArtifacts,
            assetProxies.erc20Proxy.address,
            tokens.zrx.address,
        );
        const stakingLogic = await TestStakingContract.deployFrom0xArtifactAsync(
            stakingArtifacts.TestStaking,
            environment.provider,
            txDefaults,
            stakingArtifacts,
            tokens.weth.address,
            zrxVault.address,
        );
        const stakingProxy = await StakingProxyContract.deployFrom0xArtifactAsync(
            stakingArtifacts.StakingProxy,
            environment.provider,
            txDefaults,
            stakingArtifacts,
            stakingLogic.address,
        );

        const stakingWrapper = new TestStakingContract(stakingProxy.address, environment.provider, txDefaults);

        // Add the zrx vault and the weth contract to the staking proxy.
        await stakingWrapper.setWethContract(tokens.weth.address).awaitTransactionSuccessAsync({ from: owner });
        await stakingWrapper.setZrxVault(zrxVault.address).awaitTransactionSuccessAsync({ from: owner });

        // Authorize the owner address in the staking proxy and the zrx vault.
        await stakingProxy.addAuthorizedAddress(owner).awaitTransactionSuccessAsync({ from: owner });
        await zrxVault.addAuthorizedAddress(owner).awaitTransactionSuccessAsync({ from: owner });

        // Authorize the zrx vault in the erc20 proxy
        await assetProxies.erc20Proxy.addAuthorizedAddress(zrxVault.address).awaitTransactionSuccessAsync({
            from: owner,
        });

        // Configure the zrx vault and the staking contract.
        await zrxVault.setStakingProxy(stakingProxy.address).awaitTransactionSuccessAsync({ from: owner });

        return {
            stakingLogic,
            stakingProxy,
            stakingWrapper,
            zrxVault,
        };
    }

    /**
     * Deploy a set of token contracts.
     * @param environment The blockchain environment to use.
     * @param txDefaults Defaults to use when deploying the asset proxies.
     * @param options Specifies how many tokens of each standard to deploy.
     */
    protected static async _deployTokenContractsAsync(
        environment: BlockchainTestsEnvironment,
        txDefaults: Partial<TxData>,
        options: Partial<DeploymentOptions>,
    ): Promise<TokenContracts> {
        const numErc20TokensToDeploy =
            options.numErc20TokensToDeploy !== undefined
                ? options.numErc20TokensToDeploy
                : constants.NUM_DUMMY_ERC20_TO_DEPLOY;
        const numErc721TokensToDeploy =
            options.numErc721TokensToDeploy !== undefined
                ? options.numErc721TokensToDeploy
                : constants.NUM_DUMMY_ERC721_TO_DEPLOY;
        const numErc1155TokensToDeploy =
            options.numErc1155TokensToDeploy !== undefined
                ? options.numErc1155TokensToDeploy
                : constants.NUM_DUMMY_ERC1155_CONTRACTS_TO_DEPLOY;

        const erc20 = await Promise.all(
            _.times(numErc20TokensToDeploy, async () =>
                DummyERC20TokenContract.deployFrom0xArtifactAsync(
                    ERC20Artifacts.DummyERC20Token,
                    environment.provider,
                    txDefaults,
                    ERC20Artifacts,
                    constants.DUMMY_TOKEN_NAME,
                    constants.DUMMY_TOKEN_SYMBOL,
                    constants.DUMMY_TOKEN_DECIMALS,
                    constants.DUMMY_TOKEN_TOTAL_SUPPLY,
                ),
            ),
        );
        const erc721 = await Promise.all(
            _.times(numErc721TokensToDeploy, async () =>
                DummyERC721TokenContract.deployFrom0xArtifactAsync(
                    ERC721Artifacts.DummyERC721Token,
                    environment.provider,
                    txDefaults,
                    ERC721Artifacts,
                    constants.DUMMY_TOKEN_NAME,
                    constants.DUMMY_TOKEN_SYMBOL,
                ),
            ),
        );
        const erc1155 = await Promise.all(
            _.times(numErc1155TokensToDeploy, async () =>
                ERC1155MintableContract.deployFrom0xArtifactAsync(
                    ERC1155Artifacts.ERC1155Mintable,
                    environment.provider,
                    txDefaults,
                    ERC1155Artifacts,
                ),
            ),
        );

        const weth = await WETH9Contract.deployFrom0xArtifactAsync(
            ERC20Artifacts.WETH9,
            environment.provider,
            txDefaults,
            ERC20Artifacts,
        );
        const zrx = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
            ERC20Artifacts.DummyERC20Token,
            environment.provider,
            txDefaults,
            ERC20Artifacts,
            constants.DUMMY_TOKEN_NAME,
            constants.DUMMY_TOKEN_SYMBOL,
            constants.DUMMY_TOKEN_DECIMALS,
            constants.DUMMY_TOKEN_TOTAL_SUPPLY,
        );

        return {
            erc20,
            erc721,
            erc1155,
            weth,
            zrx,
        };
    }

    protected constructor(
        public assetProxies: AssetProxyContracts,
        public governor: ZeroExGovernorContract,
        public exchange: ExchangeContract,
        public staking: StakingContracts,
        public tokens: TokenContracts,
        public chainId: number,
        public accounts: string[],
        public txDefaults: Partial<TxData>,
        public devUtils: DevUtilsContract,
        public assetDataEncoder: IAssetDataContract,
        public txHelper: TransactionHelper,
    ) {}
}
// tslint:disable:max-file-line-count
