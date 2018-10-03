import { artifacts, wrappers } from '@0xproject/contracts';
import { assetDataUtils } from '@0xproject/order-utils';
import { ContractAddresses } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider, TxData } from 'ethereum-types';
import * as _ from 'lodash';

import { erc20TokenInfo, erc721TokenInfo } from './utils/token_info';

interface MigrationsResult {
    erc20Proxy: wrappers.ERC20ProxyContract;
    erc721Proxy: wrappers.ERC721ProxyContract;
    zrxToken: wrappers.ZRXTokenContract;
    etherToken: wrappers.WETH9Contract;
    exchange: wrappers.ExchangeContract;
    assetProxyOwner: wrappers.AssetProxyOwnerContract;
    forwarder: wrappers.ForwarderContract;
    orderValidator: wrappers.OrderValidatorContract;
}

let _cachedMigrationsResult: MigrationsResult | undefined;
let _cachedContractAddresses: ContractAddresses | undefined;

/**
 * Custom migrations should be defined in this function. This will be called with the CLI 'migrate:v2' command.
 * Migrations could be written to run in parallel, but if you want contract addresses to be created deterministically,
 * the migration should be written to run synchronously.
 * @param provider  Web3 provider instance.
 * @param txDefaults Default transaction values to use when deploying contracts.
 */
export async function runMigrationsAsync(provider: Provider, txDefaults: Partial<TxData>): Promise<MigrationsResult> {
    const web3Wrapper = new Web3Wrapper(provider);

    // Proxies
    const erc20Proxy = await wrappers.ERC20ProxyContract.deployFrom0xArtifactAsync(
        artifacts.ERC20Proxy,
        provider,
        txDefaults,
    );
    const erc721Proxy = await wrappers.ERC721ProxyContract.deployFrom0xArtifactAsync(
        artifacts.ERC721Proxy,
        provider,
        txDefaults,
    );

    // ZRX
    const zrxToken = await wrappers.ZRXTokenContract.deployFrom0xArtifactAsync(
        artifacts.ZRXToken,
        provider,
        txDefaults,
    );

    // Ether token
    const etherToken = await wrappers.WETH9Contract.deployFrom0xArtifactAsync(artifacts.WETH9, provider, txDefaults);

    // Exchange
    const zrxAssetData = assetDataUtils.encodeERC20AssetData(zrxToken.address);
    const exchange = await wrappers.ExchangeContract.deployFrom0xArtifactAsync(
        artifacts.Exchange,
        provider,
        txDefaults,
        zrxAssetData,
    );

    // Multisigs
    const accounts: string[] = await web3Wrapper.getAvailableAddressesAsync();
    const owners = [accounts[0], accounts[1]];
    const confirmationsRequired = new BigNumber(2);
    const secondsRequired = new BigNumber(0);
    const owner = accounts[0];

    // AssetProxyOwner
    const assetProxyOwner = await wrappers.AssetProxyOwnerContract.deployFrom0xArtifactAsync(
        artifacts.AssetProxyOwner,
        provider,
        txDefaults,
        owners,
        [erc20Proxy.address, erc721Proxy.address],
        confirmationsRequired,
        secondsRequired,
    );

    await web3Wrapper.awaitTransactionSuccessAsync(
        await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, {
            from: owner,
        }),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await erc20Proxy.transferOwnership.sendTransactionAsync(assetProxyOwner.address, {
            from: owner,
        }),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, {
            from: owner,
        }),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await erc721Proxy.transferOwnership.sendTransactionAsync(assetProxyOwner.address, {
            from: owner,
        }),
    );

    // Register the Asset Proxies to the Exchange
    await web3Wrapper.awaitTransactionSuccessAsync(
        await exchange.registerAssetProxy.sendTransactionAsync(erc20Proxy.address),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await exchange.registerAssetProxy.sendTransactionAsync(erc721Proxy.address),
    );

    // Dummy ERC20 tokens
    for (const token of erc20TokenInfo) {
        const totalSupply = new BigNumber(1000000000000000000000000000);
        // tslint:disable-next-line:no-unused-variable
        const dummyErc20Token = await wrappers.DummyERC20TokenContract.deployFrom0xArtifactAsync(
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
    const cryptoKittieToken = await wrappers.DummyERC721TokenContract.deployFrom0xArtifactAsync(
        artifacts.DummyERC721Token,
        provider,
        txDefaults,
        erc721TokenInfo[0].name,
        erc721TokenInfo[0].symbol,
    );

    // Forwarder
    const forwarder = await wrappers.ForwarderContract.deployFrom0xArtifactAsync(
        artifacts.Forwarder,
        provider,
        txDefaults,
        exchange.address,
        assetDataUtils.encodeERC20AssetData(zrxToken.address),
        assetDataUtils.encodeERC20AssetData(etherToken.address),
    );

    // OrderValidator
    const orderValidator = await wrappers.OrderValidatorContract.deployFrom0xArtifactAsync(
        artifacts.OrderValidator,
        provider,
        txDefaults,
        exchange.address,
        zrxAssetData,
    );

    const migrationsResult = {
        erc20Proxy,
        erc721Proxy,
        zrxToken,
        etherToken,
        exchange,
        assetProxyOwner,
        forwarder,
        orderValidator,
    };
    _cachedMigrationsResult = migrationsResult;
    return migrationsResult;
}

export function getContractAddresses(): ContractAddresses {
    if (!_.isUndefined(_cachedContractAddresses)) {
        return _cachedContractAddresses;
    }
    if (_.isUndefined(_cachedMigrationsResult)) {
        throw new Error(
            'Migrations have not been run! You need to call runMigrationsAsync before getContractAddresses',
        );
    }
    const contractAddresses = {
        erc20Proxy: _cachedMigrationsResult.erc20Proxy.address,
        erc721Proxy: _cachedMigrationsResult.erc721Proxy.address,
        zrxToken: _cachedMigrationsResult.zrxToken.address,
        etherToken: _cachedMigrationsResult.etherToken.address,
        exchange: _cachedMigrationsResult.exchange.address,
        assetProxyOwner: _cachedMigrationsResult.assetProxyOwner.address,
        forwarder: _cachedMigrationsResult.forwarder.address,
        orderValidator: _cachedMigrationsResult.orderValidator.address,
    };
    _cachedContractAddresses = contractAddresses;
    return contractAddresses;
}
