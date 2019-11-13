#!/usr/bin/env node
import * as wrappers from '@0x/abi-gen-wrappers';
import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { ExchangeContract } from '@0x/contracts-exchange';
import { ZeroExGovernorContract } from '@0x/contracts-multisig';
import { StakingContract, StakingProxyContract, ZrxVaultContract } from '@0x/contracts-staking';
import { EmptyWalletSubprovider, RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { AssetProxyId } from '@0x/types';
import { logUtils, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { SupportedProvider } from 'ethereum-types';

// NOTE: add your own Infura Project ID to RPC urls before running
const INFURA_PROJECT_ID = '';

const networkIdToRpcUrl = {
    1: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
    3: `https://ropsten.infura.io/v3/${INFURA_PROJECT_ID}`,
    4: `https://rinkeby.infura.io/v3/${INFURA_PROJECT_ID}`,
    42: `https://kovan.infura.io/v3/${INFURA_PROJECT_ID}`,
};

// tslint:disable:custom-no-magic-numbers
async function testContractConfigsAsync(provider: SupportedProvider): Promise<void> {
    const web3Wrapper = new Web3Wrapper(provider);
    const chainId = await web3Wrapper.getChainIdAsync();
    const addresses = getContractAddressesForChainOrThrow(chainId);

    function warnIfMismatch(actual: any, expected: any, message: string): void {
        if (actual !== expected) {
            logUtils.warn(`${message}: actual: ${actual}, expected: ${expected}, chainId: ${chainId}`);
        }
    }

    const exchange = new ExchangeContract(addresses.exchange, provider);
    const exchangeV2 = new ExchangeContract(addresses.exchangeV2, provider);
    const erc20Proxy = new wrappers.ERC20ProxyContract(addresses.erc20Proxy, provider);
    const erc721Proxy = new wrappers.ERC721ProxyContract(addresses.erc721Proxy, provider);
    const erc1155Proxy = new wrappers.ERC1155ProxyContract(addresses.erc1155Proxy, provider);
    const multiAssetProxy = new wrappers.MultiAssetProxyContract(addresses.multiAssetProxy, provider);
    const erc20BridgeProxy = new wrappers.ERC20ProxyContract(addresses.erc20BridgeProxy, provider);
    const governor = new ZeroExGovernorContract(addresses.zeroExGovernor, provider);
    const stakingProxy = new StakingProxyContract(addresses.stakingProxy, provider);
    const stakingContract = new StakingContract(addresses.stakingProxy, provider);
    const zrxVault = new ZrxVaultContract(addresses.zrxVault, provider);

    async function verifyExchangeV2ConfigsAsync(): Promise<void> {
        const exchangeOwner = await exchangeV2.owner().callAsync();
        warnIfMismatch(exchangeOwner, governor.address, 'Unexpected ExchangeV2 owner');

        const registeredERC20Proxy = await exchangeV2.getAssetProxy(AssetProxyId.ERC20).callAsync();
        warnIfMismatch(registeredERC20Proxy, erc20Proxy.address, 'Unexpected ERC20Proxy registered in ExchangeV2');

        const registeredERC721Proxy = await exchangeV2.getAssetProxy(AssetProxyId.ERC721).callAsync();
        warnIfMismatch(registeredERC721Proxy, erc721Proxy.address, 'Unexpected ERC721Proxy registered in ExchangeV2');

        const registeredERC1155Proxy = await exchangeV2.getAssetProxy(AssetProxyId.ERC1155).callAsync();
        warnIfMismatch(
            registeredERC1155Proxy,
            erc1155Proxy.address,
            'Unexpected ERC1155Proxy registered in ExchangeV2',
        );

        const registeredMultiAssetProxy = await exchangeV2.getAssetProxy(AssetProxyId.MultiAsset).callAsync();
        warnIfMismatch(
            registeredMultiAssetProxy,
            multiAssetProxy.address,
            'Unexpected MultiAssetProxy registered in ExchangeV2',
        );

        const registeredStaticCallProxy = await exchangeV2.getAssetProxy(AssetProxyId.StaticCall).callAsync();
        warnIfMismatch(
            registeredStaticCallProxy,
            addresses.staticCallProxy,
            'Unexpected StaticCallProxy registered in ExchangeV2',
        );
    }

    async function verifyExchangeV3ConfigsAsync(): Promise<void> {
        const exchangeOwner = await exchange.owner().callAsync();
        warnIfMismatch(exchangeOwner, governor.address, 'Unexpected Exchange owner');

        const registeredERC20Proxy = await exchange.getAssetProxy(AssetProxyId.ERC20).callAsync();
        warnIfMismatch(registeredERC20Proxy, erc20Proxy.address, 'Unexpected ERC20Proxy registered in Exchange');

        const registeredERC721Proxy = await exchange.getAssetProxy(AssetProxyId.ERC721).callAsync();
        warnIfMismatch(registeredERC721Proxy, erc721Proxy.address, 'Unexpected ERC721Proxy registered in Exchange');

        const registeredERC1155Proxy = await exchange.getAssetProxy(AssetProxyId.ERC1155).callAsync();
        warnIfMismatch(registeredERC1155Proxy, erc1155Proxy.address, 'Unexpected ERC1155Proxy registered in Exchange');

        const registeredMultiAssetProxy = await exchange.getAssetProxy(AssetProxyId.MultiAsset).callAsync();
        warnIfMismatch(
            registeredMultiAssetProxy,
            multiAssetProxy.address,
            'Unexpected MultiAssetProxy registered in Exchange',
        );

        const registeredStaticCallProxy = await exchange.getAssetProxy(AssetProxyId.StaticCall).callAsync();
        warnIfMismatch(
            registeredStaticCallProxy,
            addresses.staticCallProxy,
            'Unexpected StaticCallProxy registered in Exchange',
        );

        const protocolFeeCollector = await exchange.protocolFeeCollector().callAsync();
        warnIfMismatch(protocolFeeCollector, addresses.stakingProxy, 'Unexpected StakingProxy attached to Exchange');

        const protocolFeeMultiplier = await exchange.protocolFeeMultiplier().callAsync();
        warnIfMismatch(protocolFeeMultiplier.toString(), '150000', 'Unexpected protocolFeeMultiplier in Exchange');
    }

    async function verifyAssetProxyConfigsAsync(): Promise<void> {
        // Verify ERC20Proxy configs
        const erc20ProxyOwner = await erc20Proxy.owner().callAsync();
        warnIfMismatch(erc20ProxyOwner, governor.address, 'Unexpected ERC20Proxy owner');

        const erc20AuthorizedAddresses = await erc20Proxy.getAuthorizedAddresses().callAsync();
        warnIfMismatch(erc20AuthorizedAddresses.length, 4, 'Unexpected number of authorized addresses in ERC20Proxy');

        const isExchangeV2AuthorizedInERC20Proxy = await erc20Proxy.authorized(exchangeV2.address).callAsync();
        warnIfMismatch(isExchangeV2AuthorizedInERC20Proxy, true, 'ExchangeV2 not authorized in ERC20Proxy');

        const isExchangeAuthorizedInERC20Proxy = await erc20Proxy.authorized(exchange.address).callAsync();
        warnIfMismatch(isExchangeAuthorizedInERC20Proxy, true, 'Exchange not authorized in ERC20Proxy');

        const isMAPAuthorizedInER20Proxy = await erc20Proxy.authorized(multiAssetProxy.address).callAsync();
        warnIfMismatch(isMAPAuthorizedInER20Proxy, true, 'MultiAssetProxy not authorized in ERC20Proxy');

        const isZrxVaultAuthorizedInER20Proxy = await erc20Proxy.authorized(zrxVault.address).callAsync();
        warnIfMismatch(isZrxVaultAuthorizedInER20Proxy, true, 'ZrxVault not authorized in ERC20Proxy');

        // Verify ERC721Proxy configs
        const erc721ProxyOwner = await erc721Proxy.owner().callAsync();
        warnIfMismatch(erc721ProxyOwner, governor.address, 'Unexpected ERC721Proxy owner');

        const erc721AuthorizedAddresses = await erc721Proxy.getAuthorizedAddresses().callAsync();
        warnIfMismatch(erc721AuthorizedAddresses.length, 3, 'Unexpected number of authorized addresses in ERC721Proxy');

        const isExchangeV2AuthorizedInERC721Proxy = await erc721Proxy.authorized(exchangeV2.address).callAsync();
        warnIfMismatch(isExchangeV2AuthorizedInERC721Proxy, true, 'ExchangeV2 not authorized in ERC721Proxy');

        const isExchangeAuthorizedInERC721Proxy = await erc721Proxy.authorized(exchange.address).callAsync();
        warnIfMismatch(isExchangeAuthorizedInERC721Proxy, true, 'Exchange not authorized in ERC721Proxy');

        const isMAPAuthorizedInER721Proxy = await erc721Proxy.authorized(multiAssetProxy.address).callAsync();
        warnIfMismatch(isMAPAuthorizedInER721Proxy, true, 'MultiAssetProxy not authorized in ERC721Proxy');

        // Verify ERC1155Proxy configs
        const erc1155ProxyOwner = await erc1155Proxy.owner().callAsync();
        warnIfMismatch(erc1155ProxyOwner, governor.address, 'Unexpected ERC1155Proxy owner');

        const erc1155AuthorizedAddresses = await erc1155Proxy.getAuthorizedAddresses().callAsync();
        warnIfMismatch(
            erc1155AuthorizedAddresses.length,
            3,
            'Unexpected number of authorized addresses in ERC1155Proxy',
        );

        const isExchangeV2AuthorizedInERC1155Proxy = await erc1155Proxy.authorized(exchangeV2.address).callAsync();
        warnIfMismatch(isExchangeV2AuthorizedInERC1155Proxy, true, 'ExchangeV2 not authorized in ERC1155Proxy');

        const isExchangeAuthorizedInERC1155Proxy = await erc1155Proxy.authorized(exchange.address).callAsync();
        warnIfMismatch(isExchangeAuthorizedInERC1155Proxy, true, 'Exchange not authorized in ERC1155Proxy');

        const isMAPAuthorizedInERC1155Proxy = await erc1155Proxy.authorized(multiAssetProxy.address).callAsync();
        warnIfMismatch(isMAPAuthorizedInERC1155Proxy, true, 'MultiAssetProxy not authorized in ERC1155Proxy');

        // Verify ERC20BridgeProxy configs
        const erc20BridgeProxyOwner = await erc20BridgeProxy.owner().callAsync();
        warnIfMismatch(erc20BridgeProxyOwner, governor.address, 'Unexpected ERC20BridgeProxy owner');

        const erc20BridgeAuthorizedAddresses = await erc20BridgeProxy.getAuthorizedAddresses().callAsync();
        warnIfMismatch(
            erc20BridgeAuthorizedAddresses.length,
            2,
            'Unexpected number of authorized addresses in ERC20BridgeProxy',
        );

        const isExchangeAuthorizedInERC20BridgeProxy = await erc20BridgeProxy.authorized(exchange.address).callAsync();
        warnIfMismatch(isExchangeAuthorizedInERC20BridgeProxy, true, 'Exchange not authorized in ERC20BridgeProxy');

        const isMAPAuthorizedInERC20BridgeProxy = await erc20BridgeProxy
            .authorized(multiAssetProxy.address)
            .callAsync();
        warnIfMismatch(isMAPAuthorizedInERC20BridgeProxy, true, 'MultiAssetProxy not authorized in ERC20BridgeProxy');

        // Verify MultiAssetProxy configs
        const multiAssetProxyOwner = await multiAssetProxy.owner().callAsync();
        warnIfMismatch(multiAssetProxyOwner, governor.address, 'Unexpected MultiAssetProxy owner');

        const multiAssetProxyAuthorizedAddresses = await multiAssetProxy.getAuthorizedAddresses().callAsync();
        warnIfMismatch(
            multiAssetProxyAuthorizedAddresses.length,
            2,
            'Unexpected number of authorized addresses in MultiAssetProxy',
        );

        const isExchangeV2AuthorizedInMultiAssetProxy = await multiAssetProxy
            .authorized(exchangeV2.address)
            .callAsync();
        warnIfMismatch(isExchangeV2AuthorizedInMultiAssetProxy, true, 'ExchangeV2 not authorized in MultiAssetProxy');

        const isExchangeAuthorizedInMultiAssetProxy = await multiAssetProxy.authorized(exchange.address).callAsync();
        warnIfMismatch(isExchangeAuthorizedInMultiAssetProxy, true, 'Exchange not authorized in MultiAssetProxy');

        const registeredERC20ProxyInMAP = await multiAssetProxy.getAssetProxy(AssetProxyId.ERC20).callAsync();
        warnIfMismatch(
            registeredERC20ProxyInMAP,
            erc20Proxy.address,
            'Unexpected ERC20Proxy registered in MultiAssetProxy',
        );

        const registeredERC721ProxyInMAP = await multiAssetProxy.getAssetProxy(AssetProxyId.ERC721).callAsync();
        warnIfMismatch(
            registeredERC721ProxyInMAP,
            erc721Proxy.address,
            'Unexpected ERC721Proxy registered in MultiAssetProxy',
        );

        const registeredERC1155ProxyInMAP = await multiAssetProxy.getAssetProxy(AssetProxyId.ERC1155).callAsync();
        warnIfMismatch(
            registeredERC1155ProxyInMAP,
            erc1155Proxy.address,
            'Unexpected ERC1155Proxy registered in MultiAssetProxy',
        );

        const registeredStaticCallProxyInMAP = await multiAssetProxy.getAssetProxy(AssetProxyId.StaticCall).callAsync();
        warnIfMismatch(
            registeredStaticCallProxyInMAP,
            addresses.staticCallProxy,
            'Unexpected StaticCallProxy registered in MultiAssetProxy',
        );

        const registeredERC20BridgeProxyInMAP = await multiAssetProxy
            .getAssetProxy(AssetProxyId.ERC20Bridge)
            .callAsync();
        warnIfMismatch(
            registeredERC20BridgeProxyInMAP,
            addresses.erc20BridgeProxy,
            'Unexpected ERC20BridgeProxy registered in MultiAssetProxy',
        );
    }

    async function verifyStakingConfigsAsync(): Promise<void> {
        const stakingLogicAddress = await stakingProxy.stakingContract().callAsync();
        warnIfMismatch(stakingLogicAddress, addresses.staking, 'Unexpected Staking contract attached to StakingProxy');

        const zrxVaultAddress = await stakingContract.getZrxVault().callAsync();
        warnIfMismatch(zrxVaultAddress, addresses.zrxVault, 'Unexpected ZrxVault set in Staking contract');

        const wethAddress = await stakingContract.getWethContract().callAsync();
        warnIfMismatch(wethAddress, addresses.etherToken, 'Unexpected WETH contract set in Staking contract');

        const stakingProxyOwner = await stakingProxy.owner().callAsync();
        warnIfMismatch(stakingProxyOwner, addresses.zeroExGovernor, 'Unexpected StakingProxy owner');

        const zrxVaultOwner = await zrxVault.owner().callAsync();
        warnIfMismatch(zrxVaultOwner, addresses.zeroExGovernor, 'Unexpected ZrxVault owner');

        const stakingProxyAuthorizedAddresses = await stakingProxy.getAuthorizedAddresses().callAsync();
        warnIfMismatch(
            stakingProxyAuthorizedAddresses.length,
            1,
            'Unexpected number of authorized addresses in StakingProxy',
        );
        const isGovernorAuthorizedInStakingProxy = await stakingProxy.authorized(addresses.zeroExGovernor).callAsync();
        warnIfMismatch(isGovernorAuthorizedInStakingProxy, true, 'ZeroExGovernor not authorized in StakingProxy');

        const zrxVaultAuthorizedAddresses = await zrxVault.getAuthorizedAddresses().callAsync();
        warnIfMismatch(zrxVaultAuthorizedAddresses.length, 1, 'Unexpected number of authorized addresses in ZrxVault');
        const isGovernorAuthorizedInZrxVault = await zrxVault.authorized(addresses.zeroExGovernor).callAsync();
        warnIfMismatch(isGovernorAuthorizedInZrxVault, true, 'ZeroExGovernor not authorized in ZrxVault');
    }

    // TODO: implement ZeroExGovernor config tests
    // async function verifyAssetProxyOwnerConfigsAsync(): Promise<void> {}

    await verifyExchangeV2ConfigsAsync();
    await verifyExchangeV3ConfigsAsync();
    await verifyStakingConfigsAsync();
    await verifyAssetProxyConfigsAsync();
}

(async () => {
    for (const rpcUrl of Object.values(networkIdToRpcUrl)) {
        const provider = new Web3ProviderEngine();
        provider.addProvider(new EmptyWalletSubprovider());
        provider.addProvider(new RPCSubprovider(rpcUrl));
        providerUtils.startProviderEngine(provider);
        await testContractConfigsAsync(provider);
    }
})().catch(err => {
    logUtils.log(err);
    process.exit(1);
});
