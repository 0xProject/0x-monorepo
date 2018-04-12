import ethUtil = require('ethereumjs-util');
import HDNode = require('hdkey');
import * as _ from 'lodash';

import { DerivedHDKeyInfo, WalletSubproviderErrors } from '../types';

const DEFAULT_ADDRESS_SEARCH_LIMIT = 1000;

class DerivedHDKeyInfoIterator implements IterableIterator<DerivedHDKeyInfo> {
    private _initialDerivedKey: DerivedHDKeyInfo;
    private _searchLimit: number;
    private _index: number;

    constructor(initialDerivedKey: DerivedHDKeyInfo, searchLimit: number = DEFAULT_ADDRESS_SEARCH_LIMIT) {
        this._searchLimit = searchLimit;
        this._initialDerivedKey = initialDerivedKey;
        this._index = 0;
    }

    public next(): IteratorResult<DerivedHDKeyInfo> {
        const baseDerivationPath = this._initialDerivedKey.baseDerivationPath;
        const derivationIndex = this._index;
        const fullDerivationPath = `m/${baseDerivationPath}/${derivationIndex}`;
        const path = `m/${derivationIndex}`;
        const hdKey = this._initialDerivedKey.hdKey.derive(path);
        const address = walletUtils.addressOfHDKey(hdKey);
        const derivedKey: DerivedHDKeyInfo = {
            address,
            hdKey,
            baseDerivationPath,
            derivationPath: fullDerivationPath,
        };
        const done = this._index === this._searchLimit;
        this._index++;
        return {
            done,
            value: derivedKey,
        };
    }

    public [Symbol.iterator](): IterableIterator<DerivedHDKeyInfo> {
        return this;
    }
}

export const walletUtils = {
    calculateDerivedHDKeyInfos(initialDerivedKey: DerivedHDKeyInfo, numberOfKeys: number): DerivedHDKeyInfo[] {
        const derivedKeys: DerivedHDKeyInfo[] = [];
        const derivedKeyIterator = new DerivedHDKeyInfoIterator(initialDerivedKey, numberOfKeys);
        for (const key of derivedKeyIterator) {
            derivedKeys.push(key);
        }
        return derivedKeys;
    },
    findDerivedKeyInfoForAddressIfExists(
        address: string,
        initialDerivedKey: DerivedHDKeyInfo,
        searchLimit: number,
    ): DerivedHDKeyInfo | undefined {
        let matchedKey: DerivedHDKeyInfo | undefined;
        const derivedKeyIterator = new DerivedHDKeyInfoIterator(initialDerivedKey, searchLimit);
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
        const address = ethUtil.addHexPrefix(ethereumAddressUnprefixed).toLowerCase();
        return address;
    },
};
