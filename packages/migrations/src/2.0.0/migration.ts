import { assetProxyUtils } from '@0xproject/order-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider, TxData } from 'ethereum-types';

import { ArtifactWriter } from '../utils/artifact_writer';
import { erc20TokenInfo, erc721TokenInfo } from '../utils/token_info';

import { artifacts } from './artifacts';
import { AssetProxyOwnerContract } from './contract_wrappers/asset_proxy_owner';
import { DummyERC20TokenContract } from './contract_wrappers/dummy_erc20_token';
import { DummyERC721TokenContract } from './contract_wrappers/dummy_erc721_token';
import { ERC20ProxyContract } from './contract_wrappers/erc20_proxy';
import { ERC721ProxyContract } from './contract_wrappers/erc721_proxy';
import { ExchangeContract } from './contract_wrappers/exchange';
import { ForwarderContract } from './contract_wrappers/forwarder';
import { WETH9Contract } from './contract_wrappers/weth9';
import { ZRXTokenContract } from './contract_wrappers/zrx_token';

/**
 * Custom migrations should be defined in this function. This will be called with the CLI 'migrate:v2' command.
 * Migrations could be written to run in parallel, but if you want contract addresses to be created deterministically,
 * the migration should be written to run synchronously.
 * @param provider  Web3 provider instance.
 * @param artifactsDir The directory with compiler artifact files.
 * @param txDefaults Default transaction values to use when deploying contracts.
 */
export const runV2MigrationsAsync = async (provider: Provider, artifactsDir: string, txDefaults: Partial<TxData>) => {
    const web3Wrapper = new Web3Wrapper(provider);
    const networkId = await web3Wrapper.getNetworkIdAsync();
    const artifactsWriter = new ArtifactWriter(artifactsDir, networkId);

    // Proxies
    const erc20proxy = await ERC20ProxyContract.deployFrom0xArtifactAsync(artifacts.ERC20Proxy, provider, txDefaults);
    artifactsWriter.saveArtifact(erc20proxy);
    const erc721proxy = await ERC721ProxyContract.deployFrom0xArtifactAsync(
        artifacts.ERC721Proxy,
        provider,
        txDefaults,
    );
    artifactsWriter.saveArtifact(erc721proxy);

    // ZRX
    const zrxToken = await ZRXTokenContract.deployFrom0xArtifactAsync(artifacts.ZRX, provider, txDefaults);
    artifactsWriter.saveArtifact(zrxToken);

    // Ether token
    const etherToken = await WETH9Contract.deployFrom0xArtifactAsync(artifacts.WETH9, provider, txDefaults);
    artifactsWriter.saveArtifact(etherToken);

    // Exchange
    const exchange = await ExchangeContract.deployFrom0xArtifactAsync(
        artifacts.Exchange,
        provider,
        txDefaults,
        assetProxyUtils.encodeERC20AssetData(zrxToken.address),
    );
    artifactsWriter.saveArtifact(exchange);

    // Multisigs
    const accounts: string[] = await web3Wrapper.getAvailableAddressesAsync();
    const owners = [accounts[0], accounts[1]];
    const confirmationsRequired = new BigNumber(2);
    const secondsRequired = new BigNumber(0);
    const owner = accounts[0];

    // AssetProxyOwner
    const assetProxyOwner = await AssetProxyOwnerContract.deployFrom0xArtifactAsync(
        artifacts.AssetProxyOwner,
        provider,
        txDefaults,
        owners,
        [erc20proxy.address, erc721proxy.address],
        confirmationsRequired,
        secondsRequired,
    );
    artifactsWriter.saveArtifact(assetProxyOwner);
    await web3Wrapper.awaitTransactionSuccessAsync(
        await erc20proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, {
            from: owner,
        }),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await erc20proxy.transferOwnership.sendTransactionAsync(assetProxyOwner.address, {
            from: owner,
        }),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await erc721proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, {
            from: owner,
        }),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await erc721proxy.transferOwnership.sendTransactionAsync(assetProxyOwner.address, {
            from: owner,
        }),
    );

    // Register the Asset Proxies to the Exchange
    await web3Wrapper.awaitTransactionSuccessAsync(
        await exchange.registerAssetProxy.sendTransactionAsync(erc20proxy.address),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await exchange.registerAssetProxy.sendTransactionAsync(erc721proxy.address),
    );

    // Dummy ERC20 tokens
    for (const token of erc20TokenInfo) {
        const totalSupply = new BigNumber(1000000000000000000000000000);
        // tslint:disable-next-line:no-unused-variable
        const dummyErc20Token = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.DummyERC20Token,
            provider,
            txDefaults,
            token.name,
            token.symbol,
            token.decimals,
            totalSupply,
        );
    }

    // ERC721
    // tslint:disable-next-line:no-unused-variable
    const cryptoKittieToken = await DummyERC721TokenContract.deployFrom0xArtifactAsync(
        artifacts.DummyERC721Token,
        provider,
        txDefaults,
        erc721TokenInfo[0].name,
        erc721TokenInfo[0].symbol,
    );

    // Forwarder
    const forwarder = await ForwarderContract.deployFrom0xArtifactAsync(
        artifacts.Forwarder,
        provider,
        txDefaults,
        exchange.address,
        etherToken.address,
        zrxToken.address,
        assetProxyUtils.encodeERC20AssetData(zrxToken.address),
        assetProxyUtils.encodeERC20AssetData(etherToken.address),
    );
    artifactsWriter.saveArtifact(forwarder);
};
