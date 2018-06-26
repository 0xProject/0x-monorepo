import { Token, ZeroEx } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { providerFactory } from '../utils/provider_factory';

const TOKENS_TO_ADD: Token[] = [];

const ZERO_EX_CONFIG = {
    networkId: 1,
};

const mainAsync = async () => {
    const provider = providerFactory.getLedgerProvider();
    const zeroEx = new ZeroEx(provider, ZERO_EX_CONFIG);
    const accounts = await zeroEx.getAvailableAddressesAsync();
    const primaryAccount = _.head(accounts);
    console.log(`Primary account address: ${primaryAccount}`);
    for (const token of TOKENS_TO_ADD) {
        console.log(`Attempting to add token address: ${token.address}`);
        const txHash = await zeroEx.tokenRegistry.addTokenAsync(token, primaryAccount || ZeroEx.NULL_ADDRESS);
        console.log(`Awaiting txHash: ${txHash}`);
        const txReceipt = await zeroEx.awaitTransactionMinedAsync(txHash);
        console.log(`Added receipt: ${JSON.stringify(txReceipt)}`);
    }
};

mainAsync().catch(console.error);
