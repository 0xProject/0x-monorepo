import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { ExchangeContract } from '@0x/contracts-exchange';
import { StakingContract, StakingProxyContract, ZrxVaultContract } from '@0x/contracts-staking';
import { IAuthorizableContract, IOwnableContract } from '@0x/contracts-utils';
import { Web3ProviderEngine } from '@0x/subproviders';
import { BigNumber } from '@0x/utils';

import { constants } from './constants';

export interface TimelockRegistration {
    functionSelector: string;
    destination: string;
    secondsTimeLocked: BigNumber;
}

/**
 * Gets the custom timelock configs that correspond the the network of the given provider.
 * @param provider Web3 provider instance.
 */
export function getTimelockRegistrationsByChainId(chainId: number): TimelockRegistration[] {
    const deployedAddresses = getContractAddressesForChainOrThrow(chainId);

    const provider = new Web3ProviderEngine();
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
            functionSelector: authorizableInterface.getSelector('removeAuthorizedAddress'),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.erc20Proxy,
            functionSelector: authorizableInterface.getSelector('removeAuthorizedAddressAtIndex'),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.erc721Proxy,
            functionSelector: authorizableInterface.getSelector('removeAuthorizedAddress'),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.erc721Proxy,
            functionSelector: authorizableInterface.getSelector('removeAuthorizedAddressAtIndex'),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.erc1155Proxy,
            functionSelector: authorizableInterface.getSelector('removeAuthorizedAddress'),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.erc1155Proxy,
            functionSelector: authorizableInterface.getSelector('removeAuthorizedAddressAtIndex'),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.multiAssetProxy,
            functionSelector: authorizableInterface.getSelector('removeAuthorizedAddress'),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.multiAssetProxy,
            functionSelector: authorizableInterface.getSelector('removeAuthorizedAddressAtIndex'),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.erc20BridgeProxy,
            functionSelector: authorizableInterface.getSelector('removeAuthorizedAddress'),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.erc20BridgeProxy,
            functionSelector: authorizableInterface.getSelector('removeAuthorizedAddressAtIndex'),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        // ZrxVault timelocks
        {
            destination: deployedAddresses.zrxVault,
            functionSelector: zrxVault.getSelector('enterCatastrophicFailure'),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
        // Exchange timelocks

        {
            destination: deployedAddresses.exchange,
            functionSelector: exchange.getSelector('detachProtocolFeeCollector'),
            secondsTimeLocked: constants.ZERO_AMOUNT,
        },
    ];

    const customTimelockRegistrations = [
        // ZrxVault timelocks
        {
            destination: deployedAddresses.zrxVault,
            functionSelector: zrxVault.getSelector('setStakingProxy'),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.zrxVault,
            functionSelector: zrxVault.getSelector('setZrxProxy'),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.zrxVault,
            functionSelector: ownableInterface.getSelector('transferOwnership'),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.zrxVault,
            functionSelector: authorizableInterface.getSelector('addAuthorizedAddress'),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.zrxVault,
            functionSelector: authorizableInterface.getSelector('removeAuthorizedAddress'),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.zrxVault,
            functionSelector: authorizableInterface.getSelector('removeAuthorizedAddressAtIndex'),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        // StakingProxy timelocks
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: stakingProxy.getSelector('attachStakingContract'),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: stakingProxy.getSelector('detachStakingContract'),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: stakingLogic.getSelector('setParams'),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TEN_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: stakingLogic.getSelector('addExchangeAddress'),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: stakingLogic.getSelector('removeExchangeAddress'),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: ownableInterface.getSelector('transferOwnership'),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: authorizableInterface.getSelector('addAuthorizedAddress'),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: authorizableInterface.getSelector('removeAuthorizedAddress'),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.stakingProxy,
            functionSelector: authorizableInterface.getSelector('removeAuthorizedAddressAtIndex'),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        // Exchange timelocks
        {
            destination: deployedAddresses.exchange,
            functionSelector: exchange.getSelector('setProtocolFeeMultiplier'),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TEN_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
        {
            destination: deployedAddresses.exchange,
            functionSelector: exchange.getSelector('setProtocolFeeCollectorAddress'),
            secondsTimeLocked:
                chainId === constants.MAINNET_CHAIN_ID ? constants.TWENTY_DAYS_IN_SEC : constants.ZERO_AMOUNT,
        },
    ];

    return [...noTimelockRegistrations, ...customTimelockRegistrations];
}
