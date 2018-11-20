import { DataItem } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { BigNumber } from '../../configured_bignumber';
import { RawCalldata } from '../calldata';
import * as Constants from '../constants';
import { DataTypeFactory, PayloadDataType } from '../data_type';

export abstract class Number extends PayloadDataType {
    private static readonly _SIZE_KNOWN_AT_COMPILE_TIME: boolean = true;
    private static readonly _MAX_WIDTH: number = 256;
    private static readonly _DEFAULT_WIDTH: number = Number._MAX_WIDTH;
    protected _width: number;

    constructor(dataItem: DataItem, matcher: RegExp, dataTypeFactory: DataTypeFactory) {
        super(dataItem, dataTypeFactory, Number._SIZE_KNOWN_AT_COMPILE_TIME);
        const matches = matcher.exec(dataItem.type);
        if (matches === null) {
            throw new Error(`Tried to instantiate Number with bad input: ${dataItem}`);
        }
        this._width =
            matches !== null && matches.length === 2 && matches[1] !== undefined
                ? parseInt(matches[1], Constants.DEC_BASE)
                : (this._width = Number._DEFAULT_WIDTH);
    }

    public encodeValue(value_: BigNumber | string | number): Buffer {
        const value = new BigNumber(value_, 10);
        if (value.greaterThan(this.getMaxValue())) {
            throw new Error(`Tried to assign value of ${value}, which exceeds max value of ${this.getMaxValue()}`);
        } else if (value.lessThan(this.getMinValue())) {
            throw new Error(`Tried to assign value of ${value}, which exceeds min value of ${this.getMinValue()}`);
        }

        let valueBuf: Buffer;
        if (value.greaterThanOrEqualTo(0)) {
            valueBuf = ethUtil.setLengthLeft(
                ethUtil.toBuffer(`0x${value.toString(Constants.HEX_BASE)}`),
                Constants.EVM_WORD_WIDTH_IN_BYTES,
            );
        } else {
            // BigNumber can't write a negative hex value, so we use twos-complement conversion to do it ourselves.
            // Step 1/3: Convert value to positive binary string
            const binBase = 2;
            const valueBin = value.times(-1).toString(binBase);

            // Step 2/3: Invert binary value
            let invertedValueBin = '1'.repeat(Constants.EVM_WORD_WIDTH_IN_BITS - valueBin.length);
            _.each(valueBin, (bit: string) => {
                invertedValueBin += bit === '1' ? '0' : '1';
            });
            const invertedValue = new BigNumber(invertedValueBin, binBase);

            // Step 3/3: Add 1 to inverted value
            // The result is the two's-complement represent of the input value.
            const negativeValue = invertedValue.plus(1);

            // Convert the negated value to a hex string
            valueBuf = ethUtil.setLengthLeft(
                ethUtil.toBuffer(`0x${negativeValue.toString(Constants.HEX_BASE)}`),
                Constants.EVM_WORD_WIDTH_IN_BYTES,
            );
        }

        return valueBuf;
    }

    public decodeValue(calldata: RawCalldata): BigNumber {
        const paddedValueBuf = calldata.popWord();
        const paddedValueHex = ethUtil.bufferToHex(paddedValueBuf);
        let value = new BigNumber(paddedValueHex, 16);
        if (this.getMinValue().lessThan(0)) {
            // Check if we're negative
            const valueBin = value.toString(Constants.BIN_BASE);
            if (valueBin.length === Constants.EVM_WORD_WIDTH_IN_BITS && valueBin[0].startsWith('1')) {
                // Negative
                // Step 1/3: Invert binary value
                let invertedValueBin = '';
                _.each(valueBin, (bit: string) => {
                    invertedValueBin += bit === '1' ? '0' : '1';
                });
                const invertedValue = new BigNumber(invertedValueBin, Constants.BIN_BASE);

                // Step 2/3: Add 1 to inverted value
                // The result is the two's-complement represent of the input value.
                const positiveValue = invertedValue.plus(1);

                // Step 3/3: Invert positive value
                const negativeValue = positiveValue.times(-1);
                value = negativeValue;
            }
        }

        return value;
    }

    public abstract getMaxValue(): BigNumber;
    public abstract getMinValue(): BigNumber;
}
