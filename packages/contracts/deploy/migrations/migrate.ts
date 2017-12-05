import {BigNumber} from 'bignumber.js';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import {Deployer} from './../src/deployer';
import {constants} from './../src/utils/constants';
import {Token} from './../src/utils/types';
import {Web3Wrapper} from './../src/utils/web3_wrapper';
import {tokenInfo} from './config/token_info';

export const migrator = {
    /**
     * Custom migrations should be defined in this function. This will be called with the CLI 'migrate' command.
     * @param deployer Deployer instance.
     */
    async runMigrationsAsync(deployer: Deployer): Promise<void> {
        const web3Wrapper: Web3Wrapper = deployer.web3Wrapper;
        const accounts: string[] = await web3Wrapper.getAvailableAddressesAsync();

        const independentContracts: Web3.ContractInstance[] = await Promise.all([
            deployer.deployAndSaveAsync('TokenTransferProxy'),
            deployer.deployAndSaveAsync('ZRXToken'),
            deployer.deployAndSaveAsync('EtherToken'),
            deployer.deployAndSaveAsync('TokenRegistry'),
        ]);
        const [tokenTransferProxy, zrxToken, etherToken, tokenReg] = independentContracts;

        const exchangeArgs = [zrxToken.address, tokenTransferProxy.address];
        const owners = [accounts[0], accounts[1]];
        const confirmationsRequired = new BigNumber(2);
        const secondsRequired = new BigNumber(0);
        const multiSigArgs = [owners, confirmationsRequired, secondsRequired, tokenTransferProxy.address];
        const dependentContracts: Web3.ContractInstance[] = await Promise.all([
            deployer.deployAndSaveAsync('Exchange', exchangeArgs),
            deployer.deployAndSaveAsync('MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress', multiSigArgs),
        ]);
        const [exchange, multiSig] = dependentContracts;

        const owner = accounts[0];
        await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, {from: owner});
        await tokenTransferProxy.transferOwnership.sendTransactionAsync(multiSig.address, {from: owner});

        const tokensToRegister: Web3.ContractInstance[] = await Promise.all(
            _.map(tokenInfo, async (token: Token): Promise<Web3.ContractInstance> => {
                const totalSupply = new BigNumber(0);
                const args = [
                    token.name,
                    token.symbol,
                    token.decimals,
                    totalSupply,
                ];
                return deployer.deployAsync('DummyToken', args);
            }),
        );
        const addTokenGasEstimate = await tokenReg.addToken.estimateGasAsync(
            tokensToRegister[0].address,
            tokenInfo[0].name,
            tokenInfo[0].symbol,
            tokenInfo[0].decimals,
            tokenInfo[0].ipfsHash,
            tokenInfo[0].swarmHash,
            {from: owner},
        );
        const addTokenPromises = [
            tokenReg.addToken.sendTransactionAsync(
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
            ),
            tokenReg.addToken.sendTransactionAsync(
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
            ),
        ];
        const addDummyTokenPromises = _.map(tokenInfo, async (token: Token, i: number): Promise<void> => {
            return tokenReg.addToken.sendTransactionAsync(
                tokensToRegister[i].address,
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
        });
        await Promise.all([...addDummyTokenPromises, ...addTokenPromises]);
    },
};
