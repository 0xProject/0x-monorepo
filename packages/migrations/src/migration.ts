import { ContractAddresses, getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import {
    artifacts as assetProxyArtifacts,
    ERC1155ProxyContract,
    ERC20BridgeProxyContract,
    ERC20ProxyContract,
    ERC721ProxyContract,
    MultiAssetProxyContract,
    StaticCallProxyContract,
} from '@0x/contracts-asset-proxy';
import {
    artifacts as coordinatorArtifacts,
    CoordinatorContract,
    CoordinatorRegistryContract,
} from '@0x/contracts-coordinator';
import { artifacts as devUtilsArtifacts, DevUtilsContract } from '@0x/contracts-dev-utils';
import { artifacts as erc1155Artifacts } from '@0x/contracts-erc1155';
import { artifacts as erc20Artifacts, DummyERC20TokenContract, WETH9Contract } from '@0x/contracts-erc20';
import { artifacts as erc20BridgeSamplerArtifacts } from '@0x/contracts-erc20-bridge-sampler';
import { artifacts as erc721Artifacts, DummyERC721TokenContract } from '@0x/contracts-erc721';
import { artifacts as exchangeArtifacts, ExchangeContract } from '@0x/contracts-exchange';
import { artifacts as forwarderArtifacts, ForwarderContract } from '@0x/contracts-exchange-forwarder';
import {
    artifacts as stakingArtifacts,
    StakingProxyContract,
    TestStakingContract,
    ZrxVaultContract,
} from '@0x/contracts-staking';
import {
    AffiliateFeeTransformerContract,
    artifacts as exchangeProxyArtifacts,
    FillQuoteTransformerContract,
    fullMigrateAsync as fullMigrateExchangeProxyAsync,
    ITokenSpenderContract,
    ITransformERC20Contract,
    PayTakerTransformerContract,
    WethTransformerContract,
    ZeroExContract,
} from '@0x/contracts-zero-ex';
import { Web3ProviderEngine, ZeroExProvider } from '@0x/subproviders';
import { BigNumber, providerUtils } from '@0x/utils';
import { SupportedProvider, TxData } from 'ethereum-types';

import { constants } from './utils/constants';
import { erc20TokenInfo, erc721TokenInfo } from './utils/token_info';

const allArtifacts = {
    ...assetProxyArtifacts,
    ...coordinatorArtifacts,
    ...devUtilsArtifacts,
    ...erc1155Artifacts,
    ...erc20Artifacts,
    ...erc721Artifacts,
    ...exchangeArtifacts,
    ...forwarderArtifacts,
    ...stakingArtifacts,
    ...erc20BridgeSamplerArtifacts,
    ...exchangeProxyArtifacts,
};

const { NULL_ADDRESS } = constants;
const NULL_ADDRESSES = {
    erc20Proxy: NULL_ADDRESS,
    erc721Proxy: NULL_ADDRESS,
    erc1155Proxy: NULL_ADDRESS,
    zrxToken: NULL_ADDRESS,
    etherToken: NULL_ADDRESS,
    exchange: NULL_ADDRESS,
    assetProxyOwner: NULL_ADDRESS,
    erc20BridgeProxy: NULL_ADDRESS,
    zeroExGovernor: NULL_ADDRESS,
    forwarder: NULL_ADDRESS,
    coordinatorRegistry: NULL_ADDRESS,
    coordinator: NULL_ADDRESS,
    multiAssetProxy: NULL_ADDRESS,
    staticCallProxy: NULL_ADDRESS,
    devUtils: NULL_ADDRESS,
    exchangeV2: NULL_ADDRESS,
    zrxVault: NULL_ADDRESS,
    staking: NULL_ADDRESS,
    stakingProxy: NULL_ADDRESS,
    uniswapBridge: NULL_ADDRESS,
    eth2DaiBridge: NULL_ADDRESS,
    kyberBridge: NULL_ADDRESS,
    erc20BridgeSampler: NULL_ADDRESS,
    chaiBridge: NULL_ADDRESS,
    dydxBridge: NULL_ADDRESS,
    curveBridge: NULL_ADDRESS,
    uniswapV2Bridge: NULL_ADDRESS,
    godsUnchainedValidator: NULL_ADDRESS,
    broker: NULL_ADDRESS,
    chainlinkStopLimit: NULL_ADDRESS,
    maximumGasPrice: NULL_ADDRESS,
    dexForwarderBridge: NULL_ADDRESS,
    multiBridge: NULL_ADDRESS,
    balancerBridge: NULL_ADDRESS,
    exchangeProxyGovernor: NULL_ADDRESS,
    exchangeProxy: NULL_ADDRESS,
    exchangeProxyAllowanceTarget: NULL_ADDRESS,
    exchangeProxyTransformerDeployer: NULL_ADDRESS,
    exchangeProxyFlashWallet: NULL_ADDRESS,
    transformers: {
        wethTransformer: NULL_ADDRESS,
        payTakerTransformer: NULL_ADDRESS,
        fillQuoteTransformer: NULL_ADDRESS,
        affiliateFeeTransformer: NULL_ADDRESS,
    },
};

/**
 * Creates and deploys all the contracts that are required for the latest
 * version of the 0x protocol.
 * @param supportedProvider  Web3 provider instance. Your provider instance should connect to the testnet you want to deploy to.
 * @param txDefaults Default transaction values to use when deploying contracts (e.g., specify the desired contract creator with the `from` parameter).
 * @returns The addresses of the contracts that were deployed.
 */
export async function runMigrationsAsync(
    supportedProvider: SupportedProvider,
    txDefaults: TxData,
): Promise<ContractAddresses> {
    const provider = providerUtils.standardizeOrThrow(supportedProvider);
    const chainId = new BigNumber(await providerUtils.getChainIdAsync(provider));
    const { exchangeV2 } = getContractAddressesForChainOrThrow(chainId.toNumber());

    const zrxToken = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
        erc20Artifacts.DummyERC20Token,
        provider,
        txDefaults,
        allArtifacts,
        '0x Protocol Token',
        'ZRX',
        new BigNumber(18),
        new BigNumber(1000000000000000000000000000),
    );

    // Ether token
    const etherToken = await WETH9Contract.deployFrom0xArtifactAsync(
        erc20Artifacts.WETH9,
        provider,
        txDefaults,
        allArtifacts,
    );

    await _migrateDummyTokensAsync(provider, txDefaults);

    // Exchange
    const exchange = await ExchangeContract.deployFrom0xArtifactAsync(
        exchangeArtifacts.Exchange,
        provider,
        txDefaults,
        allArtifacts,
        chainId,
    );

    // CoordinatorRegistry
    const coordinatorRegistry = await CoordinatorRegistryContract.deployFrom0xArtifactAsync(
        coordinatorArtifacts.CoordinatorRegistry,
        provider,
        txDefaults,
        allArtifacts,
    );

    // Coordinator
    const coordinator = await CoordinatorContract.deployFrom0xArtifactAsync(
        coordinatorArtifacts.Coordinator,
        provider,
        txDefaults,
        allArtifacts,
        exchange.address,
        chainId,
    );

    const [
        erc20Proxy,
        erc721Proxy,
        erc1155Proxy,
        staticCallProxy,
        multiAssetProxy,
        erc20BridgeProxy,
    ] = await _migrateAssetProxiesAsync(exchange, provider, txDefaults);

    // Dev Utils
    const devUtils = await DevUtilsContract.deployWithLibrariesFrom0xArtifactAsync(
        devUtilsArtifacts.DevUtils,
        devUtilsArtifacts,
        provider,
        txDefaults,
        allArtifacts,
        exchange.address,
        NULL_ADDRESS,
        NULL_ADDRESS,
    );

    const [zrxVault, stakingLogic, stakingProxy] = await _migrateStakingAsync(
        exchange,
        erc20Proxy,
        zrxToken.address,
        etherToken.address,
        provider,
        txDefaults,
    );

    // Forwarder
    // Deployed after Exchange and Staking is configured as it queries
    // in the constructor
    const forwarder = await ForwarderContract.deployFrom0xArtifactAsync(
        forwarderArtifacts.Forwarder,
        provider,
        txDefaults,
        allArtifacts,
        exchange.address,
        exchangeV2,
        etherToken.address,
    );

    const [
        exchangeProxy,
        fillQuoteTransformer,
        payTakerTransformer,
        wethTransformer,
        affiliateFeeTransformer,
        exchangeProxyFlashWalletAddress,
        exchangeProxyAllowanceTargetAddress,
    ] = await _migrateExchangeProxyAsync(exchange, etherToken.address, provider, txDefaults);

    const contractAddresses = {
        ...NULL_ADDRESSES,
        erc20Proxy: erc20Proxy.address,
        erc721Proxy: erc721Proxy.address,
        erc1155Proxy: erc1155Proxy.address,
        zrxToken: zrxToken.address,
        etherToken: etherToken.address,
        exchange: exchange.address,
        erc20BridgeProxy: erc20BridgeProxy.address,
        forwarder: forwarder.address,
        coordinatorRegistry: coordinatorRegistry.address,
        coordinator: coordinator.address,
        multiAssetProxy: multiAssetProxy.address,
        staticCallProxy: staticCallProxy.address,
        devUtils: devUtils.address,
        zrxVault: zrxVault.address,
        staking: stakingLogic.address,
        stakingProxy: stakingProxy.address,
        exchangeProxy: exchangeProxy.address,
        exchangeProxyAllowanceTarget: exchangeProxyAllowanceTargetAddress,
        exchangeProxyTransformerDeployer: txDefaults.from,
        exchangeProxyFlashWallet: exchangeProxyFlashWalletAddress,
        transformers: {
            wethTransformer: wethTransformer.address,
            payTakerTransformer: payTakerTransformer.address,
            fillQuoteTransformer: fillQuoteTransformer.address,
            affiliateFeeTransformer: affiliateFeeTransformer.address,
        },
    };
    return contractAddresses;
}

