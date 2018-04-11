import ethUtil = require('ethereumjs-util');
import HDNode = require('hdkey');
import * as _ from 'lodash';

import { DerivedHDKey, WalletSubproviderErrors } from '../types';

const DEFAULT_ADDRESS_SEARCH_OFFSET = 0;
const BATCH_SIZE = 10;

export const walletUtils = {
    DEFAULT_NUM_ADDRESSES_TO_FETCH: 10,
    DEFAULT_ADDRESS_SEARCH_LIMIT: 1000,
    calculateDerivedHDKeys(
        initialDerivedKey: DerivedHDKey,
        searchLimit: number,
        offset: number = DEFAULT_ADDRESS_SEARCH_OFFSET,
    ): DerivedHDKey[] {
        const derivedKeys: DerivedHDKey[] = [];
        _.times(searchLimit, i => {
            const derivationPath = initialDerivedKey.derivationPath;
            const derivationIndex = offset + i;
            // If the DerivedHDKey is a child then we walk relative, if not we walk the full derivation path
            const path = initialDerivedKey.isChildKey
                ? `m/${derivationIndex}`
                : `m/${derivationPath}/${derivationIndex}`;
            const hdKey = initialDerivedKey.hdKey.derive(path);
            const address = walletUtils.addressOfHDKey(hdKey);
            const derivedKey: DerivedHDKey = {
                address,
                hdKey,
                derivationPath,
                derivationIndex,
                isChildKey: initialDerivedKey.isChildKey,
            };
            derivedKeys.push(derivedKey);
        });
        return derivedKeys;
    },
    addressOfHDKey(hdKey: HDNode): string {
        const shouldSanitizePublicKey = true;
        const derivedPublicKey = hdKey.publicKey;
        const ethereumAddressUnprefixed = ethUtil
            .publicToAddress(derivedPublicKey, shouldSanitizePublicKey)
            .toString('hex');
        const address = ethUtil.addHexPrefix(ethereumAddressUnprefixed);
        return address;
    },
    findDerivedKeyByAddress(
        address: string,
        initialDerivedKey: DerivedHDKey,
        searchLimit: number,
    ): DerivedHDKey | undefined {
        let matchedKey: DerivedHDKey | undefined;
        for (let index = 0; index < searchLimit; index = index + BATCH_SIZE) {
            const derivedKeys = walletUtils.calculateDerivedHDKeys(initialDerivedKey, BATCH_SIZE, index);
            matchedKey = _.find(derivedKeys, derivedKey => derivedKey.address === address);
            if (matchedKey) {
                break;
            }
        }
        return matchedKey;
    },

    _firstDerivedKey(initialDerivedKey: DerivedHDKey): DerivedHDKey {
        const derivedKeys = walletUtils.calculateDerivedHDKeys(initialDerivedKey, 1, 0);
        const firstDerivedKey = derivedKeys[0];
        return firstDerivedKey;
    },
};
