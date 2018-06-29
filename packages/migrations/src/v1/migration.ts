import { BigNumber, NULL_BYTES } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider, TxData } from 'ethereum-types';

import { ArtifactWriter } from '../artifact_writer';
import { erc20TokenInfo } from '../utils/token_info';

import { artifacts } from './artifacts';
import { DummyERC20TokenContract } from './contract_wrappers/dummy_erc20_token';
import { Exchange_v1Contract } from './contract_wrappers/exchange_v1';
import { MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract } from './contract_wrappers/multi_sig_wallet_with_time_lock_except_remove_authorized_address';
import { TokenRegistryContract } from './contract_wrappers/token_registry';
import { TokenTransferProxy_v1Contract } from './contract_wrappers/tokentransferproxy_v1';
import { WETH9Contract } from './contract_wrappers/weth9';
import { ZRXTokenContract } from './contract_wrappers/zrx_token';

/**
 * Custom migrations should be defined in this function. This will be called with the CLI 'migrate:v1' command.
 * Migrations could be written to run in parallel, but if you want contract addresses to be created deterministically,
 * the migration should be written to run synchronously.
 * @param provider  Web3 provider instance.
 * @param artifactsDir The directory with compiler artifact files.
 * @param txDefaults Default transaction values to use when deploying contracts.
 */
export const runV1MigrationsAsync = async (provider: Provider, artifactsDir: string, txDefaults: Partial<TxData>) => {
    const web3Wrapper = new Web3Wrapper(provider);
    const networkId = await web3Wrapper.getNetworkIdAsync();
    const artifactsWriter = new ArtifactWriter(artifactsDir, networkId);
    const tokenTransferProxy = await TokenTransferProxy_v1Contract.deployFrom0xArtifactAsync(
        artifacts.TokenTransferProxy,
        provider,
        txDefaults,
    );
    artifactsWriter.saveArtifact(tokenTransferProxy);
    const zrxToken = await ZRXTokenContract.deployFrom0xArtifactAsync(artifacts.ZRX, provider, txDefaults);
    artifactsWriter.saveArtifact(zrxToken);

    const etherToken = await WETH9Contract.deployFrom0xArtifactAsync(artifacts.EtherToken, provider, txDefaults);
    artifactsWriter.saveArtifact(etherToken);
    const tokenReg = await TokenRegistryContract.deployFrom0xArtifactAsync(
        artifacts.TokenRegistry,
        provider,
        txDefaults,
    );
    artifactsWriter.saveArtifact(tokenReg);

    const accounts: string[] = await web3Wrapper.getAvailableAddressesAsync();
    const owners = [accounts[0], accounts[1]];
    const confirmationsRequired = new BigNumber(2);
    const secondsRequired = new BigNumber(0);
    const exchange = await Exchange_v1Contract.deployFrom0xArtifactAsync(
        artifacts.Exchange,
        provider,
        txDefaults,
        zrxToken.address,
        tokenTransferProxy.address,
    );
    artifactsWriter.saveArtifact(exchange);
    const multiSig = await MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract.deployFrom0xArtifactAsync(
        artifacts.MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress,
        provider,
        txDefaults,
        owners,
        confirmationsRequired,
        secondsRequired,
        tokenTransferProxy.address,
    );
    artifactsWriter.saveArtifact(multiSig);

    const owner = accounts[0];

    await web3Wrapper.awaitTransactionSuccessAsync(
        await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, { from: owner }),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await tokenTransferProxy.transferOwnership.sendTransactionAsync(multiSig.address, { from: owner }),
    );
    const addTokenGasEstimate = await tokenReg.addToken.estimateGasAsync(
        zrxToken.address,
        erc20TokenInfo[0].name,
        erc20TokenInfo[0].symbol,
        erc20TokenInfo[0].decimals,
        erc20TokenInfo[0].ipfsHash,
        erc20TokenInfo[0].swarmHash,
        { from: owner },
    );
    const decimals = 18;
    await web3Wrapper.awaitTransactionSuccessAsync(
        await tokenReg.addToken.sendTransactionAsync(
            zrxToken.address,
            '0x Protocol Token',
            'ZRX',
            decimals,
            NULL_BYTES,
            NULL_BYTES,
            {
                from: owner,
                gas: addTokenGasEstimate,
            },
        ),
    );
    await web3Wrapper.awaitTransactionSuccessAsync(
        await tokenReg.addToken.sendTransactionAsync(
            etherToken.address,
            'Ether Token',
            'WETH',
            decimals,
            NULL_BYTES,
            NULL_BYTES,
            {
                from: owner,
                gas: addTokenGasEstimate,
            },
        ),
    );
    for (const token of erc20TokenInfo) {
        const totalSupply = new BigNumber(100000000000000000000);
        const dummyToken = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
            artifacts.DummyERC20Token,
            provider,
            txDefaults,
            token.name,
            token.symbol,
            token.decimals,
            totalSupply,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
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
            ),
        );
    }
};
