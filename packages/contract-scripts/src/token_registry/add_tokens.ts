import { Token, ZeroEx } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import * as opn from 'opn';

import * as tokensToAddJSON from './token_data/tokens_to_add.json';

import { providerFactory } from '../utils/provider_factory';

const TOKENS_TO_ADD: Token[] = [
    {
        address: '0x1985365e9f78359a9b6ad760e32412f4a445e862',
        decimals: 18,
        symbol: 'REP',
        name: 'Augur',
    },
];

const ZERO_EX_CONFIG = {
    networkId: 1,
};

const mainAsync = async () => {
    // const tokens = transformToTokens(tokensToAddJSON);
    const tokens = TOKENS_TO_ADD;
    const provider = providerFactory.getLedgerProvider();
    const zeroEx = new ZeroEx(provider, ZERO_EX_CONFIG);
    const accounts = await zeroEx.getAvailableAddressesAsync();
    const primaryAccount = _.head(accounts);
    console.log(`Primary account address: ${primaryAccount}`);

    const existingTokens = await zeroEx.tokenRegistry.getTokensAsync();
    const existingTokenAddresses = _.map(existingTokens, token => token.address);
    for (const token of tokens) {
        if (!_.includes(existingTokenAddresses, token.address)) {
            console.log(`Attempting to add token symbol: ${token.symbol} address: ${token.address}`);
            const txHash = await zeroEx.tokenRegistry.addTokenAsync(token, primaryAccount || ZeroEx.NULL_ADDRESS);
            console.log(`Awaiting txHash: ${txHash}`);
            opn(`https://etherscan.io/tx/${txHash}`);
            const txReceipt = await zeroEx.awaitTransactionMinedAsync(txHash);
            console.log(`Added receipt: ${JSON.stringify(txReceipt)}`);
        }
    }
};

mainAsync().catch(console.error);

function transformToTokens(json: any): Token[] {
    return _.compact(_.map(json, transformRowToToken));
}

function transformRowToToken(row: any[]): Token | undefined {
    const state = row[5];
    if (state === 'OK' || state === 'NEUTRAL') {
        const address = row[0];
        const name = row[1];
        const symbol = row[2];
        const decimals = row[3];
        return {
            name,
            address,
            symbol,
            decimals,
        };
    } else {
        return undefined;
    }
}
