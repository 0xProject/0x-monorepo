/* tslint:disable prefer-function-over-method */
import { DataItem } from 'ethereum-types';

import { BigNumber } from '../../configured_bignumber';
import { AbstractDataTypes, DataTypeFactory } from '../abstract_data_types';
import { RawCalldata } from '../calldata';
import * as Constants from '../utils/constants';
import * as EncoderMath from '../utils/math';

export class Int extends AbstractDataTypes.Blob {
    private static readonly _MATCHER = RegExp(
        '^int(8|16|24|32|40|48|56|64|72|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256){0,1}$',
    );
    private static readonly _SIZE_KNOWN_AT_COMPILE_TIME: boolean = true;
    private static readonly _MAX_WIDTH: number = 256;
    private static readonly _DEFAULT_WIDTH: number = Int._MAX_WIDTH;
    private readonly _width: number;
    private readonly _minValue: BigNumber;
    private readonly _maxValue: BigNumber;

    public static matchType(type: string): boolean {
        return Int._MATCHER.test(type);
    }

    private static _decodeWidthFromType(type: string): number {
        const matches = Int._MATCHER.exec(type);
        const width = (matches !== null && matches.length === 2 && matches[1] !== undefined)
        ? parseInt(matches[1], Constants.DEC_BASE)
        : Int._DEFAULT_WIDTH;
        return width;
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        super(dataItem, dataTypeFactory, Int._SIZE_KNOWN_AT_COMPILE_TIME);
        if (!Int.matchType(dataItem.type)) {
            throw new Error(`Tried to instantiate Int with bad input: ${dataItem}`);
        }
        this._width = Int._decodeWidthFromType(dataItem.type);
        this._minValue = new BigNumber(2).toPower(this._width - 1).times(-1);
        this._maxValue = new BigNumber(2).toPower(this._width - 1).sub(1);
    }

    public encodeValue(value: BigNumber | string | number): Buffer {
        const encodedValue = EncoderMath.safeEncodeNumericValue(value, this._minValue, this._maxValue);
        return encodedValue;
    }

    public decodeValue(calldata: RawCalldata): BigNumber {
        const valueBuf = calldata.popWord();
        const value = EncoderMath.safeDecodeNumericValue(valueBuf, this._minValue, this._maxValue);
        return value;
    }

    public getSignature(): string {
        return `int${this._width}`;
    }
}
