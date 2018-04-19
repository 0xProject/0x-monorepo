import { Deployer } from '@0xproject/deployer';
import { BigNumber, NULL_BYTES } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';

import { ContractName } from './types';
import { tokenInfo } from './utils/token_info';

/**
 * Custom migrations should be defined in this function. This will be called with the CLI 'migrate' command.
 * Migrations could be written to run in parallel, but if you want contract addresses to be created deterministically,
 * the migration should be written to run synchronously.
 * @param deployer Deployer instance.
 */
export const runMigrationsAsync = async (deployer: Deployer) => {
    const web3Wrapper: Web3Wrapper = deployer.web3Wrapper;
    const accounts: string[] = await web3Wrapper.getAvailableAddressesAsync();

    const tokenTransferProxy = await deployer.deployAndSaveAsync(ContractName.TokenTransferProxy);
    const zrxToken = await deployer.deployAndSaveAsync(ContractName.ZRXToken);
    const etherToken = await deployer.deployAndSaveAsync(ContractName.WETH9);
    const tokenReg = await deployer.deployAndSaveAsync(ContractName.TokenRegistry);

    const exchangeArgs = [zrxToken.address, tokenTransferProxy.address];
    const owners = [accounts[0], accounts[1]];
    const confirmationsRequired = new BigNumber(2);
    const secondsRequired = new BigNumber(0);
    const multiSigArgs = [owners, confirmationsRequired, secondsRequired, tokenTransferProxy.address];
    const exchange = await deployer.deployAndSaveAsync(ContractName.Exchange, exchangeArgs);
    const multiSig = await deployer.deployAndSaveAsync(
        ContractName.MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress,
        multiSigArgs,
    );

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
        const args = [token.name, token.symbol, token.decimals, totalSupply];
        const dummyToken = await deployer.deployAsync(ContractName.DummyToken, args);
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
