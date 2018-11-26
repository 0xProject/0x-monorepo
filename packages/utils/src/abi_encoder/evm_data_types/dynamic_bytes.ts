/* tslint:disable prefer-function-over-method */
import { DataItem } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { AbstractDataTypes, DataTypeFactory } from '../abstract_data_types';
import { RawCalldata } from '../calldata';
import * as Constants from '../utils/constants';

export class DynamicBytes extends AbstractDataTypes.Blob {
    private static readonly _SIZE_KNOWN_AT_COMPILE_TIME: boolean = false;

    public static matchType(type: string): boolean {
        return type === 'bytes';
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        super(dataItem, dataTypeFactory, DynamicBytes._SIZE_KNOWN_AT_COMPILE_TIME);
        if (!DynamicBytes.matchType(dataItem.type)) {
            throw new Error(`Tried to instantiate Dynamic Bytes with bad input: ${dataItem}`);
        }
    }

    public encodeValue(value: string | Buffer): Buffer {
        // Encoded value is of the form: <length><value>, with each field padded to be word-aligned.
        // 1/3 Construct the length
        const valueBuf = ethUtil.toBuffer(value);
        const wordsToStoreValuePadded = Math.ceil(valueBuf.byteLength / Constants.EVM_WORD_WIDTH_IN_BYTES);
        const bytesToStoreValuePadded = wordsToStoreValuePadded * Constants.EVM_WORD_WIDTH_IN_BYTES;
        const lengthBuf = ethUtil.toBuffer(valueBuf.byteLength);
        const lengthBufPadded = ethUtil.setLengthLeft(lengthBuf, Constants.EVM_WORD_WIDTH_IN_BYTES);
        // 2/3 Construct the value
        this._sanityCheckValue(value);
        const valueBufPadded = ethUtil.setLengthRight(valueBuf, bytesToStoreValuePadded);
        // 3/3 Combine length and value
        const encodedValue = Buffer.concat([lengthBufPadded, valueBufPadded]);
        return encodedValue;
    }

    public decodeValue(calldata: RawCalldata): string {
        // Encoded value is of the form: <length><value>, with each field padded to be word-aligned.
        // 1/2 Decode length
        const lengthBuf = calldata.popWord();
        const lengthHex = ethUtil.bufferToHex(lengthBuf);
        const length = parseInt(lengthHex, Constants.HEX_BASE);
        // 2/2 Decode value
        const wordsToStoreValuePadded = Math.ceil(length / Constants.EVM_WORD_WIDTH_IN_BYTES);
        const valueBufPadded = calldata.popWords(wordsToStoreValuePadded);
        const valueBuf = valueBufPadded.slice(0, length);
        const value = ethUtil.bufferToHex(valueBuf);
        this._sanityCheckValue(value);
        return value;
    }

    public getSignature(): string {
        return 'bytes';
    }

    private _sanityCheckValue(value: string | Buffer): void {
        if (typeof value !== 'string') {
            return;
        }
        if (!value.startsWith('0x')) {
            throw new Error(`Tried to encode non-hex value. Value must inlcude '0x' prefix.`);
        } else if (value.length % 2 !== 0) {
            throw new Error(`Tried to assign ${value}, which is contains a half-byte. Use full bytes only.`);
        }
    }
}
