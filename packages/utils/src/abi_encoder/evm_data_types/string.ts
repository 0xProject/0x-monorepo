/* tslint:disable prefer-function-over-method */
import { DataItem } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { DataTypeFactory, PayloadDataType } from '../abstract_data_types';
import { RawCalldata } from '../calldata';
import * as Constants from '../constants';

export class String extends PayloadDataType {
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
        const wordsForValue = Math.ceil(value.length / Constants.EVM_WORD_WIDTH_IN_BYTES);
        const paddedDynamicBytesForValue = wordsForValue * Constants.EVM_WORD_WIDTH_IN_BYTES;
        const valueBuf = ethUtil.setLengthRight(new Buffer(value), paddedDynamicBytesForValue);
        const lengthBuf = ethUtil.setLengthLeft(ethUtil.toBuffer(value.length), Constants.EVM_WORD_WIDTH_IN_BYTES);
        const encodedValueBuf = Buffer.concat([lengthBuf, valueBuf]);
        return encodedValueBuf;
    }

    public decodeValue(calldata: RawCalldata): string {
        const lengthBuf = calldata.popWord();
        const lengthHex = ethUtil.bufferToHex(lengthBuf);
        const length = parseInt(lengthHex, Constants.HEX_BASE);
        const wordsForValue = Math.ceil(length / Constants.EVM_WORD_WIDTH_IN_BYTES);
        const paddedValueBuf = calldata.popWords(wordsForValue);
        const valueBuf = paddedValueBuf.slice(0, length);
        const value = valueBuf.toString('ascii');
        return value;
    }

    public getSignature(): string {
        return 'string';
    }
}
