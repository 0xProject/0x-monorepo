import { DataItem, SolidityTypes } from 'ethereum-types';
import * as _ from 'lodash';

import { BigNumber } from '../../configured_bignumber';
import { DataTypeFactory } from '../abstract_data_types/interfaces';
import { AbstractBlobDataType } from '../abstract_data_types/types/blob';
import { RawCalldata } from '../calldata/raw_calldata';
import { constants } from '../utils/constants';
import * as EncoderMath from '../utils/math';

export class UIntDataType extends AbstractBlobDataType {
    private static readonly _MATCHER = RegExp(
        '^uint(8|16|24|32|40|48|56|64|72|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256){0,1}$',
    );
    private static readonly _SIZE_KNOWN_AT_COMPILE_TIME: boolean = true;
    private static readonly _MAX_WIDTH: number = 256;
    private static readonly _DEFAULT_WIDTH: number = UIntDataType._MAX_WIDTH;
    private static readonly _MIN_VALUE = new BigNumber(0);
    private readonly _width: number;
    private readonly _maxValue: BigNumber;

    public static matchType(type: string): boolean {
        return UIntDataType._MATCHER.test(type);
    }

    private static _decodeWidthFromType(type: string): number {
        const matches = UIntDataType._MATCHER.exec(type);
        const width =
            !_.isNull(matches) && matches.length === 2 && !_.isUndefined(matches[1])
                ? parseInt(matches[1], constants.DEC_BASE)
                : UIntDataType._DEFAULT_WIDTH;
        return width;
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        super(dataItem, dataTypeFactory, UIntDataType._SIZE_KNOWN_AT_COMPILE_TIME);
        if (!UIntDataType.matchType(dataItem.type)) {
            throw new Error(`Tried to instantiate UInt with bad input: ${dataItem}`);
        }
        this._width = UIntDataType._decodeWidthFromType(dataItem.type);
        this._maxValue = new BigNumber(2).toPower(this._width).sub(1);
    }

    public encodeValue(value: BigNumber | string | number): Buffer {
        const encodedValue = EncoderMath.safeEncodeNumericValue(value, UIntDataType._MIN_VALUE, this._maxValue);
        return encodedValue;
    }

    public decodeValue(calldata: RawCalldata): BigNumber | number {
        const valueBuf = calldata.popWord();
        const value = EncoderMath.safeDecodeNumericValue(valueBuf, UIntDataType._MIN_VALUE, this._maxValue);
        const numberOfBytesInUint8 = 8;
        if (this._width === numberOfBytesInUint8) {
            return value.toNumber();
        }
        return value;
    }

    public getSignatureType(): string {
        return `${SolidityTypes.Uint}${this._width}`;
    }
}
