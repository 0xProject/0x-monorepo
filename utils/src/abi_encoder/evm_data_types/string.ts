import { DataItem, SolidityTypes } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { DataTypeFactory } from '../abstract_data_types/interfaces';
import { AbstractBlobDataType } from '../abstract_data_types/types/blob';
import { RawCalldata } from '../calldata/raw_calldata';
import { constants } from '../utils/constants';

export class StringDataType extends AbstractBlobDataType {
    private static readonly _SIZE_KNOWN_AT_COMPILE_TIME: boolean = false;
    private static readonly _DEFAULT_VALUE = '';

    public static matchType(type: string): boolean {
        return type === SolidityTypes.String;
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        super(dataItem, dataTypeFactory, StringDataType._SIZE_KNOWN_AT_COMPILE_TIME);
        if (!StringDataType.matchType(dataItem.type)) {
            throw new Error(`Tried to instantiate String with bad input: ${dataItem}`);
        }
    }

    // Disable prefer-function-over-method for inherited abstract methods.
    /* tslint:disable prefer-function-over-method */
    public encodeValue(value: string): Buffer {
        // Encoded value is of the form: <length><value>, with each field padded to be word-aligned.
        // 1/3 Construct the value
        const valueBuf = Buffer.from(value);
        const valueLengthInBytes = valueBuf.byteLength;
        const wordsToStoreValuePadded = Math.ceil(valueLengthInBytes / constants.EVM_WORD_WIDTH_IN_BYTES);
        const bytesToStoreValuePadded = wordsToStoreValuePadded * constants.EVM_WORD_WIDTH_IN_BYTES;
        const valueBufPadded = ethUtil.setLengthRight(valueBuf, bytesToStoreValuePadded);
        // 2/3 Construct the length
        const lengthBuf = ethUtil.toBuffer(valueLengthInBytes);
        const lengthBufPadded = ethUtil.setLengthLeft(lengthBuf, constants.EVM_WORD_WIDTH_IN_BYTES);
        // 3/3 Combine length and value
        const encodedValue = Buffer.concat([lengthBufPadded, valueBufPadded]);
        return encodedValue;
    }

    public decodeValue(calldata: RawCalldata): string {
        // Encoded value is of the form: <length><value>, with each field padded to be word-aligned.
        // 1/2 Decode length
        const lengthBufPadded = calldata.popWord();
        const lengthHexPadded = ethUtil.bufferToHex(lengthBufPadded);
        const length = parseInt(lengthHexPadded, constants.HEX_BASE);
        // 2/2 Decode value
        const wordsToStoreValuePadded = Math.ceil(length / constants.EVM_WORD_WIDTH_IN_BYTES);
        const valueBufPadded = calldata.popWords(wordsToStoreValuePadded);
        const valueBuf = valueBufPadded.slice(0, length);
        const value = valueBuf.toString('UTF-8');
        return value;
    }

    public getDefaultValue(): string {
        return StringDataType._DEFAULT_VALUE;
    }

    public getSignatureType(): string {
        return SolidityTypes.String;
    }
    /* tslint:enable prefer-function-over-method */
}
