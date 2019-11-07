import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { ExchangeContract } from '@0x/contracts-exchange';
import { StakingContract, StakingProxyContract, ZrxVaultContract } from '@0x/contracts-staking';
import { IAuthorizableContract, IOwnableContract } from '@0x/contracts-utils';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { SupportedProvider } from 'ethereum-types';

import { constants } from './constants';

export interface TimelockRegistration {
    functionSelector: string;
    destination: string;
    secondsTimeLocked: BigNumber;
}

export async function getTimelockRegistrationsAsync(provider: SupportedProvider): Promise<TimelockRegistration[]> {
    const web3Wrapper = new Web3Wrapper(provider);
    const chainId = await web3Wrapper.getChainIdAsync();
    const deployedAddresses = getContractAddressesForChainOrThrow(chainId);

    const authorizableInterface = new IAuthorizableContract(constants.NULL_ADDRESS, provider);
    const ownableInterface = new IOwnableContract(constants.NULL_ADDRESS, provider);
    const zrxVault = new ZrxVaultContract(constants.NULL_ADDRESS, provider);
    const stakingProxy = new StakingProxyContract(constants.NULL_ADDRESS, provider);
    const exchange = new ExchangeContract(constants.NULL_ADDRESS, provider);
    const stakingLogic = new StakingContract(constants.NULL_ADDRESS, provider);

    const noTimelockRegistrations = [
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
            destination: deployedAddresses.erc20BridgeProxy,
            functionSelector: authorizableInterface.removeAuthorizedAddress.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.erc20BridgeProxy,
            functionSelector: authorizableInterface.removeAuthorizedAddressAtIndex.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        // ZrxVault timelocks
        {
            destination: deployedAddresses.zrxVault,
            functionSelector: zrxVault.enterCatastrophicFailure.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        // Exchange timelocks

        {
            destination: exchange.address,
            functionSelector: exchange.detachProtocolFeeCollector.getSelector(),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
    ];

    const customTimelockRegistrations = [
        // ZrxVault timelocks
        {
            destination: deployedAddresses.zrxVault,
            functionSelector: zrxVault.setStakingProxy.getSelector(),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.zrxVault,
            functionSelector: zrxVault.setZrxProxy.getSelector(),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.zrxVault,
            functionSelector: ownableInterface.transferOwnership.getSelector(),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.zrxVault,
            functionSelector: authorizableInterface.addAuthorizedAddress.getSelector(),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.zrxVault,
            functionSelector: authorizableInterface.removeAuthorizedAddress.getSelector(),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.zrxVault,
            functionSelector: authorizableInterface.removeAuthorizedAddressAtIndex.getSelector(),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        // StakingProxy timelocks
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: stakingProxy.attachStakingContract.getSelector(),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: stakingProxy.detachStakingContract.getSelector(),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: stakingLogic.setParams.getSelector(),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TEN_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: stakingLogic.addExchangeAddress.getSelector(),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: stakingLogic.removeExchangeAddress.getSelector(),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: ownableInterface.transferOwnership.getSelector(),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: authorizableInterface.addAuthorizedAddress.getSelector(),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: authorizableInterface.removeAuthorizedAddress.getSelector(),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: authorizableInterface.removeAuthorizedAddressAtIndex.getSelector(),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        // Exchange timelocks
        {
            destination: exchange.address,
            functionSelector: exchange.setProtocolFeeMultiplier.getSelector(),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TEN_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: exchange.address,
            functionSelector: exchange.setProtocolFeeCollectorAddress.getSelector(),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
    ];

    return [...noTimelockRegistrations, ...customTimelockRegistrations];
}
