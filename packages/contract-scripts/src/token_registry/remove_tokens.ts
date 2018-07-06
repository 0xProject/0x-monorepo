import { ZeroEx } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { providerFactory } from '../utils/provider_factory';

const TOKEN_ADDRESSES_TO_REMOVE: string[] = ['0xe94327d07fc17907b4db788e5adf2ed424addff6'];

const ZERO_EX_CONFIG = {
    networkId: 1,
};

const mainAsync = async () => {
    const provider = providerFactory.getLedgerProvider();
    const zeroEx = new ZeroEx(provider, ZERO_EX_CONFIG);
    const accounts = await zeroEx.getAvailableAddressesAsync();
    const primaryAccount = _.head(accounts);
    console.log(`Primary account address: ${primaryAccount}`);
    const tokenAddresses = await zeroEx.tokenRegistry.getTokenAddressesAsync();
    for (const addressToRemove of TOKEN_ADDRESSES_TO_REMOVE) {
        console.log(`Attempting to remove token address: ${addressToRemove}`);
        const index = _.indexOf(tokenAddresses, addressToRemove);
        if (index >= 0) {
            const txHash = await zeroEx.tokenRegistry.removeTokenAsync(
                addressToRemove,
                new BigNumber(index),
                primaryAccount || ZeroEx.NULL_ADDRESS,
            );
            console.log(`Awaiting txHash: ${txHash}`);
            const txReceipt = await zeroEx.awaitTransactionMinedAsync(txHash);
            console.log(`Removed receipt: ${JSON.stringify(txReceipt)}`);
        } else {
            console.log(`Could not find token address: ${addressToRemove}`);
        }
    }
};

mainAsync().catch(console.error);
