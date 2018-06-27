import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider, TxData } from 'ethereum-types';

import { ArtifactWriter } from '../utils/artifact_writer';

import { constants } from '../utils/constants';

import { artifacts } from './artifacts';
import { AssetProxyOwnerContract } from './contract_wrappers/asset_proxy_owner';
import { ERC20ProxyContract } from './contract_wrappers/e_r_c20_proxy';
import { ERC721ProxyContract } from './contract_wrappers/e_r_c721_proxy';
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
    const exchange = await ExchangeContract.deployFrom0xArtifactAsync(artifacts.Exchange, provider, txDefaults);
    artifactsWriter.saveArtifact(exchange);

    // Register AssetProxies in Exchange
    const oldAssetProxy = constants.NULL_ADDRESS;
    await web3Wrapper.awaitTransactionSuccessAsync(
        await exchange.registerAssetProxy.sendTransactionAsync(
            constants.ERC20_PROXY_ID,
            erc20proxy.address,
            oldAssetProxy,
        ),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await exchange.registerAssetProxy.sendTransactionAsync(
            constants.ERC721_PROXY_ID,
            erc721proxy.address,
            oldAssetProxy,
        ),
    );

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
    await web3Wrapper.awaitTransactionSuccessAsync(
        await erc20proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await erc721proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address),
    );

    // Transfer ownership of AssetProxies and Exchange to AssetProxyOwner
    await web3Wrapper.awaitTransactionSuccessAsync(
        await erc20proxy.transferOwnership.sendTransactionAsync(assetProxyOwner.address),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await erc721proxy.transferOwnership.sendTransactionAsync(assetProxyOwner.address),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await exchange.transferOwnership.sendTransactionAsync(assetProxyOwner.address),
    );
};