async function _migrateAssetProxiesAsync(
    exchange: ExchangeContract,
    provider: ZeroExProvider,
    txDefaults: TxData,
): Promise<
    [
        ERC20ProxyContract,
        ERC721ProxyContract,
        ERC1155ProxyContract,
        StaticCallProxyContract,
        MultiAssetProxyContract,
        ERC20BridgeProxyContract
    ]
> {
    // Proxies
    const erc20Proxy = await ERC20ProxyContract.deployFrom0xArtifactAsync(
        assetProxyArtifacts.ERC20Proxy,
        provider,
        txDefaults,
        allArtifacts,
    );
    const erc721Proxy = await ERC721ProxyContract.deployFrom0xArtifactAsync(
        assetProxyArtifacts.ERC721Proxy,
        provider,
        txDefaults,
        allArtifacts,
    );

    // 1155 Asset Proxy
    const erc1155Proxy = await ERC1155ProxyContract.deployFrom0xArtifactAsync(
        assetProxyArtifacts.ERC1155Proxy,
        provider,
        txDefaults,
        allArtifacts,
    );

    const staticCallProxy = await StaticCallProxyContract.deployFrom0xArtifactAsync(
        assetProxyArtifacts.StaticCallProxy,
        provider,
        txDefaults,
        allArtifacts,
    );

    const multiAssetProxy = await MultiAssetProxyContract.deployFrom0xArtifactAsync(
        assetProxyArtifacts.MultiAssetProxy,
        provider,
        txDefaults,
        allArtifacts,
    );

    const erc20BridgeProxy = await ERC20BridgeProxyContract.deployFrom0xArtifactAsync(
        assetProxyArtifacts.ERC20BridgeProxy,
        provider,
        txDefaults,
        allArtifacts,
    );

    await erc20Proxy.addAuthorizedAddress(exchange.address).awaitTransactionSuccessAsync(txDefaults);
    await erc721Proxy.addAuthorizedAddress(exchange.address).awaitTransactionSuccessAsync(txDefaults);
    await erc1155Proxy.addAuthorizedAddress(exchange.address).awaitTransactionSuccessAsync(txDefaults);
    await multiAssetProxy.addAuthorizedAddress(exchange.address).awaitTransactionSuccessAsync(txDefaults);
    await erc20BridgeProxy.addAuthorizedAddress(exchange.address).awaitTransactionSuccessAsync(txDefaults);

    // MultiAssetProxy
    await erc20Proxy.addAuthorizedAddress(multiAssetProxy.address).awaitTransactionSuccessAsync(txDefaults);
    await erc721Proxy.addAuthorizedAddress(multiAssetProxy.address).awaitTransactionSuccessAsync(txDefaults);
    await erc1155Proxy.addAuthorizedAddress(multiAssetProxy.address).awaitTransactionSuccessAsync(txDefaults);
    await erc20BridgeProxy.addAuthorizedAddress(multiAssetProxy.address).awaitTransactionSuccessAsync(txDefaults);
    await multiAssetProxy.registerAssetProxy(erc20Proxy.address).awaitTransactionSuccessAsync(txDefaults);
    await multiAssetProxy.registerAssetProxy(erc721Proxy.address).awaitTransactionSuccessAsync(txDefaults);
    await multiAssetProxy.registerAssetProxy(erc1155Proxy.address).awaitTransactionSuccessAsync(txDefaults);
    await multiAssetProxy.registerAssetProxy(staticCallProxy.address).awaitTransactionSuccessAsync(txDefaults);
    await multiAssetProxy.registerAssetProxy(erc20BridgeProxy.address).awaitTransactionSuccessAsync(txDefaults);

    // Register the Asset Proxies to the Exchange
    await exchange.registerAssetProxy(erc20Proxy.address).awaitTransactionSuccessAsync(txDefaults);
    await exchange.registerAssetProxy(erc721Proxy.address).awaitTransactionSuccessAsync(txDefaults);
    await exchange.registerAssetProxy(erc1155Proxy.address).awaitTransactionSuccessAsync(txDefaults);
    await exchange.registerAssetProxy(multiAssetProxy.address).awaitTransactionSuccessAsync(txDefaults);
    await exchange.registerAssetProxy(staticCallProxy.address).awaitTransactionSuccessAsync(txDefaults);
    await exchange.registerAssetProxy(erc20BridgeProxy.address).awaitTransactionSuccessAsync(txDefaults);

    return [erc20Proxy, erc721Proxy, erc1155Proxy, staticCallProxy, multiAssetProxy, erc20BridgeProxy];
}

