import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { BigNumber } from '../../configured_bignumber';
import { constants } from '../utils/constants';

function sanityCheckBigNumberRange(
    value_: BigNumber | string | number,
    minValue: BigNumber,
    maxValue: BigNumber,
): void {
    const value = new BigNumber(value_, 10);
    if (value.isGreaterThan(maxValue)) {
        throw new Error(`Tried to assign value of ${value}, which exceeds max value of ${maxValue}`);
    } else if (value.isLessThan(minValue)) {
        throw new Error(`Tried to assign value of ${value}, which exceeds min value of ${minValue}`);
    } else if (value.isNaN()) {
        throw new Error(`Tried to assign NaN value`);
    }
}
function bigNumberToPaddedBuffer(value: BigNumber): Buffer {
    const valueHex = `0x${value.toString(constants.HEX_BASE)}`;
    const valueBuf = ethUtil.toBuffer(valueHex);
    const valueBufPadded = ethUtil.setLengthLeft(valueBuf, constants.EVM_WORD_WIDTH_IN_BYTES);
    return valueBufPadded;
}
/**
 * Takes a numeric value and returns its ABI-encoded value
 * @param value_    The value to encode.
 * @return ABI Encoded value
 */
export function encodeNumericValue(value_: BigNumber | string | number): Buffer {
    const value = new BigNumber(value_, 10);
    // Case 1/2: value is non-negative
    if (value.isGreaterThanOrEqualTo(0)) {
        const encodedPositiveValue = bigNumberToPaddedBuffer(value);
        return encodedPositiveValue;
    }
    // Case 2/2: Value is negative
    // Use two's-complement to encode the value
    // Step 1/3: Convert negative value to positive binary string
    const valueBin = value.times(-1).toString(constants.BIN_BASE);
    // Step 2/3: Invert binary value
    let invertedValueBin = '1'.repeat(constants.EVM_WORD_WIDTH_IN_BITS - valueBin.length);
    _.each(valueBin, (bit: string) => {
        invertedValueBin += bit === '1' ? '0' : '1';
    });
    const invertedValue = new BigNumber(invertedValueBin, constants.BIN_BASE);
    // Step 3/3: Add 1 to inverted value
    const negativeValue = invertedValue.plus(1);
    const encodedValue = bigNumberToPaddedBuffer(negativeValue);
    return encodedValue;
}
/**
 * Takes a numeric value and returns its ABI-encoded value.
 * Performs an additional sanity check, given the min/max allowed value.
 * @param value_    The value to encode.
 * @return ABI Encoded value
 */
export function safeEncodeNumericValue(
    value: BigNumber | string | number,
    minValue: BigNumber,
    maxValue: BigNumber,
): Buffer {
    sanityCheckBigNumberRange(value, minValue, maxValue);
    const encodedValue = encodeNumericValue(value);
    return encodedValue;
}
/**
 * Takes an ABI-encoded numeric value and returns its decoded value as a BigNumber.
 * @param encodedValue    The encoded numeric value.
 * @param minValue        The minimum possible decoded value.
 * @return ABI Decoded value
 */
export function decodeNumericValue(encodedValue: Buffer, minValue: BigNumber): BigNumber {
    const valueHex = ethUtil.bufferToHex(encodedValue);
    // Case 1/3: value is definitely non-negative because of numeric boundaries
    const value = new BigNumber(valueHex, constants.HEX_BASE);
    if (!minValue.isLessThan(0)) {
        return value;
    }
    // Case 2/3: value is non-negative because there is no leading 1 (encoded as two's-complement)
    const valueBin = value.toString(constants.BIN_BASE);
    const isValueNegative = valueBin.length === constants.EVM_WORD_WIDTH_IN_BITS && _.startsWith(valueBin[0], '1');
    if (!isValueNegative) {
        return value;
    }
    // Case 3/3: value is negative
    // Step 1/3: Invert b inary value
    let invertedValueBin = '';
    _.each(valueBin, (bit: string) => {
        invertedValueBin += bit === '1' ? '0' : '1';
    });
    const invertedValue = new BigNumber(invertedValueBin, constants.BIN_BASE);
    // Step 2/3: Add 1 to inverted value
    // The result is the two's-complement representation of the input value.
    const positiveValue = invertedValue.plus(1);
    // Step 3/3: Invert positive value to get the negative value
    const negativeValue = positiveValue.times(-1);
    return negativeValue;
}
/**
 * Takes an ABI-encoded numeric value and returns its decoded value as a BigNumber.
 * Performs an additional sanity check, given the min/max allowed value.
 * @param encodedValue    The encoded numeric value.
 * @param minValue        The minimum possible decoded value.
 * @return ABI Decoded value
 */
export function safeDecodeNumericValue(encodedValue: Buffer, minValue: BigNumber, maxValue: BigNumber): BigNumber {
    const value = decodeNumericValue(encodedValue, minValue);
    sanityCheckBigNumberRange(value, minValue, maxValue);
    return value;
}
