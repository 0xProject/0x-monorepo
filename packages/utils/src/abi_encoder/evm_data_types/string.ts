/* tslint:disable prefer-function-over-method */
import { DataItem } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { AbstractDataTypes, DataTypeFactory } from '../abstract_data_types';
import { RawCalldata } from '../calldata';
import * as Constants from '../utils/constants';

export class String extends AbstractDataTypes.Blob {
    private static readonly _SIZE_KNOWN_AT_COMPILE_TIME: boolean = false;

    public static matchType(type: string): boolean {
        return type === 'string';
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        super(dataItem, dataTypeFactory, String._SIZE_KNOWN_AT_COMPILE_TIME);
        if (!String.matchType(dataItem.type)) {
            throw new Error(`Tried to instantiate String with bad input: ${dataItem}`);
        }
    }

    public encodeValue(value: string): Buffer {
        // Encoded value is of the form: <length><value>, with each field padded to be word-aligned.
        // 1/3 Construct the length
        const wordsToStoreValuePadded = Math.ceil(value.length / Constants.EVM_WORD_WIDTH_IN_BYTES);
        const bytesToStoreValuePadded = wordsToStoreValuePadded * Constants.EVM_WORD_WIDTH_IN_BYTES;
        const lengthBuf = ethUtil.toBuffer(value.length);
        const lengthBufPadded = ethUtil.setLengthLeft(lengthBuf, Constants.EVM_WORD_WIDTH_IN_BYTES);
        // 2/3 Construct the value
        const valueBuf = new Buffer(value);
        const valueBufPadded = ethUtil.setLengthRight(valueBuf, bytesToStoreValuePadded);
        // 3/3 Combine length and value
        const encodedValue = Buffer.concat([lengthBufPadded, valueBufPadded]);
        return encodedValue;
    }

    public decodeValue(calldata: RawCalldata): string {
        // Encoded value is of the form: <length><value>, with each field padded to be word-aligned.
        // 1/2 Decode length
        const lengthBufPadded = calldata.popWord();
        const lengthHexPadded = ethUtil.bufferToHex(lengthBufPadded);
        const length = parseInt(lengthHexPadded, Constants.HEX_BASE);
        // 2/2 Decode value
        const wordsToStoreValuePadded = Math.ceil(length / Constants.EVM_WORD_WIDTH_IN_BYTES);
        const valueBufPadded = calldata.popWords(wordsToStoreValuePadded);
        const valueBuf = valueBufPadded.slice(0, length);
        const value = valueBuf.toString('ascii');
        return value;
    }

    public getSignature(): string {
        return 'string';
    }
}
