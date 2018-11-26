import { DataItem } from 'ethereum-types';
import * as _ from 'lodash';

import { BigNumber } from '../../configured_bignumber';
import { DataTypeFactory, PayloadDataType } from '../abstract_data_types';
import { RawCalldata } from '../calldata';
import * as Constants from '../utils/constants';
import * as EncoderMath from '../utils/math';

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

    public encodeValue(value: BigNumber | string | number): Buffer {
        const encodedValue = EncoderMath.safeEncodeNumericValue(value, this.getMinValue(), this.getMaxValue());
        return encodedValue;
    }

    public decodeValue(calldata: RawCalldata): BigNumber {
        const valueBuf = calldata.popWord();
        const value = EncoderMath.safeDecodeNumericValue(valueBuf, this.getMinValue(), this.getMaxValue());
        return value;
    }

    public abstract getMaxValue(): BigNumber;
    public abstract getMinValue(): BigNumber;
}
