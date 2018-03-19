import { Deployer } from '@0xproject/deployer';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';

import { zeroExArtifacts as artifacts } from '../src/zeroex_artifacts';

const TESTRPC_NETWORK_ID = 50;

/**
 * Custom migrations should be defined in this function. This will be called with the CLI 'migrate' command.
 * Migrations could be written to run in parallel, but if you want contract addresses to be created deterministically,
 * the migration should be written to run synchronously.
 * @param deployer Deployer instance.
 */
export const runMigrationsAsync = async (deployer: Deployer) => {
    const web3Wrapper: Web3Wrapper = deployer.web3Wrapper;
    const accounts: string[] = await web3Wrapper.getAvailableAddressesAsync();
    const owner = accounts[0];

    const exchangeAddress = artifacts.ExchangeArtifact.networks[TESTRPC_NETWORK_ID].address;
    const tokenTransferProxyAddress = artifacts.TokenTransferProxy.networks[TESTRPC_NETWORK_ID].address;
    const zrxTokenAddress = artifacts.ZRXArtifact.networks[TESTRPC_NETWORK_ID].address;
    const etherTokenAddress = artifacts.EtherTokenArtifact.networks[TESTRPC_NETWORK_ID].address;

    const forwarderArgs = [exchangeAddress, tokenTransferProxyAddress, etherTokenAddress, zrxTokenAddress];
    const forwarder = await deployer.deployAndSaveAsync('Forwarder', forwarderArgs);

    const forwarderInitializeGasEstimate = new BigNumber(90000);
    await forwarder.initialize.sendTransactionAsync({ from: owner, gas: forwarderInitializeGasEstimate });
};
