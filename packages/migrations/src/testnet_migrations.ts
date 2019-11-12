import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { artifacts as assetProxyArtifacts, ERC20BridgeProxyContract } from '@0x/contracts-asset-proxy';
import { artifacts as coordinatorArtifacts, CoordinatorContract } from '@0x/contracts-coordinator';
import { artifacts as devUtilsArtifacts, DevUtilsContract } from '@0x/contracts-dev-utils';
import { artifacts as exchangeArtifacts, ExchangeContract } from '@0x/contracts-exchange';
import { artifacts as forwarderArtifacts, ForwarderContract } from '@0x/contracts-exchange-forwarder';
import {
    artifacts as multisigArtifacts,
    ZeroExGovernorContract,
    ZeroExGovernorSubmissionEventArgs,
} from '@0x/contracts-multisig';
import {
    artifacts as stakingArtifacts,
    StakingContract,
    StakingProxyContract,
    ZrxVaultContract,
} from '@0x/contracts-staking';
import { IAuthorizableContract, IOwnableContract } from '@0x/contracts-utils';
import { AbiEncoder, BigNumber, logUtils, providerUtils } from '@0x/utils';
import { LogWithDecodedArgs, SupportedProvider, TxData } from 'ethereum-types';

import { getConfigsByChainId } from './utils/configs_by_chain';
import { constants } from './utils/constants';
import { providerFactory } from './utils/provider_factory';
import { getTimelockRegistrationsAsync } from './utils/timelocks';

async function submitAndExecuteTransactionAsync(
    governor: ZeroExGovernorContract,
    destination: string,
    data: string,
): Promise<void> {
    const txReceipt = await governor.submitTransaction.awaitTransactionSuccessAsync(
        destination,
        constants.ZERO_AMOUNT,
        data,
    );
    // tslint:disable-next-line:no-unnecessary-type-assertion
    const txId = (txReceipt.logs[0] as LogWithDecodedArgs<ZeroExGovernorSubmissionEventArgs>).args.transactionId;
    logUtils.log(`${txId} submitted`);
    await governor.executeTransaction.awaitTransactionSuccessAsync(txId);
    logUtils.log(`${txId} executed`);
}

/**
 * Deploys all 3.0 contracts and reconfigures existing 2.0 contracts.
 * @param supportedProvider  Web3 provider instance. Your provider instance should connect to the testnet you want to deploy to.
 * @param txDefaults Default transaction values to use when deploying contracts (e.g., specify the desired contract creator with the `from` parameter).
 */
