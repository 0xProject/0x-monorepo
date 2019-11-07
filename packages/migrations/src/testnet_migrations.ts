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

import { constants } from './utils/constants';
import { providerFactory } from './utils/provider_factory';

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
    await ForwarderContract.deployFrom0xArtifactAsync(
        forwarderArtifacts.Forwarder,
        provider,
        txDefaults,
        forwarderArtifacts,
        exchange.address,
        wethAssetData,
    );

    const authorizableInterface = new IAuthorizableContract(constants.NULL_ADDRESS, provider, txDefaults);
    const ownableInterface = new IOwnableContract(constants.NULL_ADDRESS, provider, txDefaults);

    const customTimeLocks = [
        // AssetProxy timelocks
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
            destination: erc20BridgeProxy.address,
            functionSelector: authorizableInterface.removeAuthorizedAddress.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        {
            destination: erc20BridgeProxy.address,
            functionSelector: authorizableInterface.removeAuthorizedAddressAtIndex.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        // ZrxVault timelocks
        {
            destination: deployedAddresses.zrxVault,
            functionSelector: zrxVault.enterCatastrophicFailure.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.zrxVault,
            functionSelector: zrxVault.setStakingProxy.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT, // 20 days on mainnet
        },
        {
            destination: deployedAddresses.zrxVault,
            functionSelector: zrxVault.setZrxProxy.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT, // 20 days on mainnet
        },
        {
            destination: deployedAddresses.zrxVault,
            functionSelector: ownableInterface.transferOwnership.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT, // 20 days on mainnet
        },
        {
            destination: deployedAddresses.zrxVault,
            functionSelector: authorizableInterface.addAuthorizedAddress.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT, // 20 days on mainnet
        },
        {
            destination: deployedAddresses.zrxVault,
            functionSelector: authorizableInterface.removeAuthorizedAddress.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT, // 20 days on mainnet
        },
        {
            destination: deployedAddresses.zrxVault,
            functionSelector: authorizableInterface.removeAuthorizedAddressAtIndex.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT, // 20 days on mainnet
        },
        // StakingProxy timelocks
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: stakingProxy.attachStakingContract.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT, // 20 days on mainnet
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: stakingProxy.detachStakingContract.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT, // 20 days on mainnet
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: stakingLogic.setParams.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT, // 10 days on mainnet
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: stakingLogic.addExchangeAddress.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT, // 20 days on mainnet
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: stakingLogic.removeExchangeAddress.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT, // 20 days on mainnet
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: ownableInterface.transferOwnership.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT, // 20 days on mainnet
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: authorizableInterface.addAuthorizedAddress.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT, // 20 days on mainnet
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: authorizableInterface.removeAuthorizedAddress.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT, // 20 days on mainnet
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: authorizableInterface.removeAuthorizedAddressAtIndex.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT, // 20 days on mainnet
        },
        // Exchange timelocks
        {
            destination: exchange.address,
            functionSelector: exchange.setProtocolFeeMultiplier.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT, // 10 days on mainnet
        },
        {
            destination: exchange.address,
            functionSelector: exchange.setProtocolFeeCollectorAddress.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT, // 20 days on mainnet
        },
        {
            destination: exchange.address,
            functionSelector: exchange.detachProtocolFeeCollector.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
    ];

    const governor = await ZeroExGovernorContract.deployFrom0xArtifactAsync(
        multisigArtifacts.ZeroExGovernor,
        provider,
        txDefaults,
        multisigArtifacts,
        customTimeLocks.map(timeLockInfo => timeLockInfo.functionSelector),
        customTimeLocks.map(timeLockInfo => timeLockInfo.destination),
        customTimeLocks.map(timeLockInfo => timeLockInfo.secondsTimeLocked),
        constants.ASSET_PROXY_OWNER_OWNERS,
        constants.ASSET_PROXY_OWNER_CONFIRMATIONS,
        constants.ASSET_PROXY_OWNER_TIMELOCK,
    );

    logUtils.log('Configuring Exchange...');
    await exchange.transferOwnership.awaitTransactionSuccessAsync(governor.address);
    logUtils.log('Exchange configured!');

    logUtils.log('Configuring ERC20BridgeProxy...');
    await erc20BridgeProxy.transferOwnership.awaitTransactionSuccessAsync(governor.address);
    logUtils.log('ERC20BridgeProxy configured!');

    logUtils.log('Configuring ZrxVault...');
    await zrxVault.transferOwnership.awaitTransactionSuccessAsync(governor.address);
    logUtils.log('ZrxVault configured!');

    logUtils.log('Configuring StakingProxy...');
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
        // Exchange staking configs
        {
            destination: exchange.address,
            data: exchange.setProtocolFeeCollectorAddress.getABIEncodedTransactionData(stakingProxy.address),
        },
        {
            destination: exchange.address,
            data: exchange.setProtocolFeeMultiplier.getABIEncodedTransactionData(new BigNumber(150000)),
        },
        // Exchange AssetProxy registrations
        {
            destination: exchange.address,
            data: exchange.registerAssetProxy.getABIEncodedTransactionData(deployedAddresses.erc20Proxy),
        },
        {
            destination: exchange.address,
            data: exchange.registerAssetProxy.getABIEncodedTransactionData(deployedAddresses.erc721Proxy),
        },
        {
            destination: exchange.address,
            data: exchange.registerAssetProxy.getABIEncodedTransactionData(deployedAddresses.erc1155Proxy),
        },
        {
            destination: exchange.address,
            data: exchange.registerAssetProxy.getABIEncodedTransactionData(deployedAddresses.multiAssetProxy),
        },
        {
            destination: exchange.address,
            data: exchange.registerAssetProxy.getABIEncodedTransactionData(deployedAddresses.staticCallProxy),
        },
        {
            destination: exchange.address,
            data: exchange.registerAssetProxy.getABIEncodedTransactionData(erc20BridgeProxy.address),
        },
        // ZrxVault configs
        {
            destination: zrxVault.address,
            data: authorizableInterface.addAuthorizedAddress.getABIEncodedTransactionData(governor.address),
        },
        {
            destination: zrxVault.address,
            data: zrxVault.setStakingProxy.getABIEncodedTransactionData(stakingProxy.address),
        },
        // StakingProxy configs
        {
            destination: stakingProxy.address,
            data: authorizableInterface.addAuthorizedAddress.getABIEncodedTransactionData(governor.address),
        },
        {
            destination: stakingProxy.address,
            data: stakingLogic.addExchangeAddress.getABIEncodedTransactionData(exchange.address),
        },
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
        {
            destination: erc20BridgeProxy.address,
            data: authorizableInterface.addAuthorizedAddress.getABIEncodedTransactionData(exchange.address),
        },
        {
            destination: erc20BridgeProxy.address,
            data: authorizableInterface.addAuthorizedAddress.getABIEncodedTransactionData(
                deployedAddresses.multiAssetProxy,
            ),
        },
    ];

    const batchTransactionEncoder = AbiEncoder.create('(bytes[],address[],uint256[])');
    const batchTransactionData = batchTransactionEncoder.encode([
        functionCalls.map(item => item.data),
        functionCalls.map(item => item.destination),
        functionCalls.map(() => constants.ZERO_AMOUNT),
    ]);
    await submitAndExecuteTransactionAsync(governor, governor.address, batchTransactionData);
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