async function _migrateStakingAsync(
    exchange: ExchangeContract,
    erc20Proxy: ERC20ProxyContract,
    zrxTokenAddress: string,
    etherTokenAddress: string,
    provider: ZeroExProvider,
    txDefaults: TxData,
): Promise<[ZrxVaultContract, TestStakingContract, StakingProxyContract]> {
    const zrxVault = await ZrxVaultContract.deployFrom0xArtifactAsync(
        stakingArtifacts.ZrxVault,
        provider,
        txDefaults,
        allArtifacts,
        erc20Proxy.address,
        zrxTokenAddress,
    );

    // Note we use TestStakingContract as the deployed bytecode of a StakingContract
    // has the tokens hardcoded
    const stakingLogic = await TestStakingContract.deployFrom0xArtifactAsync(
        stakingArtifacts.TestStaking,
        provider,
        txDefaults,
        allArtifacts,
        etherTokenAddress,
        zrxVault.address,
    );

    const stakingProxy = await StakingProxyContract.deployFrom0xArtifactAsync(
        stakingArtifacts.StakingProxy,
        provider,
        txDefaults,
        allArtifacts,
        stakingLogic.address,
    );

    await erc20Proxy.addAuthorizedAddress(zrxVault.address).awaitTransactionSuccessAsync(txDefaults);

    // Reference the Proxy as the StakingContract for setup
    const stakingDel = await new TestStakingContract(stakingProxy.address, provider, txDefaults);
    await stakingProxy.addAuthorizedAddress(txDefaults.from).awaitTransactionSuccessAsync(txDefaults);
    await stakingDel.addExchangeAddress(exchange.address).awaitTransactionSuccessAsync(txDefaults);
    await exchange.setProtocolFeeCollectorAddress(stakingProxy.address).awaitTransactionSuccessAsync(txDefaults);
    await exchange.setProtocolFeeMultiplier(new BigNumber(70000)).awaitTransactionSuccessAsync(txDefaults);

    await zrxVault.addAuthorizedAddress(txDefaults.from).awaitTransactionSuccessAsync(txDefaults);
    await zrxVault.setStakingProxy(stakingProxy.address).awaitTransactionSuccessAsync(txDefaults);
    await stakingLogic.addAuthorizedAddress(txDefaults.from).awaitTransactionSuccessAsync(txDefaults);
    await stakingLogic.addExchangeAddress(exchange.address).awaitTransactionSuccessAsync(txDefaults);

    return [zrxVault, stakingLogic, stakingProxy];
}

