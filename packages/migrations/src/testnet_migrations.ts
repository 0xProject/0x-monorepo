import { getContractAddressesForNetworkOrThrow } from '@0x/contract-addresses';
import { artifacts as exchangeArtifacts, ExchangeContract } from '@0x/contracts-exchange';
import { artifacts, AssetProxyOwnerContract, AssetProxyOwnerSubmissionEventArgs } from '@0x/contracts-multisig';
import {
    artifacts as stakingArtifacts,
    ReadOnlyProxyContract,
    StakingContract,
    StakingProxyContract,
    ZrxVaultContract,
} from '@0x/contracts-staking';
import { IAuthorizableContract, IOwnableContract } from '@0x/contracts-utils';
import { AbiEncoder, BigNumber, logUtils, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { LogWithDecodedArgs, SupportedProvider, TxData } from 'ethereum-types';

import { constants } from './utils/constants';
import { providerFactory } from './utils/provider_factory';

async function submitAndExecuteTransactionAsync(
    assetProxyOwner: AssetProxyOwnerContract,
    destination: string,
    data: string,
): Promise<void> {
    const txReceipt = await assetProxyOwner.submitTransaction.awaitTransactionSuccessAsync(
        destination,
        constants.ZERO_AMOUNT,
        data,
    );
    // tslint:disable-next-line:no-unnecessary-type-assertion
    const txId = (txReceipt.logs[0] as LogWithDecodedArgs<AssetProxyOwnerSubmissionEventArgs>).args.transactionId;
    logUtils.log(`${txId} submitted`);
    await assetProxyOwner.executeTransaction.awaitTransactionSuccessAsync(txId);
    logUtils.log(`${txId} executed`);
}

/**
 * Deploys all 3.0 contracts and reconfigures existing 2.0 contracts.
 * @param supportedProvider  Web3 provider instance. Your provider instance should connect to the testnet you want to deploy to.
 * @param txDefaults Default transaction values to use when deploying contracts (e.g., specify the desired contract creator with the `from` parameter).
 */
export async function runMigrationsAsync(supportedProvider: SupportedProvider, txDefaults: TxData): Promise<void> {
    const provider = providerUtils.standardizeOrThrow(supportedProvider);
    const web3Wrapper = new Web3Wrapper(provider);
    const networkId = await web3Wrapper.getNetworkIdAsync();
    const chainId = new BigNumber(await providerUtils.getChainIdAsync(provider));
    const deployedAddresses = getContractAddressesForNetworkOrThrow(networkId);

    // NOTE: This must be deployed before running these migrations, since its address is hard coded in the
    // staking logic contract.
    const zrxVault = new ZrxVaultContract(deployedAddresses.zrxVault, provider, txDefaults);

    // NOTE: This may need to be deployed in its own step, since this contract requires a smaller
    // amount of optimizer runs in order to deploy below the codesize limit.
    const stakingLogic = await StakingContract.deployFrom0xArtifactAsync(
        stakingArtifacts.Staking,
        provider,
        txDefaults,
        stakingArtifacts,
    );

    const exchange = await ExchangeContract.deployFrom0xArtifactAsync(
        exchangeArtifacts.Exchange,
        provider,
        txDefaults,
        exchangeArtifacts,
        chainId,
    );

    const readOnlyProxy = await ReadOnlyProxyContract.deployFrom0xArtifactAsync(
        stakingArtifacts.ReadOnlyProxy,
        provider,
        txDefaults,
        stakingArtifacts,
    );

    const stakingProxy = await StakingProxyContract.deployFrom0xArtifactAsync(
        stakingArtifacts.StakingProxy,
        provider,
        txDefaults,
        stakingArtifacts,
        stakingLogic.address,
        readOnlyProxy.address,
    );

    const authorizableInterface = new IAuthorizableContract(constants.NULL_ADDRESS, provider, txDefaults);
    const ownableInterface = new IOwnableContract(constants.NULL_ADDRESS, provider, txDefaults);

    const customTimeLocks = [
        {
            destination: deployedAddresses.erc20Proxy,
            functionSelector: authorizableInterface.removeAuthorizedAddress.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.erc20Proxy,
            functionSelector: authorizableInterface.removeAuthorizedAddressAtIndex.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.erc721Proxy,
            functionSelector: authorizableInterface.removeAuthorizedAddress.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.erc721Proxy,
            functionSelector: authorizableInterface.removeAuthorizedAddressAtIndex.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.erc1155Proxy,
            functionSelector: authorizableInterface.removeAuthorizedAddress.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.erc1155Proxy,
            functionSelector: authorizableInterface.removeAuthorizedAddressAtIndex.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.multiAssetProxy,
            functionSelector: authorizableInterface.removeAuthorizedAddress.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.multiAssetProxy,
            functionSelector: authorizableInterface.removeAuthorizedAddressAtIndex.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: stakingProxy.setReadOnlyMode.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.zrxVault,
            functionSelector: zrxVault.enterCatastrophicFailure.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: stakingProxy.attachStakingContract.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT, // 3 epochs on mainnet
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: stakingLogic.setParams.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT, // 1 epoch on mainnet
        },
    ];

    const assetProxyOwner = await AssetProxyOwnerContract.deployFrom0xArtifactAsync(
        artifacts.AssetProxyOwner,
        provider,
        txDefaults,
        artifacts,
        customTimeLocks.map(timeLockInfo => timeLockInfo.functionSelector),
        customTimeLocks.map(timeLockInfo => timeLockInfo.destination),
        customTimeLocks.map(timeLockInfo => timeLockInfo.secondsTimeLocked),
        constants.ASSET_PROXY_OWNER_OWNERS,
        constants.ASSET_PROXY_OWNER_CONFIRMATIONS,
        constants.ASSET_PROXY_OWNER_TIMELOCK,
    );

    logUtils.log('Configuring Exchange...');
    await exchange.setProtocolFeeCollectorAddress.awaitTransactionSuccessAsync(stakingProxy.address);
    await exchange.setProtocolFeeMultiplier.awaitTransactionSuccessAsync(new BigNumber(150000));
    await exchange.registerAssetProxy.awaitTransactionSuccessAsync(deployedAddresses.erc20Proxy);
    await exchange.registerAssetProxy.awaitTransactionSuccessAsync(deployedAddresses.erc721Proxy);
    await exchange.registerAssetProxy.awaitTransactionSuccessAsync(deployedAddresses.erc1155Proxy);
    await exchange.registerAssetProxy.awaitTransactionSuccessAsync(deployedAddresses.multiAssetProxy);
    await exchange.registerAssetProxy.awaitTransactionSuccessAsync(deployedAddresses.staticCallProxy);
    await exchange.transferOwnership.awaitTransactionSuccessAsync(assetProxyOwner.address);
    logUtils.log('Exchange configured!');

    logUtils.log('Configuring ZrxVault...');
    await zrxVault.addAuthorizedAddress.awaitTransactionSuccessAsync(assetProxyOwner.address);
    logUtils.log('ZrxVault configured!');

    logUtils.log('Configuring StakingProxy...');
    await stakingProxy.addAuthorizedAddress.awaitTransactionSuccessAsync(assetProxyOwner.address);
    logUtils.log('StakingProxy configured!');

    logUtils.log('Transfering ownership of 2.0 contracts...');
    const oldAssetProxyOwner = new AssetProxyOwnerContract(deployedAddresses.assetProxyOwner, provider, txDefaults);
    await submitAndExecuteTransactionAsync(
        oldAssetProxyOwner,
        deployedAddresses.exchangeV2, // Exchange 2.1 address
        ownableInterface.transferOwnership.getABIEncodedTransactionData(assetProxyOwner.address),
    );
    await submitAndExecuteTransactionAsync(
        oldAssetProxyOwner,
        deployedAddresses.erc20Proxy,
        ownableInterface.transferOwnership.getABIEncodedTransactionData(assetProxyOwner.address),
    );
    await submitAndExecuteTransactionAsync(
        oldAssetProxyOwner,
        deployedAddresses.erc721Proxy,
        ownableInterface.transferOwnership.getABIEncodedTransactionData(assetProxyOwner.address),
    );
    await submitAndExecuteTransactionAsync(
        oldAssetProxyOwner,
        deployedAddresses.erc1155Proxy,
        ownableInterface.transferOwnership.getABIEncodedTransactionData(assetProxyOwner.address),
    );
    await submitAndExecuteTransactionAsync(
        oldAssetProxyOwner,
        deployedAddresses.multiAssetProxy,
        ownableInterface.transferOwnership.getABIEncodedTransactionData(assetProxyOwner.address),
    );
    logUtils.log('Ownership transferred!');

    const functionCalls = [
        {
            destination: zrxVault.address,
            data: zrxVault.setStakingProxy.getABIEncodedTransactionData(stakingProxy.address),
        },
        {
            destination: stakingProxy.address,
            data: stakingLogic.addExchangeAddress.getABIEncodedTransactionData(exchange.address),
        },
        {
            destination: deployedAddresses.erc20Proxy,
            data: authorizableInterface.addAuthorizedAddress.getABIEncodedTransactionData(exchange.address),
        },
        {
            destination: deployedAddresses.erc20Proxy,
            data: authorizableInterface.addAuthorizedAddress.getABIEncodedTransactionData(zrxVault.address),
        },
        {
            destination: deployedAddresses.erc721Proxy,
            data: authorizableInterface.addAuthorizedAddress.getABIEncodedTransactionData(exchange.address),
        },
        {
            destination: deployedAddresses.erc1155Proxy,
            data: authorizableInterface.addAuthorizedAddress.getABIEncodedTransactionData(exchange.address),
        },
        {
            destination: deployedAddresses.multiAssetProxy,
            data: authorizableInterface.addAuthorizedAddress.getABIEncodedTransactionData(exchange.address),
        },
    ];
    const batchTransactionEncoder = AbiEncoder.create('(bytes[],address[],uint256[])');
    const batchTransactionData = batchTransactionEncoder.encode([
        functionCalls.map(item => item.data),
        functionCalls.map(item => item.destination),
        functionCalls.map(() => constants.ZERO_AMOUNT),
    ]);
    await submitAndExecuteTransactionAsync(assetProxyOwner, assetProxyOwner.address, batchTransactionData);
}

(async () => {
    const networkId = 4;
    const rpcUrl = 'https://rinkeby.infura.io/v3/';
    const provider = await providerFactory.getLedgerProviderAsync(networkId, rpcUrl);
    await runMigrationsAsync(provider, { from: constants.ASSET_PROXY_OWNER_OWNERS[0], gasPrice: 60000000000 });
})().catch(err => {
    logUtils.log(err);
    process.exit(1);
});
