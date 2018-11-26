import { DataItem } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { AbstractDataTypes, DataTypeFactory } from '../abstract_data_types';
import { RawCalldata } from '../calldata';
import * as Constants from '../utils/constants';

export class StaticBytes extends AbstractDataTypes.Blob {
    private static readonly _SIZE_KNOWN_AT_COMPILE_TIME: boolean = true;
    private static readonly _MATCHER = RegExp(
        '^(byte|bytes(1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31|32))$',
    );
    private static readonly _DEFAULT_WIDTH = 1;
    private readonly _width: number;

    public static matchType(type: string): boolean {
        return StaticBytes._MATCHER.test(type);
    }

    private static _decodeWidthFromType(type: string): number {
        const matches = StaticBytes._MATCHER.exec(type);
        const width =
            matches !== null && matches.length === 3 && matches[2] !== undefined
                ? parseInt(matches[2], Constants.DEC_BASE)
                : StaticBytes._DEFAULT_WIDTH;
        return width;
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        super(dataItem, dataTypeFactory, StaticBytes._SIZE_KNOWN_AT_COMPILE_TIME);
        if (!StaticBytes.matchType(dataItem.type)) {
            throw new Error(`Tried to instantiate Static Bytes with bad input: ${dataItem}`);
        }
        this._width = StaticBytes._decodeWidthFromType(dataItem.type);
    }

    public getSignature(): string {
        // Note that `byte` reduces to `bytes1`
        return `bytes${this._width}`;
    }

    public encodeValue(value: string | Buffer): Buffer {
        // 1/2 Convert value into a buffer and do bounds checking
        this._sanityCheckValue(value);
        const valueBuf = ethUtil.toBuffer(value);
        // 2/2 Store value as hex
        const valuePadded = ethUtil.setLengthRight(valueBuf, Constants.EVM_WORD_WIDTH_IN_BYTES);
        return valuePadded;
    }

    public decodeValue(calldata: RawCalldata): string {
        const valueBufPadded = calldata.popWord();
        const valueBuf = valueBufPadded.slice(0, this._width);
        const value = ethUtil.bufferToHex(valueBuf);
        this._sanityCheckValue(value);
        return value;
    }

    private _sanityCheckValue(value: string | Buffer): void {
        if (typeof value === 'string') {
            if (!value.startsWith('0x')) {
                throw new Error(`Tried to encode non-hex value. Value must inlcude '0x' prefix.`);
            } else if (value.length % 2 !== 0) {
                throw new Error(`Tried to assign ${value}, which is contains a half-byte. Use full bytes only.`);
            }
        }
        const valueBuf = ethUtil.toBuffer(value);
        if (valueBuf.byteLength > this._width) {
            throw new Error(
                `Tried to assign ${value} (${
                    valueBuf.byteLength
                } bytes), which exceeds max bytes that can be stored in a ${this.getSignature()}`,
            );
        }
    }
}
