import * as wrappers from '@0x/abi-gen-wrappers';
import { ContractAddresses } from '@0x/contract-addresses';
import * as artifacts from '@0x/contract-artifacts';
import { Web3ProviderEngine } from '@0x/subproviders';
import { AbiEncoder, BigNumber, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { MethodAbi, SupportedProvider, TxData } from 'ethereum-types';
import * as _ from 'lodash';

import { constants } from './utils/constants';
import { erc20TokenInfo, erc721TokenInfo } from './utils/token_info';

// HACK (xianny): Copied from @0x/order-utils to get rid of circular dependency
/**
 * Encodes an ERC20 token address into a hex encoded assetData string, usable in the makerAssetData or
 * takerAssetData fields in a 0x order.
 * @param tokenAddress  The ERC20 token address to encode
 * @return The hex encoded assetData string
 */
function encodeERC20AssetData(tokenAddress: string): string {
    const ERC20_METHOD_ABI: MethodAbi = {
        constant: false,
        inputs: [
            {
                name: 'tokenContract',
                type: 'address',
            },
        ],
        name: 'ERC20Token',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    };
    const encodingRules: AbiEncoder.EncodingRules = { shouldOptimize: true };
    const abiEncoder = new AbiEncoder.Method(ERC20_METHOD_ABI);
    const args = [tokenAddress];
    const assetData = abiEncoder.encode(args, encodingRules);
    return assetData;
}

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
    const web3Wrapper = new Web3Wrapper(provider);
    const chainId = new BigNumber(await providerUtils.getChainIdAsync(provider));

    // Proxies
    const erc20Proxy = await wrappers.ERC20ProxyContract.deployFrom0xArtifactAsync(
        artifacts.ERC20Proxy,
        provider,
        txDefaults,
        artifacts,
    );
    const erc721Proxy = await wrappers.ERC721ProxyContract.deployFrom0xArtifactAsync(
        artifacts.ERC721Proxy,
        provider,
        txDefaults,
        artifacts,
    );

    // ZRX
    const zrxToken = await wrappers.ZRXTokenContract.deployFrom0xArtifactAsync(
        artifacts.ZRXToken,
        provider,
        txDefaults,
        artifacts,
    );

    // Ether token
    const etherToken = await wrappers.WETH9Contract.deployFrom0xArtifactAsync(
        artifacts.WETH9,
        provider,
        txDefaults,
        artifacts,
    );

    // Exchange
    const zrxAssetData = encodeERC20AssetData(zrxToken.address);
    const exchange = await wrappers.ExchangeContract.deployFrom0xArtifactAsync(
        artifacts.Exchange,
        provider,
        txDefaults,
        artifacts,
        chainId,
    );

    // Dummy ERC20 tokens
    for (const token of erc20TokenInfo) {
        const totalSupply = new BigNumber(1000000000000000000000000000);
        // tslint:disable-next-line:no-unused-variable
        const dummyErc20Token = await wrappers.DummyERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.DummyERC20Token,
            provider,
            txDefaults,
            artifacts,
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
        artifacts,
        erc721TokenInfo[0].name,
        erc721TokenInfo[0].symbol,
    );

    // 1155 Asset Proxy
    const erc1155Proxy = await wrappers.ERC1155ProxyContract.deployFrom0xArtifactAsync(
        artifacts.ERC1155Proxy,
        provider,
        txDefaults,
        artifacts,
    );

    const staticCallProxy = await wrappers.StaticCallProxyContract.deployFrom0xArtifactAsync(
        artifacts.StaticCallProxy,
        provider,
        txDefaults,
        artifacts,
    );

    const multiAssetProxy = await wrappers.MultiAssetProxyContract.deployFrom0xArtifactAsync(
        artifacts.MultiAssetProxy,
        provider,
        txDefaults,
        artifacts,
    );

    await erc20Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(exchange.address, txDefaults);
    await erc721Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(exchange.address, txDefaults);
    await erc1155Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(exchange.address, txDefaults);
    await multiAssetProxy.addAuthorizedAddress.awaitTransactionSuccessAsync(exchange.address, txDefaults);

    // MultiAssetProxy
    await erc20Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(multiAssetProxy.address, txDefaults);
    await erc721Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(multiAssetProxy.address, txDefaults);
    await erc1155Proxy.addAuthorizedAddress.awaitTransactionSuccessAsync(multiAssetProxy.address, txDefaults);
    await multiAssetProxy.registerAssetProxy.awaitTransactionSuccessAsync(erc20Proxy.address, txDefaults);
    await multiAssetProxy.registerAssetProxy.awaitTransactionSuccessAsync(erc721Proxy.address, txDefaults);
    await multiAssetProxy.registerAssetProxy.awaitTransactionSuccessAsync(erc1155Proxy.address, txDefaults);
    await multiAssetProxy.registerAssetProxy.awaitTransactionSuccessAsync(staticCallProxy.address, txDefaults);

    // Register the Asset Proxies to the Exchange
    await exchange.registerAssetProxy.awaitTransactionSuccessAsync(erc20Proxy.address, txDefaults);
    await exchange.registerAssetProxy.awaitTransactionSuccessAsync(erc721Proxy.address, txDefaults);
    await exchange.registerAssetProxy.awaitTransactionSuccessAsync(erc1155Proxy.address, txDefaults);
    await exchange.registerAssetProxy.awaitTransactionSuccessAsync(multiAssetProxy.address, txDefaults);
    await exchange.registerAssetProxy.awaitTransactionSuccessAsync(staticCallProxy.address, txDefaults);

    // Forwarder
    const forwarder = await wrappers.ForwarderContract.deployFrom0xArtifactAsync(
        artifacts.Forwarder,
        provider,
        txDefaults,
        artifacts,
        exchange.address,
        encodeERC20AssetData(etherToken.address),
    );

    // OrderValidator
    const orderValidator = await wrappers.OrderValidatorContract.deployFrom0xArtifactAsync(
        artifacts.OrderValidator,
        provider,
        txDefaults,
        artifacts,
        exchange.address,
        zrxAssetData,
    );

    // DutchAuction
    const dutchAuction = await wrappers.DutchAuctionContract.deployFrom0xArtifactAsync(
        artifacts.DutchAuction,
        provider,
        txDefaults,
        artifacts,
        exchange.address,
    );

    // TODO (xianny): figure out how to deploy AssetProxyOwnerContract properly
    // // Multisigs
    // const accounts: string[] = await web3Wrapper.getAvailableAddressesAsync();
    // const owners = _.uniq([accounts[0], accounts[1], txDefaults.from]);
    // const confirmationsRequired = new BigNumber(2);
    // const secondsRequired = new BigNumber(0);

    // // AssetProxyOwner

    // const assetProxyOwner = await wrappers.AssetProxyOwnerContract.deployFrom0xArtifactAsync(
    //     artifacts.AssetProxyOwner,
    //     provider,
    //     txDefaults,
    //     artifacts,
    //     [],
    //     [erc20Proxy.address, erc721Proxy.address, multiAssetProxy.address],
    //     [],
    //     owners,
    //     confirmationsRequired,
    //     secondsRequired,
    // );

    // // Transfer Ownership to the Asset Proxy Owner
    // await web3Wrapper.awaitTransactionSuccessAsync(
    //     await erc20Proxy.transferOwnership.sendTransactionAsync(assetProxyOwner.address, txDefaults),
    // );
    // await web3Wrapper.awaitTransactionSuccessAsync(
    //     await erc721Proxy.transferOwnership.sendTransactionAsync(assetProxyOwner.address, txDefaults),
    // );
    // await web3Wrapper.awaitTransactionSuccessAsync(
    //     await erc1155Proxy.transferOwnership.sendTransactionAsync(assetProxyOwner.address, txDefaults),
    // );
    // await web3Wrapper.awaitTransactionSuccessAsync(
    //     await multiAssetProxy.transferOwnership.sendTransactionAsync(assetProxyOwner.address, txDefaults),
    // );

    // Fake the above transactions so our nonce increases and we result with the same addresses
    // while AssetProxyOwner is disabled (TODO: @dekz remove)
    const dummyTransactionCount = 5;
    for (let index = 0; index < dummyTransactionCount; index++) {
        await web3Wrapper.sendTransactionAsync({ to: txDefaults.from, from: txDefaults.from, value: new BigNumber(0) });
    }

    // Fund the Forwarder with ZRX
    const zrxDecimals = await zrxToken.decimals.callAsync();
    const zrxForwarderAmount = Web3Wrapper.toBaseUnitAmount(new BigNumber(5000), zrxDecimals);
    await zrxToken.transfer.awaitTransactionSuccessAsync(forwarder.address, zrxForwarderAmount, txDefaults);

    // CoordinatorRegistry
    const coordinatorRegistry = await wrappers.CoordinatorRegistryContract.deployFrom0xArtifactAsync(
        artifacts.CoordinatorRegistry,
        provider,
        txDefaults,
        artifacts,
    );

    // Coordinator
    const coordinator = await wrappers.CoordinatorContract.deployFrom0xArtifactAsync(
        artifacts.Coordinator,
        provider,
        txDefaults,
        artifacts,
        exchange.address,
    );

    // Dev Utils
    const devUtils = await wrappers.DevUtilsContract.deployFrom0xArtifactAsync(
        artifacts.DevUtils,
        provider,
        txDefaults,
        artifacts,
        exchange.address,
    );

    // tslint:disable-next-line:no-unused-variable
    const erc1155DummyToken = await wrappers.ERC1155MintableContract.deployFrom0xArtifactAsync(
        artifacts.ERC1155Mintable,
        provider,
        txDefaults,
        artifacts,
    );

    const contractAddresses = {
        erc20Proxy: erc20Proxy.address,
        erc721Proxy: erc721Proxy.address,
        erc1155Proxy: erc1155Proxy.address,
        zrxToken: zrxToken.address,
        etherToken: etherToken.address,
        exchange: exchange.address,
        // TODO (xianny): figure out how to deploy AssetProxyOwnerContract
        assetProxyOwner: constants.NULL_ADDRESS,
        forwarder: forwarder.address,
        orderValidator: orderValidator.address,
        dutchAuction: dutchAuction.address,
        coordinatorRegistry: coordinatorRegistry.address,
        coordinator: coordinator.address,
        multiAssetProxy: multiAssetProxy.address,
        staticCallProxy: staticCallProxy.address,
        devUtils: devUtils.address,
        exchangeV2: constants.NULL_ADDRESS,
        zrxVault: constants.NULL_ADDRESS,
        readOnlyProxy: constants.NULL_ADDRESS,
        staking: constants.NULL_ADDRESS,
        stakingProxy: constants.NULL_ADDRESS,
    };

    return contractAddresses;
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
