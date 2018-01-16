import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';

import { Deployer } from './../src/deployer';
import { constants } from './../src/utils/constants';
import { tokenInfo } from './config/token_info';

export const migrator = {
    /**
     * Custom migrations should be defined in this function. This will be called with the CLI 'migrate' command.
     * Some operations might be completed in parallel, but we don't do that on purpose.
     * That way the addresses are deterministic.
     * @param deployer Deployer instance.
     */
    async runMigrationsAsync(deployer: Deployer): Promise<void> {
        const web3Wrapper: Web3Wrapper = deployer.web3Wrapper;
        const accounts: string[] = await web3Wrapper.getAvailableAddressesAsync();

        const tokenTransferProxy = await deployer.deployAndSaveAsync('TokenTransferProxy');
        const zrxToken = await deployer.deployAndSaveAsync('ZRXToken');
        const etherToken = await deployer.deployAndSaveAsync('WETH9');
        const tokenReg = await deployer.deployAndSaveAsync('TokenRegistry');

        const exchangeArgs = [zrxToken.address, tokenTransferProxy.address];
        const owners = [accounts[0], accounts[1]];
        const confirmationsRequired = new BigNumber(2);
        const secondsRequired = new BigNumber(0);
        const multiSigArgs = [owners, confirmationsRequired, secondsRequired, tokenTransferProxy.address];
        const exchange = await deployer.deployAndSaveAsync('Exchange', exchangeArgs);
        const multiSig = await deployer.deployAndSaveAsync(
            'MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress',
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
            constants.NULL_BYTES,
            constants.NULL_BYTES,
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
            constants.NULL_BYTES,
            constants.NULL_BYTES,
            {
                from: owner,
                gas: addTokenGasEstimate,
            },
        );
        for (const token of tokenInfo) {
            const totalSupply = new BigNumber(0);
            const args = [token.name, token.symbol, token.decimals, totalSupply];
            const dummyToken = await deployer.deployAsync('DummyToken', args);
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
    },
};
