import { getContractAddressesForNetworkOrThrow } from '@0x/contract-addresses';
import { AssetProxyOwnerContract, ERC20ProxyContract } from '@0x/contract-wrappers';
import { artifacts, AssetProxyOwnerContract as GovernanceMultisigContract } from '@0x/contracts-multisig';
import { AbiEncoder, BigNumber, providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { MethodAbi, SupportedProvider, TxData } from 'ethereum-types';

export async function runMigrationsAsync(supportedProvider: SupportedProvider, txDefaults: TxData): Promise<void> {
    const provider = providerUtils.standardizeOrThrow(supportedProvider);
    const web3Wrapper = new Web3Wrapper(provider);
    const chainId = new BigNumber(await providerUtils.getChainIdAsync(provider));
    const networkId = await web3Wrapper.getNetworkIdAsync();
    const deployedAddresses = getContractAddressesForNetworkOrThrow(networkId);
    // const noTimeLockMethods = [{destination: }]
    const governanceMultisig = await GovernanceMultisigContract.deployFrom0xArtifactAsync(
        artifacts.AssetProxyOwner,
        provider,
        txDefaults,
        artifacts,
    );
}
