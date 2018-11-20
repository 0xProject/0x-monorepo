/* tslint:disable prefer-function-over-method */
import { DataItem } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { RawCalldata } from '../calldata';
import * as Constants from '../constants';
import { DataTypeFactory, PayloadDataType } from '../data_type';

export class DynamicBytes extends PayloadDataType {
    private static readonly _SIZE_KNOWN_AT_COMPILE_TIME: boolean = false;

    public static matchType(type: string): boolean {
        return type === 'bytes';
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        super(dataItem, dataTypeFactory, DynamicBytes._SIZE_KNOWN_AT_COMPILE_TIME);
        if (!DynamicBytes.matchType(dataItem.type)) {
            throw new Error(`Tried to instantiate DynamicBytes with bad input: ${dataItem}`);
        }
    }

    public encodeValue(value: string | Buffer): Buffer {
        if (typeof value === 'string' && !value.startsWith('0x')) {
            throw new Error(`Tried to encode non-hex value. Value must inlcude '0x' prefix. Got '${value}'`);
        }
        const valueBuf = ethUtil.toBuffer(value);
        if (value.length % 2 !== 0) {
            throw new Error(`Tried to assign ${value}, which is contains a half-byte. Use full bytes only.`);
        }

        const wordsForValue = Math.ceil(valueBuf.byteLength / Constants.EVM_WORD_WIDTH_IN_BYTES);
        const paddedDynamicBytesForValue = wordsForValue * Constants.EVM_WORD_WIDTH_IN_BYTES;
        const paddedValueBuf = ethUtil.setLengthRight(valueBuf, paddedDynamicBytesForValue);
        const paddedLengthBuf = ethUtil.setLengthLeft(
            ethUtil.toBuffer(valueBuf.byteLength),
            Constants.EVM_WORD_WIDTH_IN_BYTES,
        );
        const encodedValueBuf = Buffer.concat([paddedLengthBuf, paddedValueBuf]);
        return encodedValueBuf;
    }

    public decodeValue(calldata: RawCalldata): string {
        const lengthBuf = calldata.popWord();
        const lengthHex = ethUtil.bufferToHex(lengthBuf);
        const length = parseInt(lengthHex, Constants.HEX_BASE);
        const wordsForValue = Math.ceil(length / Constants.EVM_WORD_WIDTH_IN_BYTES);
        const paddedValueBuf = calldata.popWords(wordsForValue);
        const valueBuf = paddedValueBuf.slice(0, length);
        const decodedValue = ethUtil.bufferToHex(valueBuf);
        return decodedValue;
    }

    public getSignature(): string {
        return 'bytes';
    }
}