async function _migrateExchangeProxyAsync(
    exchange: ExchangeContract,
    etherTokenAddress: string,
    provider: ZeroExProvider,
    txDefaults: TxData,
): Promise<
    [
        ZeroExContract,
        FillQuoteTransformerContract,
        PayTakerTransformerContract,
        WethTransformerContract,
        AffiliateFeeTransformerContract,
        string,
        string
    ]
> {
    const exchangeProxy = await fullMigrateExchangeProxyAsync(txDefaults.from, provider, txDefaults);
    const exchangeProxyAllowanceTargetAddress = await new ITokenSpenderContract(
        exchangeProxy.address,
        provider,
        txDefaults,
    )
        .getAllowanceTarget()
        .callAsync();
    const exchangeProxyFlashWalletAddress = await new ITransformERC20Contract(exchangeProxy.address, provider)
        .getTransformWallet()
        .callAsync();

    // Deploy transformers.
    const fillQuoteTransformer = await FillQuoteTransformerContract.deployFrom0xArtifactAsync(
        exchangeProxyArtifacts.FillQuoteTransformer,
        provider,
        txDefaults,
        allArtifacts,
        exchange.address,
    );
    const payTakerTransformer = await PayTakerTransformerContract.deployFrom0xArtifactAsync(
        exchangeProxyArtifacts.PayTakerTransformer,
        provider,
        txDefaults,
        allArtifacts,
    );
    const wethTransformer = await WethTransformerContract.deployFrom0xArtifactAsync(
        exchangeProxyArtifacts.WethTransformer,
        provider,
        txDefaults,
        allArtifacts,
        etherTokenAddress,
    );
    const affiliateFeeTransformer = await AffiliateFeeTransformerContract.deployFrom0xArtifactAsync(
        exchangeProxyArtifacts.AffiliateFeeTransformer,
        provider,
        txDefaults,
        allArtifacts,
    );

    return [
        exchangeProxy,
        fillQuoteTransformer,
        payTakerTransformer,
        wethTransformer,
        affiliateFeeTransformer,
        exchangeProxyFlashWalletAddress,
        exchangeProxyAllowanceTargetAddress,
    ];
}

