import ethUtil = require('ethereumjs-util');
import HDNode = require('hdkey');
import * as _ from 'lodash';

import { DerivedHDKey, WalletSubproviderErrors } from '../types';

const DEFAULT_ADDRESS_SEARCH_OFFSET = 0;
const BATCH_SIZE = 10;
const DEFAULT_ADDRESS_SEARCH_LIMIT = 1000;

class DerivedHDKeyIterator implements IterableIterator<DerivedHDKey> {
    private _initialDerivedKey: DerivedHDKey;
    private _searchLimit: number;
    private _index: number;

    constructor(initialDerivedKey: DerivedHDKey, searchLimit: number = DEFAULT_ADDRESS_SEARCH_OFFSET) {
        this._searchLimit = searchLimit;
        this._initialDerivedKey = initialDerivedKey;
        this._index = 0;
    }

    public next(): IteratorResult<DerivedHDKey> {
        const derivationBasePath = this._initialDerivedKey.derivationBasePath;
        const derivationIndex = this._index;
        const isChildKey = this._initialDerivedKey.isChildKey;
        // If the DerivedHDKey is a child then we walk relative, if not we walk the full derivation path
        const fullDerivationPath = `m/${derivationBasePath}/${derivationIndex}`;
        const relativeDerivationPath = `m/${derivationIndex}`;
        const path = isChildKey ? relativeDerivationPath : fullDerivationPath;
        const hdKey = this._initialDerivedKey.hdKey.derive(path);
        const address = walletUtils.addressOfHDKey(hdKey);
        const derivedKey: DerivedHDKey = {
            address,
            hdKey,
            derivationBasePath,
            derivationIndex,
            derivationPath: fullDerivationPath,
            isChildKey,
        };
        const done = this._index === this._searchLimit;
        this._index++;
        return {
            done,
            value: derivedKey,
        };
    }

    public [Symbol.iterator](): IterableIterator<DerivedHDKey> {
        return this;
    }
}

export const walletUtils = {
    DEFAULT_ADDRESS_SEARCH_LIMIT,
    DEFAULT_NUM_ADDRESSES_TO_FETCH: 10,
    calculateDerivedHDKeys(initialDerivedKey: DerivedHDKey, numberOfKeys: number): DerivedHDKey[] {
        const derivedKeys: DerivedHDKey[] = [];
        const derivedKeyIterator = new DerivedHDKeyIterator(initialDerivedKey, numberOfKeys);
        for (const key of derivedKeyIterator) {
            derivedKeys.push(key);
        }
        return derivedKeys;
    },
    findDerivedKeyByAddress(
        address: string,
        initialDerivedKey: DerivedHDKey,
        searchLimit: number,
    ): DerivedHDKey | undefined {
        let matchedKey: DerivedHDKey | undefined;
        const derivedKeyIterator = new DerivedHDKeyIterator(initialDerivedKey, searchLimit);
        for (const key of derivedKeyIterator) {
            if (key.address === address) {
                matchedKey = key;
                break;
            }
        }
        return matchedKey;
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
};
