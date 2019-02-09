import { addHexPrefix, sha3, stripHexPrefix } from 'ethereumjs-util';
import * as jsSHA3 from 'js-sha3';
import * as _ from 'lodash';

import { generatePseudoRandom256BitNumber } from './random';

const BASIC_ADDRESS_REGEX = /^(0x)?[0-9a-f]{40}$/i;
const SAME_CASE_ADDRESS_REGEX = /^(0x)?([0-9a-f]{40}|[0-9A-F]{40})$/;
const ADDRESS_LENGTH = 40;

export const addressUtils = {
    isChecksumAddress(address: string): boolean {
        // Check each case
        const unprefixedAddress = address.replace('0x', '');
        const addressHash = jsSHA3.keccak256(unprefixedAddress.toLowerCase());

        for (let i = 0; i < ADDRESS_LENGTH; i++) {
            // The nth letter should be uppercase if the nth digit of casemap is 1
            const hexBase = 16;
            const lowercaseRange = 7;
            if (
                (parseInt(addressHash[i], hexBase) > lowercaseRange &&
                    unprefixedAddress[i].toUpperCase() !== unprefixedAddress[i]) ||
                (parseInt(addressHash[i], hexBase) <= lowercaseRange &&
                    unprefixedAddress[i].toLowerCase() !== unprefixedAddress[i])
            ) {
                return false;
            }
        }
        return true;
    },
    isAddress(address: string): boolean {
        if (!BASIC_ADDRESS_REGEX.test(address)) {
            // Check if it has the basic requirements of an address
            return false;
        } else if (SAME_CASE_ADDRESS_REGEX.test(address)) {
            // If it's all small caps or all all caps, return true
            return true;
        } else {
            // Otherwise check each case
            const isValidChecksummedAddress = addressUtils.isChecksumAddress(address);
            return isValidChecksummedAddress;
        }
    },
    padZeros(address: string): string {
        return addHexPrefix(_.padStart(stripHexPrefix(address), ADDRESS_LENGTH, '0'));
    },
    generatePseudoRandomAddress(): string {
        const randomBigNum = generatePseudoRandom256BitNumber();
        const randomBuff = sha3(randomBigNum.toString());
        const addressLengthInBytes = 20;
        const randomAddress = `0x${randomBuff.slice(0, addressLengthInBytes).toString('hex')}`;
        return randomAddress;
    },
};
