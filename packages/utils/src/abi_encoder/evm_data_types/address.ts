/* tslint:disable prefer-function-over-method */
import { DataItem } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { DataTypeFactory, PayloadDataType } from '../abstract_data_types';
import { RawCalldata } from '../calldata';
import * as Constants from '../utils/constants';

export class Address extends PayloadDataType {
    public static ERROR_MESSAGE_ADDRESS_MUST_START_WITH_0X = "Address must start with '0x'";
    public static ERROR_MESSAGE_ADDRESS_MUST_BE_20_BYTES = 'Address must be 20 bytes';
    private static readonly _SIZE_KNOWN_AT_COMPILE_TIME: boolean = true;
    private static readonly _ADDRESS_SIZE_IN_BYTES = 20;
    private static readonly _DECODED_ADDRESS_OFFSET_IN_BYTES = Constants.EVM_WORD_WIDTH_IN_BYTES -
    Address._ADDRESS_SIZE_IN_BYTES;

    public static matchType(type: string): boolean {
        return type === 'address';
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        super(dataItem, dataTypeFactory, Address._SIZE_KNOWN_AT_COMPILE_TIME);
        if (!Address.matchType(dataItem.type)) {
            throw new Error(`Tried to instantiate Address with bad input: ${dataItem}`);
        }
    }

    public getSignature(): string {
        return 'address';
    }

    public encodeValue(value: string): Buffer {
        if (!value.startsWith('0x')) {
            throw new Error(Address.ERROR_MESSAGE_ADDRESS_MUST_START_WITH_0X);
        }
        const valueAsBuffer = ethUtil.toBuffer(value);
        if (valueAsBuffer.byteLength !== Address._ADDRESS_SIZE_IN_BYTES) {
            throw new Error(Address.ERROR_MESSAGE_ADDRESS_MUST_BE_20_BYTES);
        }
        const encodedValueBuf = ethUtil.setLengthLeft(valueAsBuffer, Constants.EVM_WORD_WIDTH_IN_BYTES);
        return encodedValueBuf;
    }

    public decodeValue(calldata: RawCalldata): string {
        const paddedValueBuf = calldata.popWord();
        const valueBuf = paddedValueBuf.slice(Address._DECODED_ADDRESS_OFFSET_IN_BYTES);
        const value = ethUtil.bufferToHex(valueBuf);
        return value;
    }
}
