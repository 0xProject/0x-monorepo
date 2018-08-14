import { assetDataUtils } from '@0xproject/order-utils';
import { logUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider, TxData } from 'ethereum-types';

import { ArtifactWriter } from '../utils/artifact_writer';

import { constants } from '../utils/constants';

import { artifacts } from './artifacts';
import { AssetProxyOwnerContract } from './contract_wrappers/asset_proxy_owner';
import { ERC20ProxyContract } from './contract_wrappers/erc20_proxy';
import { ERC721ProxyContract } from './contract_wrappers/erc721_proxy';
import { ExchangeContract } from './contract_wrappers/exchange';

/**
 * Custom migrations should be defined in this function. This will be called with the CLI 'migrate:v2-beta-testnet' command.
 * Migrations could be written to run in parallel, but if you want contract addresses to be created deterministically,
 * the migration should be written to run synchronously.
 * @param provider  Web3 provider instance.
 * @param artifactsDir The directory with compiler artifact files.
 * @param txDefaults Default transaction values to use when deploying contracts.
 */
export const runV2TestnetMigrationsAsync = async (
    provider: Provider,
    artifactsDir: string,
    txDefaults: Partial<TxData>,
) => {
    const web3Wrapper = new Web3Wrapper(provider);
    const networkId = await web3Wrapper.getNetworkIdAsync();
    const artifactsWriter = new ArtifactWriter(artifactsDir, networkId);

    // Deploy AssetProxies
    const erc20proxy = await ERC20ProxyContract.deployFrom0xArtifactAsync(artifacts.ERC20Proxy, provider, txDefaults);
    artifactsWriter.saveArtifact(erc20proxy);
    const erc721proxy = await ERC721ProxyContract.deployFrom0xArtifactAsync(
        artifacts.ERC721Proxy,
        provider,
        txDefaults,
    );
    artifactsWriter.saveArtifact(erc721proxy);

    // Deploy Exchange
    const zrxAddressOnKovan = '0x6ff6c0ff1d68b964901f986d4c9fa3ac68346570';
    const zrxAssetData = assetDataUtils.encodeERC20AssetData(zrxAddressOnKovan);
    const exchange = await ExchangeContract.deployFrom0xArtifactAsync(
        artifacts.Exchange,
        provider,
        txDefaults,
        zrxAssetData,
    );
    artifactsWriter.saveArtifact(exchange);

    let txHash;
    // Register AssetProxies in Exchange
    txHash = await exchange.registerAssetProxy.sendTransactionAsync(erc20proxy.address);
    logUtils.log(`transactionHash: ${txHash}`);
    logUtils.log('Registering ERC20Proxy');
    await web3Wrapper.awaitTransactionSuccessAsync(txHash);

    txHash = await exchange.registerAssetProxy.sendTransactionAsync(erc721proxy.address);
    logUtils.log(`transactionHash: ${txHash}`);
    logUtils.log('Registering ERC721Proxy');
    await web3Wrapper.awaitTransactionSuccessAsync(txHash);

    // Deploy AssetProxyOwner
    const assetProxyOwner = await AssetProxyOwnerContract.deployFrom0xArtifactAsync(
        artifacts.AssetProxyOwner,
        provider,
        txDefaults,
        constants.ASSET_PROXY_OWNER_OWNERS,
        [erc20proxy.address, erc721proxy.address],
        constants.ASSET_PROXY_OWNER_CONFIRMATIONS,
        constants.ASSET_PROXY_OWNER_TIMELOCK,
    );
    artifactsWriter.saveArtifact(assetProxyOwner);

    // Authorize Exchange contracts to call AssetProxies
    txHash = await erc20proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address);
    logUtils.log(`transactionHash: ${txHash}`);
    logUtils.log('Authorizing Exchange on ERC20Proxy');
    await web3Wrapper.awaitTransactionSuccessAsync(txHash);

    txHash = await erc721proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address);
    logUtils.log(`transactionHash: ${txHash}`);
    logUtils.log('Authorizing Exchange on ERC721Proxy');
    await web3Wrapper.awaitTransactionSuccessAsync(txHash);

    // Transfer ownership of AssetProxies and Exchange to AssetProxyOwner
    txHash = await erc20proxy.transferOwnership.sendTransactionAsync(assetProxyOwner.address);
    logUtils.log(`transactionHash: ${txHash}`);
    logUtils.log('Transferring ownership of ERC20Proxy');
    await web3Wrapper.awaitTransactionSuccessAsync(txHash);

    txHash = await erc721proxy.transferOwnership.sendTransactionAsync(assetProxyOwner.address);
    logUtils.log(`transactionHash: ${txHash}`);
    logUtils.log('Transferring ownership of ERC721Proxy');
    await web3Wrapper.awaitTransactionSuccessAsync(txHash);

    txHash = await exchange.transferOwnership.sendTransactionAsync(assetProxyOwner.address);
    logUtils.log(`transactionHash: ${txHash}`);
    logUtils.log('Transferring ownership of Exchange');
    await web3Wrapper.awaitTransactionSuccessAsync(txHash);
};