export async function runMigrationsAsync(supportedProvider: SupportedProvider, txDefaults: TxData): Promise<void> {
    const provider = providerUtils.standardizeOrThrow(supportedProvider);
    const chainId = new BigNumber(await providerUtils.getChainIdAsync(provider));
    const deployedAddresses = getContractAddressesForChainOrThrow(chainId.toNumber());
    const configs = getConfigsByChainId(chainId.toNumber());

    // NOTE: This must be deployed before running these migrations, since its address is hard coded in the
    // staking logic contract.
    const zrxVault = new ZrxVaultContract(deployedAddresses.zrxVault, provider, txDefaults);

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

    const stakingProxy = await StakingProxyContract.deployFrom0xArtifactAsync(
        stakingArtifacts.StakingProxy,
        provider,
        txDefaults,
        stakingArtifacts,
        stakingLogic.address,
    );

    const erc20BridgeProxy = await ERC20BridgeProxyContract.deployFrom0xArtifactAsync(
        assetProxyArtifacts.ERC20BridgeProxy,
        provider,
        txDefaults,
        assetProxyArtifacts,
    );

    const authorizableInterface = new IAuthorizableContract(constants.NULL_ADDRESS, provider, txDefaults);
    const ownableInterface = new IOwnableContract(constants.NULL_ADDRESS, provider, txDefaults);

    const customTimeLocks = await getTimelockRegistrationsAsync(provider);

    const governor = await ZeroExGovernorContract.deployFrom0xArtifactAsync(
        multisigArtifacts.ZeroExGovernor,
        provider,
        txDefaults,
        multisigArtifacts,
        customTimeLocks.map(timeLockInfo => timeLockInfo.functionSelector),
        customTimeLocks.map(timeLockInfo => timeLockInfo.destination),
        customTimeLocks.map(timeLockInfo => timeLockInfo.secondsTimeLocked),
        configs.zeroExGovernor.owners,
        configs.zeroExGovernor.required,
        configs.zeroExGovernor.secondsTimeLocked,
    );

    logUtils.log('Configuring Exchange...');
    await exchange.setProtocolFeeCollectorAddress.awaitTransactionSuccessAsync(stakingProxy.address);
    await exchange.setProtocolFeeMultiplier.awaitTransactionSuccessAsync(new BigNumber(150000));
    await exchange.registerAssetProxy.awaitTransactionSuccessAsync(deployedAddresses.erc20Proxy);
    await exchange.registerAssetProxy.awaitTransactionSuccessAsync(deployedAddresses.erc721Proxy);
    await exchange.registerAssetProxy.awaitTransactionSuccessAsync(deployedAddresses.erc1155Proxy);
    await exchange.registerAssetProxy.awaitTransactionSuccessAsync(deployedAddresses.multiAssetProxy);
    await exchange.registerAssetProxy.awaitTransactionSuccessAsync(deployedAddresses.staticCallProxy);
    await exchange.registerAssetProxy.awaitTransactionSuccessAsync(erc20BridgeProxy.address);
    await exchange.transferOwnership.awaitTransactionSuccessAsync(governor.address);
    logUtils.log('Exchange configured!');

    logUtils.log('Configuring ERC20BridgeProxy...');
    await erc20BridgeProxy.addAuthorizedAddress.awaitTransactionSuccessAsync(exchange.address);
    await erc20BridgeProxy.addAuthorizedAddress.awaitTransactionSuccessAsync(deployedAddresses.multiAssetProxy);
    await erc20BridgeProxy.transferOwnership.awaitTransactionSuccessAsync(governor.address);
    logUtils.log('ERC20BridgeProxy configured!');

    logUtils.log('Configuring ZrxVault...');
    await zrxVault.addAuthorizedAddress.awaitTransactionSuccessAsync(txDefaults.from);
    await zrxVault.setStakingProxy.awaitTransactionSuccessAsync(stakingProxy.address);
    await zrxVault.removeAuthorizedAddress.awaitTransactionSuccessAsync(txDefaults.from);
    await zrxVault.addAuthorizedAddress.awaitTransactionSuccessAsync(governor.address);
    await zrxVault.transferOwnership.awaitTransactionSuccessAsync(governor.address);
    logUtils.log('ZrxVault configured!');

    logUtils.log('Configuring StakingProxy...');
    await stakingProxy.addAuthorizedAddress.awaitTransactionSuccessAsync(txDefaults.from);
    const staking = new StakingContract(stakingProxy.address, provider, txDefaults);
    await staking.addExchangeAddress.awaitTransactionSuccessAsync(exchange.address);
    await stakingProxy.removeAuthorizedAddress.awaitTransactionSuccessAsync(txDefaults.from);
    await stakingProxy.addAuthorizedAddress.awaitTransactionSuccessAsync(governor.address);
    await stakingProxy.transferOwnership.awaitTransactionSuccessAsync(governor.address);
    logUtils.log('StakingProxy configured!');

    logUtils.log('Transfering ownership of 2.0 contracts...');
    const oldAssetProxyOwner = new ZeroExGovernorContract(deployedAddresses.assetProxyOwner, provider, txDefaults);
    await submitAndExecuteTransactionAsync(
        oldAssetProxyOwner,
        deployedAddresses.exchangeV2, // Exchange 2.1 address
        ownableInterface.transferOwnership.getABIEncodedTransactionData(governor.address),
    );
    await submitAndExecuteTransactionAsync(
        oldAssetProxyOwner,
        deployedAddresses.erc20Proxy,
        ownableInterface.transferOwnership.getABIEncodedTransactionData(governor.address),
    );
    await submitAndExecuteTransactionAsync(
        oldAssetProxyOwner,
        deployedAddresses.erc721Proxy,
        ownableInterface.transferOwnership.getABIEncodedTransactionData(governor.address),
    );
    await submitAndExecuteTransactionAsync(
        oldAssetProxyOwner,
        deployedAddresses.erc1155Proxy,
        ownableInterface.transferOwnership.getABIEncodedTransactionData(governor.address),
    );
    await submitAndExecuteTransactionAsync(
        oldAssetProxyOwner,
        deployedAddresses.multiAssetProxy,
        ownableInterface.transferOwnership.getABIEncodedTransactionData(governor.address),
    );
    logUtils.log('Ownership transferred!');

    const functionCalls = [
        // AssetProxy configs
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
        {
            destination: deployedAddresses.multiAssetProxy,
            data: exchange.registerAssetProxy.getABIEncodedTransactionData(erc20BridgeProxy.address),
        },
    ];

    const batchTransactionEncoder = AbiEncoder.create('(bytes[],address[],uint256[])');
    const batchTransactionData = batchTransactionEncoder.encode([
        functionCalls.map(item => item.data),
        functionCalls.map(item => item.destination),
        functionCalls.map(() => constants.ZERO_AMOUNT),
    ]);
    await submitAndExecuteTransactionAsync(governor, governor.address, batchTransactionData);

    const devUtils = await DevUtilsContract.deployFrom0xArtifactAsync(
        devUtilsArtifacts.DevUtils,
        provider,
        txDefaults,
        devUtilsArtifacts,
        exchange.address,
    );

    await CoordinatorContract.deployFrom0xArtifactAsync(
        coordinatorArtifacts.Coordinator,
        provider,
        txDefaults,
        coordinatorArtifacts,
        exchange.address,
        chainId,
    );

    const wethAssetData = await devUtils.encodeERC20AssetData.callAsync(deployedAddresses.etherToken);
    const forwarder = await ForwarderContract.deployFrom0xArtifactAsync(
        forwarderArtifacts.Forwarder,
        provider,
        txDefaults,
        forwarderArtifacts,
        exchange.address,
        wethAssetData,
    );
    await forwarder.approveMakerAssetProxy.awaitTransactionSuccessAsync(deployedAddresses.etherToken);
}

(async () => {
    const networkId = 1;
    const rpcUrl = 'https://mainnet.infura.io/v3/';
    const provider = await providerFactory.getLedgerProviderAsync(networkId, rpcUrl);
    await runMigrationsAsync(provider, { from: '0x3b39078f2a3e1512eecc8d6792fdc7f33e1cd2cf', gasPrice: 10000000000 });
})().catch(err => {
    logUtils.log(err);
    process.exit(1);
});
