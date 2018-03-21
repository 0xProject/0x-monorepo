import { Deployer } from '@0xproject/deployer';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';

function getPartialNameFromFileName(filename: string): string {
    const name = path.parse(filename).name;
    return name;
}
function getNamedContent(filename: string): { name: string; content: string } {
    const name = getPartialNameFromFileName(filename);
    try {
        const content = fs.readFileSync(filename).toString();
        return {
            name,
            content,
        };
    } catch (err) {
        throw new Error(`Failed to read ${filename}: ${err}`);
    }
}

interface ContractArtifact {
    address: string;
}
function getContractArtifactForNetwork(contract: string, networkId: number): ContractArtifact {
    const namedContent = getNamedContent(`./src/artifacts/${contract}.json`);
    const parsedContent = JSON.parse(namedContent.content);
    const artifact = parsedContent.networks[networkId];
    if (_.isUndefined(artifact)) {
        throw new Error(`No artifact found for ${contract} on network ${networkId}`);
    }
    return artifact;
}

const TESTRPC_NETWORK_ID = 50;
/**
 * Custom migrations should be defined in this function. This will be called with the CLI 'migrate' command.
 * Migrations could be written to run in parallel, but if you want contract addresses to be created deterministically,
 * the migration should be written to run synchronously.
 * @param deployer Deployer instance.
 */
export const runMigrationsAsync = async (deployer: Deployer) => {
    const exchangeArtifact = getContractArtifactForNetwork('Exchange', TESTRPC_NETWORK_ID);
    const tokenTransferProxyArtifact = getContractArtifactForNetwork('TokenTransferProxy', TESTRPC_NETWORK_ID);
    const zrxTokenArtifact = getContractArtifactForNetwork('ZRXToken', TESTRPC_NETWORK_ID);
    const etherTokenArtifact = getContractArtifactForNetwork('WETH9', TESTRPC_NETWORK_ID);
    const web3Wrapper: Web3Wrapper = deployer.web3Wrapper;
    // const accounts: string[] = await web3Wrapper.getAvailableAddressesAsync();
    // tslint:disable-next-line:no-console
    console.log(exchangeArtifact.address);
    const forwarderArgs = [
        exchangeArtifact.address,
        tokenTransferProxyArtifact.address,
        etherTokenArtifact.address,
        zrxTokenArtifact.address,
    ];
    const forwarder = await deployer.deployAndSaveAsync('Forwarder', forwarderArgs);

    // const tokenTransferProxy = await deployer.deployAndSaveAsync(ContractName.TokenTransferProxy);
    // const zrxToken = await deployer.deployAndSaveAsync(ContractName.ZRXToken);
    // const etherToken = await deployer.deployAndSaveAsync(ContractName.EtherToken);
    // const tokenReg = await deployer.deployAndSaveAsync(ContractName.TokenRegistry);

    // const exchangeArgs = [zrxToken.address, tokenTransferProxy.address];
    // const owners = [accounts[0], accounts[1]];
    // const confirmationsRequired = new BigNumber(2);
    // const secondsRequired = new BigNumber(0);
    // const multiSigArgs = [owners, confirmationsRequired, secondsRequired, tokenTransferProxy.address];
    // const exchange = await deployer.deployAndSaveAsync(ContractName.Exchange, exchangeArgs);
    // const multiSig = await deployer.deployAndSaveAsync(
    //     ContractName.MultiSigWalletWithTimeLockExceptRemoveAuthorizedAddress,
    //     multiSigArgs,
    // );

    // const owner = accounts[0];
    // await tokenTransferProxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, { from: owner });
    // await tokenTransferProxy.transferOwnership.sendTransactionAsync(multiSig.address, { from: owner });
    // const addTokenGasEstimate = await tokenReg.addToken.estimateGasAsync(
    //     zrxToken.address,
    //     tokenInfo[0].name,
    //     tokenInfo[0].symbol,
    //     tokenInfo[0].decimals,
    //     tokenInfo[0].ipfsHash,
    //     tokenInfo[0].swarmHash,
    //     { from: owner },
    // );
    // await tokenReg.addToken.sendTransactionAsync(
    //     zrxToken.address,
    //     '0x Protocol Token',
    //     'ZRX',
    //     18,
    //     constants.NULL_BYTES,
    //     constants.NULL_BYTES,
    //     {
    //         from: owner,
    //         gas: addTokenGasEstimate,
    //     },
    // );
    // await tokenReg.addToken.sendTransactionAsync(
    //     etherToken.address,
    //     'Ether Token',
    //     'WETH',
    //     18,
    //     constants.NULL_BYTES,
    //     constants.NULL_BYTES,
    //     {
    //         from: owner,
    //         gas: addTokenGasEstimate,
    //     },
    // );
    // for (const token of tokenInfo) {
    //     const totalSupply = new BigNumber(0);
    //     const args = [token.name, token.symbol, token.decimals, totalSupply];
    //     const dummyToken = await deployer.deployAsync(ContractName.DummyToken, args);
    //     await tokenReg.addToken.sendTransactionAsync(
    //         dummyToken.address,
    //         token.name,
    //         token.symbol,
    //         token.decimals,
    //         token.ipfsHash,
    //         token.swarmHash,
    //         {
    //             from: owner,
    //             gas: addTokenGasEstimate,
    //         },
    //     );
    // }
};
