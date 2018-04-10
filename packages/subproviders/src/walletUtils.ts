import ethUtil = require('ethereumjs-util');
import HDNode = require('hdkey');
import * as _ from 'lodash';

import { DerivedHDKey, WalletSubproviderErrors } from './types';

const DEFAULT_ADDRESS_SEARCH_OFFSET = 0;
const BATCH_SIZE = 10;
export const walletUtils = {
    _calculateDerivedHDKeys(
        initialHDKey: HDNode,
        derivationPath: string,
        searchLimit: number,
        offset: number = DEFAULT_ADDRESS_SEARCH_OFFSET,
    ): DerivedHDKey[] {
        const derivedKeys: DerivedHDKey[] = [];
        _.times(searchLimit, i => {
            const path = `m/${derivationPath}/${i + offset}`;
            const hdKey = initialHDKey.derive(path);
            const derivedPublicKey = hdKey.publicKey;
            const shouldSanitizePublicKey = true;
            const ethereumAddressUnprefixed = ethUtil
                .publicToAddress(derivedPublicKey, shouldSanitizePublicKey)
                .toString('hex');
            const address = ethUtil.addHexPrefix(ethereumAddressUnprefixed);
            const derivedKey: DerivedHDKey = {
                derivationPath: path,
                hdKey,
                address,
            };
            derivedKeys.push(derivedKey);
        });
        return derivedKeys;
    },

    _findDerivedKeyByAddress(
        address: string,
        initialHDKey: HDNode,
        derivationPath: string,
        searchLimit: number,
    ): DerivedHDKey | undefined {
        let matchedKey: DerivedHDKey | undefined;
        for (let index = 0; index < searchLimit; index = index + BATCH_SIZE) {
            const derivedKeys = walletUtils._calculateDerivedHDKeys(initialHDKey, derivationPath, BATCH_SIZE, index);
            matchedKey = _.find(derivedKeys, derivedKey => derivedKey.address === address);
            if (matchedKey) {
                break;
            }
        }
        return matchedKey;
    },

    _firstDerivedKey(initialHDKey: HDNode, derivationPath: string): DerivedHDKey {
        const derivedKeys = walletUtils._calculateDerivedHDKeys(initialHDKey, derivationPath, 1);
        const firstDerivedKey = derivedKeys[0];
        return firstDerivedKey;
    },
};
