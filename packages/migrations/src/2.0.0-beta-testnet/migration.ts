import { assetDataUtils } from '@0xproject/order-utils';
import { BigNumber, logUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider, TxData } from 'ethereum-types';

import { ArtifactWriter } from '../utils/artifact_writer';
import { constants } from '../utils/constants';
import { erc20TokenInfo, erc721TokenInfo, etherTokenByNetwork } from '../utils/token_info';

import { artifacts } from './artifacts';
import { AssetProxyOwnerContract } from './contract_wrappers/asset_proxy_owner';
import { DummyERC20TokenContract } from './contract_wrappers/dummy_erc20_token';
import { DummyERC721TokenContract } from './contract_wrappers/dummy_erc721_token';
import { ERC20ProxyContract } from './contract_wrappers/erc20_proxy';
import { ERC721ProxyContract } from './contract_wrappers/erc721_proxy';
import { ExchangeContract } from './contract_wrappers/exchange';
import { ForwarderContract } from './contract_wrappers/forwarder';
import { OrderValidatorContract } from './contract_wrappers/order_validator';

const ERC20_TOTAL_SUPPLY = new BigNumber(1000000000000000000000000000);

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

    const zrxDecimals = new BigNumber(18);
    const zrxSupply = ERC20_TOTAL_SUPPLY;
    const zrxToken = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
        artifacts.DummyERC20Token,
        provider,
        txDefaults,
        '0x Protocol Token',
        'ZRX',
        zrxDecimals,
        zrxSupply,
    );
    artifactsWriter.saveArtifact(zrxToken);

    // Deploy Exchange
    const zrxAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);
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
    // Ether token is already deployed on various test nets
    const etherTokenAddress = etherTokenByNetwork[networkId].address;
    const wethAssetData = assetDataUtils.encodeERC20AssetData(etherTokenAddress);
    const forwarder = await ForwarderContract.deployFrom0xArtifactAsync(
        artifacts.Forwarder,
        provider,
        txDefaults,
        exchange.address,
        zrxAssetData,
        wethAssetData,
    );
    artifactsWriter.saveArtifact(forwarder);

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

    // Deploy OrderValidator
    const orderValidator = await OrderValidatorContract.deployFrom0xArtifactAsync(
        artifacts.OrderValidator,
        provider,
        txDefaults,
        exchange.address,
        zrxAssetData,
    );
    artifactsWriter.saveArtifact(orderValidator);

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

    // Set enough ZRX Balance to the Forwarder
    const maxZRXMintAmount = await zrxToken.MAX_MINT_AMOUNT.callAsync();
    const forwarderZRXBalance = maxZRXMintAmount.times(10);
    txHash = await zrxToken.setBalance.sendTransactionAsync(forwarder.address, forwarderZRXBalance);
    await web3Wrapper.awaitTransactionSuccessAsync(txHash);

    txHash = await zrxToken.transferOwnership.sendTransactionAsync(assetProxyOwner.address);
    logUtils.log(`transactionHash: ${txHash}`);
    logUtils.log('Transferring ownership of ZRX token');
    await web3Wrapper.awaitTransactionSuccessAsync(txHash);

    // Dummy Tokens
    for (const token of erc20TokenInfo) {
        const totalSupply = ERC20_TOTAL_SUPPLY;
        const dummyToken = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.DummyERC20Token,
            provider,
            txDefaults,
            token.name,
            token.symbol,
            token.decimals,
            totalSupply,
        );
        logUtils.log(`DummyERC20 ${token.name}: ${dummyToken.address}`);
        txHash = await dummyToken.transferOwnership.sendTransactionAsync(assetProxyOwner.address);
        logUtils.log(`transactionHash: ${txHash}`);
        logUtils.log(`Transferring ownership of ${token.name} `);
        await web3Wrapper.awaitTransactionSuccessAsync(txHash);
    }
    for (const token of erc721TokenInfo) {
        const dummyToken = await DummyERC721TokenContract.deployFrom0xArtifactAsync(
            artifacts.DummyERC721Token,
            provider,
            txDefaults,
            token.name,
            token.symbol,
        );
        logUtils.log(`DummyERC721 ${token.name}: ${dummyToken.address}`);
        txHash = await dummyToken.transferOwnership.sendTransactionAsync(assetProxyOwner.address);
        logUtils.log(`transactionHash: ${txHash}`);
        logUtils.log(`Transferring ownership of ${token.name} `);
        await web3Wrapper.awaitTransactionSuccessAsync(txHash);
    }
};