async function _migrateDummyTokensAsync(provider: ZeroExProvider, txDefaults: TxData): Promise<void> {
    // Dummy ERC20 tokens
    for (const token of erc20TokenInfo) {
        const totalSupply = new BigNumber(1000000000000000000000000000);
        await DummyERC20TokenContract.deployFrom0xArtifactAsync(
            erc20Artifacts.DummyERC20Token,
            provider,
            txDefaults,
            allArtifacts,
            token.name,
            token.symbol,
            token.decimals,
            totalSupply,
        );
    }

    // Dummy ERC721 token
    await DummyERC721TokenContract.deployFrom0xArtifactAsync(
        erc721Artifacts.DummyERC721Token,
        provider,
        txDefaults,
        allArtifacts,
        erc721TokenInfo[0].name,
        erc721TokenInfo[0].symbol,
    );
}

let _cachedContractAddresses: ContractAddresses;

/**
 * Exactly like runMigrationsAsync but will only run the migrations the first
 * time it is called. Any subsequent calls will return the cached contract
 * addresses.
 * @param provider  Web3 provider instance. Your provider instance should connect to the testnet you want to deploy to.
 * @param txDefaults Default transaction values to use when deploying contracts (e.g., specify the desired contract creator with the `from` parameter).
 * @returns The addresses of the contracts that were deployed.
 */
export async function runMigrationsOnceAsync(
    provider: Web3ProviderEngine,
    txDefaults: TxData,
): Promise<ContractAddresses> {
    if (_cachedContractAddresses !== undefined) {
        return _cachedContractAddresses;
    }
    _cachedContractAddresses = await runMigrationsAsync(provider, txDefaults);
    return _cachedContractAddresses;
}
// tslint:disable-next-line: max-file-line-count
