import { DataItem } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { RawCalldata } from '../calldata';
import * as Constants from '../constants';
import { DataTypeFactory, PayloadDataType } from '../data_type';

export class StaticBytes extends PayloadDataType {
    private static readonly _SIZE_KNOWN_AT_COMPILE_TIME: boolean = true;
    private static readonly _matcher = RegExp(
        '^(byte|bytes(1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31|32))$',
    );

    private static readonly _DEFAULT_WIDTH = 1;
    private readonly _width: number;

    public static matchType(type: string): boolean {
        return StaticBytes._matcher.test(type);
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        super(dataItem, dataTypeFactory, StaticBytes._SIZE_KNOWN_AT_COMPILE_TIME);
        const matches = StaticBytes._matcher.exec(dataItem.type);
        if (!StaticBytes.matchType(dataItem.type)) {
            throw new Error(`Tried to instantiate Byte with bad input: ${dataItem}`);
        }
        this._width =
            matches !== null && matches.length === 3 && matches[2] !== undefined
                ? parseInt(matches[2], Constants.DEC_BASE)
                : StaticBytes._DEFAULT_WIDTH;
    }

    public getSignature(): string {
        // Note that `byte` reduces to `bytes1`
        return `bytes${this._width}`;
    }

    public encodeValue(value: string | Buffer): Buffer {
        // Sanity check if string
        if (typeof value === 'string' && !value.startsWith('0x')) {
            throw new Error(`Tried to encode non-hex value. Value must inlcude '0x' prefix.`);
        }
        // Convert value into a buffer and do bounds checking
        const valueBuf = ethUtil.toBuffer(value);
        if (valueBuf.byteLength > this._width) {
            throw new Error(
                `Tried to assign ${value} (${
                    valueBuf.byteLength
                } bytes), which exceeds max bytes that can be stored in a ${this.getSignature()}`,
            );
        } else if (value.length % 2 !== 0) {
            throw new Error(`Tried to assign ${value}, which is contains a half-byte. Use full bytes only.`);
        }

        // Store value as hex
        const evmWordWidth = 32;
        const paddedValue = ethUtil.setLengthRight(valueBuf, evmWordWidth);
        return paddedValue;
    }

    public decodeValue(calldata: RawCalldata): string {
        const paddedValueBuf = calldata.popWord();
        const valueBuf = paddedValueBuf.slice(0, this._width);
        const value = ethUtil.bufferToHex(valueBuf);
        return value;
    }
}
