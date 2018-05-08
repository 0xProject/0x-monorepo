import { Provider, TxData } from '@0xproject/types';
import { BigNumber, NULL_BYTES } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';

import { artifacts, ArtifactWriter } from './artifacts';
import { DummyTokenContract } from './contract_wrappers/dummy_token';
import { ExchangeContract } from './contract_wrappers/exchange';
import { MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract } from './contract_wrappers/multi_sig_wallet_with_time_lock_except_remove_authorized_address';
import { TokenRegistryContract } from './contract_wrappers/token_registry';
import { TokenTransferProxyContract } from './contract_wrappers/token_transfer_proxy';
import { WETH9Contract } from './contract_wrappers/weth9';
import { ZRXTokenContract } from './contract_wrappers/zrx_token';
import { ContractName } from './types';
import { tokenInfo } from './utils/token_info';

/**
 * Custom migrations should be defined in this function. This will be called with the CLI 'migrate' command.
 * Migrations could be written to run in parallel, but if you want contract addresses to be created deterministically,
 * the migration should be written to run synchronously.
 * @param deployer Deployer instance.
 */
export const runMigrationsAsync = async (provider: Provider, artifactsDir: string, defaults: Partial<TxData>) => {
    const web3Wrapper = new Web3Wrapper(provider);
    const networkId = await web3Wrapper.getNetworkIdAsync();
    const artifactsWriter = new ArtifactWriter(artifactsDir, networkId);
    const tokenTransferProxy = await TokenTransferProxyContract.deploy0xArtifactAsync(
        artifacts.TokenTransferProxy,
        provider,
        defaults,
    );
    artifactsWriter.saveArtifact(tokenTransferProxy);
    const zrxToken = await ZRXTokenContract.deploy0xArtifactAsync(artifacts.ZRX, provider, defaults);
    artifactsWriter.saveArtifact(zrxToken);

    const etherToken = await WETH9Contract.deploy0xArtifactAsync(artifacts.EtherToken, provider, defaults);
    artifactsWriter.saveArtifact(etherToken);
    const tokenReg = await TokenRegistryContract.deploy0xArtifactAsync(artifacts.TokenRegistry, provider, defaults);
    artifactsWriter.saveArtifact(tokenReg);

    const accounts: string[] = await web3Wrapper.getAvailableAddressesAsync();
    const owners = [accounts[0], accounts[1]];
    const confirmationsRequired = new BigNumber(2);
    const secondsRequired = new BigNumber(0);
    const exchange = await ExchangeContract.deploy0xArtifactAsync(
        artifacts.Exchange,
        provider,
        defaults,
        zrxToken.address,
        tokenTransferProxy.address,
    );
    artifactsWriter.saveArtifact(exchange);
    const multiSig = await MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract.deploy0xArtifactAsync(
        artifacts.MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress,
        provider,
        defaults,
        owners,
        confirmationsRequired,
        secondsRequired,
        tokenTransferProxy.address,
    );
    artifactsWriter.saveArtifact(multiSig);

    const owner = accounts[0];
    await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, { from: owner });
    await tokenTransferProxy.transferOwnership.sendTransactionAsync(multiSig.address, { from: owner });
    const addTokenGasEstimate = await tokenReg.addToken.estimateGasAsync(
        zrxToken.address,
        tokenInfo[0].name,
        tokenInfo[0].symbol,
        tokenInfo[0].decimals,
        tokenInfo[0].ipfsHash,
        tokenInfo[0].swarmHash,
        { from: owner },
    );
    await tokenReg.addToken.sendTransactionAsync(
        zrxToken.address,
        '0x Protocol Token',
        'ZRX',
        18,
        NULL_BYTES,
        NULL_BYTES,
        {
            from: owner,
            gas: addTokenGasEstimate,
        },
    );
    await tokenReg.addToken.sendTransactionAsync(
        etherToken.address,
        'Ether Token',
        'WETH',
        18,
        NULL_BYTES,
        NULL_BYTES,
        {
            from: owner,
            gas: addTokenGasEstimate,
        },
    );
    for (const token of tokenInfo) {
        const totalSupply = new BigNumber(100000000000000000000);
        const dummyToken = await DummyTokenContract.deploy0xArtifactAsync(
            artifacts.DummyToken,
            provider,
            defaults,
            token.name,
            token.symbol,
            token.decimals,
            totalSupply,
        );
        await tokenReg.addToken.sendTransactionAsync(
            dummyToken.address,
            token.name,
            token.symbol,
            token.decimals,
            token.ipfsHash,
            token.swarmHash,
            {
                from: owner,
                gas: addTokenGasEstimate,
            },
        );
    }
};
