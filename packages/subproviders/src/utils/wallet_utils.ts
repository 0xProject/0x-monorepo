import ethUtil = require('ethereumjs-util');
import HDNode = require('hdkey');
import * as _ from 'lodash';

import { DerivedHDKey, WalletSubproviderErrors } from '../types';

const DEFAULT_ADDRESS_SEARCH_OFFSET = 0;
const BATCH_SIZE = 10;

// Derivation Paths
// BIP44 m / purpose' / coin_type' / account' / change / address_index
// m/44'/60'/0'/0
// m/44'/60'/0'/0/0
// m/44'/60'/0'/0/{account_index} - testrpc
// m/44'/60'/0'  - ledger

export const walletUtils = {
    _calculateDerivedHDKeys(
        initialHDKey: HDNode,
        derivationPath: string,
        searchLimit: number,
        offset: number = DEFAULT_ADDRESS_SEARCH_OFFSET,
        hardened: boolean = false,
    ): DerivedHDKey[] {
        const derivedKeys: DerivedHDKey[] = [];
        _.times(searchLimit, i => {
            const derivationIndex = offset + i;
            const path = hardened ? `m/${derivationIndex}` : `m/${derivationPath}/${derivationIndex}`;
            const hdKey = initialHDKey.derive(path);
            const derivedPublicKey = hdKey.publicKey;
            const shouldSanitizePublicKey = true;
            const ethereumAddressUnprefixed = ethUtil
                .publicToAddress(derivedPublicKey, shouldSanitizePublicKey)
                .toString('hex');
            const address = ethUtil.addHexPrefix(ethereumAddressUnprefixed);
            const derivedKey: DerivedHDKey = {
                derivationPath,
                hdKey,
                address,
                derivationIndex,
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
        hardened: boolean = false,
    ): DerivedHDKey | undefined {
        let matchedKey: DerivedHDKey | undefined;
        for (let index = 0; index < searchLimit; index = index + BATCH_SIZE) {
            const derivedKeys = walletUtils._calculateDerivedHDKeys(
                initialHDKey,
                derivationPath,
                BATCH_SIZE,
                index,
                hardened,
            );
            matchedKey = _.find(derivedKeys, derivedKey => derivedKey.address === address);
            if (matchedKey) {
                break;
            }
        }
        return matchedKey;
    },

    _firstDerivedKey(initialHDKey: HDNode, derivationPath: string, hardened: boolean = false): DerivedHDKey {
        const derivedKeys = walletUtils._calculateDerivedHDKeys(initialHDKey, derivationPath, 1, 0, hardened);
        const firstDerivedKey = derivedKeys[0];
        return firstDerivedKey;
    },
};
