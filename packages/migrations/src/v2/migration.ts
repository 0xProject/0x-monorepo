import { BigNumber, NULL_BYTES } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider, TxData } from 'ethereum-types';
import * as _ from 'lodash';

import { ArtifactWriter } from '../artifact_writer';
import { ContractName } from '../types';
import { erc20TokenInfo, erc721TokenInfo } from '../utils/token_info';

import { artifacts } from './artifacts';
import { DummyERC20TokenContract } from './contract_wrappers/dummy_e_r_c20_token';
import { DummyERC721TokenContract } from './contract_wrappers/dummy_e_r_c721_token';
import { ERC20ProxyContract } from './contract_wrappers/e_r_c20_proxy';
import { ERC721ProxyContract } from './contract_wrappers/e_r_c721_proxy';
import { ExchangeContract } from './contract_wrappers/exchange';
import { MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract } from './contract_wrappers/multi_sig_wallet_with_time_lock_except_remove_authorized_address';
import { WETH9Contract } from './contract_wrappers/weth9';
import { ZRXTokenContract } from './contract_wrappers/zrx_token';

/**
 * Custom migrations should be defined in this function. This will be called with the CLI 'migrate:v2' command.
 * Migrations could be written to run in parallel, but if you want contract addresses to be created deterministically,
 * the migration should be written to run synchronously.
 * @param provider  Web3 provider instance.
 * @param artifactsDir The directory with compiler artifact files.
 * @param txDefaults Default transaction values to use when deploying contracts.
 */
export const runV2MigrationsAsync = async (provider: Provider, artifactsDir: string, txDefaults: Partial<TxData>) => {
    const web3Wrapper = new Web3Wrapper(provider);
    const networkId = await web3Wrapper.getNetworkIdAsync();
    const artifactsWriter = new ArtifactWriter(artifactsDir, networkId);

    // Proxies
    const erc20proxy = await ERC20ProxyContract.deployFrom0xArtifactAsync(artifacts.ERC20Proxy, provider, txDefaults);
    artifactsWriter.saveArtifact(erc20proxy);
    const erc721proxy = await ERC721ProxyContract.deployFrom0xArtifactAsync(
        artifacts.ERC721Proxy,
        provider,
        txDefaults,
    );
    artifactsWriter.saveArtifact(erc721proxy);

    // ZRX
    const zrxToken = await ZRXTokenContract.deployFrom0xArtifactAsync(artifacts.ZRX, provider, txDefaults);
    artifactsWriter.saveArtifact(zrxToken);

    // Ether token
    const etherToken = await WETH9Contract.deployFrom0xArtifactAsync(artifacts.WETH9, provider, txDefaults);
    artifactsWriter.saveArtifact(etherToken);

    // Exchange
    const exchange = await ExchangeContract.deployFrom0xArtifactAsync(
        artifacts.Exchange,
        provider,
        txDefaults,
        zrxToken.address,
    );
    artifactsWriter.saveArtifact(exchange);

    // Multisigs
    const accounts: string[] = await web3Wrapper.getAvailableAddressesAsync();
    const owners = [accounts[0], accounts[1]];
    const confirmationsRequired = new BigNumber(2);
    const secondsRequired = new BigNumber(0);
    const owner = accounts[0];

    // TODO(leonid) use `AssetProxyOwner` after https://github.com/0xProject/0x-monorepo/pull/571 is merged
    // ERC20 Multisig
    const multiSigERC20 = await MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract.deployFrom0xArtifactAsync(
        artifacts.MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress,
        provider,
        txDefaults,
        owners,
        confirmationsRequired,
        secondsRequired,
        erc20proxy.address,
    );
    artifactsWriter.saveArtifact(multiSigERC20);
    await erc20proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, { from: owner });
    await erc20proxy.transferOwnership.sendTransactionAsync(multiSigERC20.address, { from: owner });

    // ERC721 Multisig
    const multiSigERC721 = await MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddressContract.deployFrom0xArtifactAsync(
        artifacts.MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress,
        provider,
        txDefaults,
        owners,
        confirmationsRequired,
        secondsRequired,
        erc721proxy.address,
    );
    artifactsWriter.saveArtifact(multiSigERC721);
    await erc721proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, { from: owner });
    await erc721proxy.transferOwnership.sendTransactionAsync(multiSigERC721.address, { from: owner });

    // Dummy ERC20 tokens
    for (const token of erc20TokenInfo) {
        const totalSupply = new BigNumber(100000000000000000000);
        const dummyErc20Token = await DummyERC20TokenContract.deployFrom0xArtifactAsync(
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
    const cryptoKittieToken = await DummyERC721TokenContract.deployFrom0xArtifactAsync(
        artifacts.DummyERC721Token,
        provider,
        txDefaults,
        erc721TokenInfo[0].name,
        erc721TokenInfo[0].symbol,
    );
};
