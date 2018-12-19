import { DataItem, SolidityTypes } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { DataTypeFactory } from '../abstract_data_types/interfaces';
import { AbstractBlobDataType } from '../abstract_data_types/types/blob';
import { RawCalldata } from '../calldata/raw_calldata';
import { constants } from '../utils/constants';

export class DynamicBytesDataType extends AbstractBlobDataType {
    private static readonly _SIZE_KNOWN_AT_COMPILE_TIME: boolean = false;

    public static matchType(type: string): boolean {
        return type === SolidityTypes.Bytes;
    }

    private static _sanityCheckValue(value: string | Buffer): void {
        if (typeof value !== 'string') {
            return;
        }
        if (!_.startsWith(value, '0x')) {
            throw new Error(`Tried to encode non-hex value. Value must inlcude '0x' prefix.`);
        } else if (value.length % 2 !== 0) {
            throw new Error(`Tried to assign ${value}, which is contains a half-byte. Use full bytes only.`);
        }
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        super(dataItem, dataTypeFactory, DynamicBytesDataType._SIZE_KNOWN_AT_COMPILE_TIME);
        if (!DynamicBytesDataType.matchType(dataItem.type)) {
            throw new Error(`Tried to instantiate Dynamic Bytes with bad input: ${dataItem}`);
        }
    }

    // Disable prefer-function-over-method for inherited abstract methods.
    /* tslint:disable prefer-function-over-method */
    public encodeValue(value: string | Buffer): Buffer {
        // Encoded value is of the form: <length><value>, with each field padded to be word-aligned.
        // 1/3 Construct the length
        const valueBuf = ethUtil.toBuffer(value);
        const wordsToStoreValuePadded = Math.ceil(valueBuf.byteLength / constants.EVM_WORD_WIDTH_IN_BYTES);
        const bytesToStoreValuePadded = wordsToStoreValuePadded * constants.EVM_WORD_WIDTH_IN_BYTES;
        const lengthBuf = ethUtil.toBuffer(valueBuf.byteLength);
        const lengthBufPadded = ethUtil.setLengthLeft(lengthBuf, constants.EVM_WORD_WIDTH_IN_BYTES);
        // 2/3 Construct the value
        DynamicBytesDataType._sanityCheckValue(value);
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
        const length = parseInt(lengthHex, constants.HEX_BASE);
        // 2/2 Decode value
        const wordsToStoreValuePadded = Math.ceil(length / constants.EVM_WORD_WIDTH_IN_BYTES);
        const valueBufPadded = calldata.popWords(wordsToStoreValuePadded);
        const valueBuf = valueBufPadded.slice(0, length);
        const value = ethUtil.bufferToHex(valueBuf);
        DynamicBytesDataType._sanityCheckValue(value);
        return value;
    }

    public getSignatureType(): string {
        return SolidityTypes.Bytes;
    }
    /* tslint:enable prefer-function-over-method */
}
