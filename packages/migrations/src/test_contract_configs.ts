#!/usr/bin/env node
import * as wrappers from '@0x/abi-gen-wrappers';
import { getContractAddressesForNetworkOrThrow } from '@0x/contract-addresses';
import { EmptyWalletSubprovider, RPCSubprovider, Web3ProviderEngine } from '@0x/subproviders';
import { AssetProxyId } from '@0x/types';
import { logUtils, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { SupportedProvider } from 'ethereum-types';

// NOTE: add your own Infura Project ID to RPC urls before running
const networkIdToRpcUrl = {
    1: 'https://mainnet.infura.io/v3/',
    3: 'https://ropsten.infura.io/v3/',
    4: 'https://rinkeby.infura.io/v3/',
    42: 'https://kovan.infura.io/v3/',
};

async function testContractConfigsAsync(provider: SupportedProvider): Promise<void> {
    const web3Wrapper = new Web3Wrapper(provider);
    const networkId = await web3Wrapper.getNetworkIdAsync();
    const addresses = getContractAddressesForNetworkOrThrow(networkId);

    function warnIfMismatch(actual: any, expected: any, message: string): void {
        if (actual !== expected) {
            logUtils.warn(`${message}: actual: ${actual}, expected: ${expected}, networkId: ${networkId}`);
        }
    }

    const exchange = new wrappers.ExchangeContract(addresses.exchange, provider);
    const erc20Proxy = new wrappers.ERC20ProxyContract(addresses.erc20Proxy, provider);
    const erc721Proxy = new wrappers.ERC721ProxyContract(addresses.erc721Proxy, provider);
    const erc1155Proxy = new wrappers.ERC1155ProxyContract(addresses.erc1155Proxy, provider);
    const multiAssetProxy = new wrappers.MultiAssetProxyContract(addresses.multiAssetProxy, provider);
    const assetProxyOwner = new wrappers.AssetProxyOwnerContract(addresses.assetProxyOwner, provider);

    // Verify Exchange configs
    const exchangeOwner = await exchange.owner.callAsync();
    warnIfMismatch(exchangeOwner, assetProxyOwner.address, 'Unexpected Exchange owner');

    const registeredERC20Proxy = await exchange.getAssetProxy.callAsync(AssetProxyId.ERC20);
    warnIfMismatch(registeredERC20Proxy, erc20Proxy.address, 'Unexpected ERC20Proxy registered in Exchange');

    const registeredERC721Proxy = await exchange.getAssetProxy.callAsync(AssetProxyId.ERC721);
    warnIfMismatch(registeredERC721Proxy, erc721Proxy.address, 'Unexpected ERC721Proxy registered in Exchange');

    const registeredERC1155Proxy = await exchange.getAssetProxy.callAsync(AssetProxyId.ERC1155);
    warnIfMismatch(registeredERC1155Proxy, erc1155Proxy.address, 'Unexpected ERC1155Proxy registered in Exchange');

    const registeredMultiAssetProxy = await exchange.getAssetProxy.callAsync(AssetProxyId.MultiAsset);
    warnIfMismatch(
        registeredMultiAssetProxy,
        multiAssetProxy.address,
        'Unexpected MultiAssetProxy registered in Exchange',
    );

    const registeredStaticCallProxy = await exchange.getAssetProxy.callAsync(AssetProxyId.StaticCall);
    warnIfMismatch(
        registeredStaticCallProxy,
        addresses.staticCallProxy,
        'Unexpected StaticCallProxy registered in Exchange',
    );

    // Verify ERC20Proxy configs
    const erc20ProxyOwner = await erc20Proxy.owner.callAsync();
    warnIfMismatch(erc20ProxyOwner, assetProxyOwner.address, 'Unexpected ERC20Proxy owner');

    const erc20AuthorizedAddresses = await erc20Proxy.getAuthorizedAddresses.callAsync();
    warnIfMismatch(erc20AuthorizedAddresses.length, 2, 'Unexpected number of authorized addresses in ERC20Proxy');

    const isExchangeAuthorizedInERC20Proxy = await erc20Proxy.authorized.callAsync(exchange.address);
    warnIfMismatch(isExchangeAuthorizedInERC20Proxy, true, 'Exchange not authorized in ERC20Proxy');

    const isMAPAuthorizedInER20Proxy = await erc20Proxy.authorized.callAsync(multiAssetProxy.address);
    warnIfMismatch(isMAPAuthorizedInER20Proxy, true, 'MultiAssetProxy not authorized in ERC20Proxy');

    // Verify ERC721Proxy configs
    const erc721ProxyOwner = await erc721Proxy.owner.callAsync();
    warnIfMismatch(erc721ProxyOwner, assetProxyOwner.address, 'Unexpected ERC721Proxy owner');

    const erc721AuthorizedAddresses = await erc721Proxy.getAuthorizedAddresses.callAsync();
    warnIfMismatch(erc721AuthorizedAddresses.length, 2, 'Unexpected number of authorized addresses in ERC721Proxy');

    const isExchangeAuthorizedInERC721Proxy = await erc721Proxy.authorized.callAsync(exchange.address);
    warnIfMismatch(isExchangeAuthorizedInERC721Proxy, true, 'Exchange not authorized in ERC721Proxy');

    const isMAPAuthorizedInER721Proxy = await erc721Proxy.authorized.callAsync(multiAssetProxy.address);
    warnIfMismatch(isMAPAuthorizedInER721Proxy, true, 'MultiAssetProxy not authorized in ERC721Proxy');

    // Verify ERC1155Proxy configs
    const erc1155ProxyOwner = await erc1155Proxy.owner.callAsync();
    warnIfMismatch(erc1155ProxyOwner, assetProxyOwner.address, 'Unexpected ERC1155Proxy owner');

    const erc1155AuthorizedAddresses = await erc1155Proxy.getAuthorizedAddresses.callAsync();
    warnIfMismatch(erc1155AuthorizedAddresses.length, 2, 'Unexpected number of authorized addresses in ERC1155Proxy');

    const isExchangeAuthorizedInERC1155Proxy = await erc1155Proxy.authorized.callAsync(exchange.address);
    warnIfMismatch(isExchangeAuthorizedInERC1155Proxy, true, 'Exchange not authorized in ERC1155Proxy');

    const isMAPAuthorizedInER1155Proxy = await erc1155Proxy.authorized.callAsync(multiAssetProxy.address);
    warnIfMismatch(isMAPAuthorizedInER1155Proxy, true, 'MultiAssetProxy not authorized in ERC1155Proxy');

    // Verify MultiAssetProxy configs
    const multiAssetProxyOwner = await multiAssetProxy.owner.callAsync();
    warnIfMismatch(multiAssetProxyOwner, assetProxyOwner.address, 'Unexpected MultiAssetProxy owner');

    const multiAssetProxyAuthorizedAddresses = await multiAssetProxy.getAuthorizedAddresses.callAsync();
    warnIfMismatch(
        multiAssetProxyAuthorizedAddresses.length,
        1,
        'Unexpected number of authorized addresses in MultiAssetProxy',
    );

    const isExchangeAuthorizedInMultiAssetProxy = await multiAssetProxy.authorized.callAsync(exchange.address);
    warnIfMismatch(isExchangeAuthorizedInMultiAssetProxy, true, 'Exchange not authorized in MultiAssetProxy');

    const registeredERC20ProxyInMAP = await exchange.getAssetProxy.callAsync(AssetProxyId.ERC20);
    warnIfMismatch(
        registeredERC20ProxyInMAP,
        erc20Proxy.address,
        'Unexpected ERC20Proxy registered in MultiAssetProxy',
    );

    const registeredERC721ProxyInMAP = await exchange.getAssetProxy.callAsync(AssetProxyId.ERC721);
    warnIfMismatch(
        registeredERC721ProxyInMAP,
        erc721Proxy.address,
        'Unexpected ERC721Proxy registered in MultiAssetProxy',
    );

    const registeredERC1155ProxyInMAP = await exchange.getAssetProxy.callAsync(AssetProxyId.ERC1155);
    warnIfMismatch(
        registeredERC1155ProxyInMAP,
        erc1155Proxy.address,
        'Unexpected ERC1155Proxy registered in MultiAssetProxy',
    );

    const registeredStaticCallProxyInMAP = await exchange.getAssetProxy.callAsync(AssetProxyId.StaticCall);
    warnIfMismatch(
        registeredStaticCallProxyInMAP,
        addresses.staticCallProxy,
        'Unexpected StaticCallProxy registered in MultiAssetProxy',
    );

    // Verify AssetProxyOwner configs
    // TODO (xianny): re-enable when AssetProxyOwner contract is finalised
    // const isERC20ProxyRegisteredInAPOwner = await assetProxyOwner.getAssetProxy.callAsync(erc20Proxy.address);
    // warnIfMismatch(isERC20ProxyRegisteredInAPOwner, true, 'ERC20Proxy not registered in AssetProxyOwner');

    // const isERC721ProxyRegisteredInAPOwner = await assetProxyOwner.getAssetProxy.callAsync(
    //     erc721Proxy.address,
    // );
    // warnIfMismatch(isERC721ProxyRegisteredInAPOwner, true, 'ERC721Proxy not registered in AssetProxyOwner');

    // const isERC1155ProxyRegisteredInAPOwner = await assetProxyOwner.getAssetProxy.callAsync(
    //     erc1155Proxy.address,
    // );
    // warnIfMismatch(isERC1155ProxyRegisteredInAPOwner, true, 'ERC1155Proxy not registered in AssetProxyOwner');

    // const isMultiAssetProxyRegisteredInAPOwner = await assetProxyOwner.getAssetProxy.callAsync(
    //     multiAssetProxy.address,
    // );
    // warnIfMismatch(isMultiAssetProxyRegisteredInAPOwner, true, 'MultiAssetProxy not registered in AssetProxyOwner');
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
