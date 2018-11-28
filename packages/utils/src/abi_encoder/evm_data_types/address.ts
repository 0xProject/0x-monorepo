import { DataItem, SolidityTypes } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { AbstractDataTypes, DataTypeFactory } from '../abstract_data_types';
import { RawCalldata } from '../calldata';
import * as Constants from '../utils/constants';

export class Address extends AbstractDataTypes.Blob {
    private static readonly _SIZE_KNOWN_AT_COMPILE_TIME: boolean = true;
    private static readonly _ADDRESS_SIZE_IN_BYTES = 20;
    private static readonly _DECODED_ADDRESS_OFFSET_IN_BYTES = Constants.EVM_WORD_WIDTH_IN_BYTES -
    Address._ADDRESS_SIZE_IN_BYTES;

    public static matchType(type: string): boolean {
        return type === SolidityTypes.Address;
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        super(dataItem, dataTypeFactory, Address._SIZE_KNOWN_AT_COMPILE_TIME);
        if (!Address.matchType(dataItem.type)) {
            throw new Error(`Tried to instantiate Address with bad input: ${dataItem}`);
        }
    }

    // Disable prefer-function-over-method for inherited abstract methods.
    /* tslint:disable prefer-function-over-method */
    public encodeValue(value: string): Buffer {
        if (!ethUtil.isValidAddress(value)) {
            throw new Error(`Invalid address: '${value}'`);
        }
        const valueBuf = ethUtil.toBuffer(value);
        const encodedValueBuf = ethUtil.setLengthLeft(valueBuf, Constants.EVM_WORD_WIDTH_IN_BYTES);
        return encodedValueBuf;
    }

    public decodeValue(calldata: RawCalldata): string {
        const valueBufPadded = calldata.popWord();
        const valueBuf = valueBufPadded.slice(Address._DECODED_ADDRESS_OFFSET_IN_BYTES);
        const value = ethUtil.bufferToHex(valueBuf);
        return value;
    }

    public getSignature(): string {
        return SolidityTypes.Address;
    }
    /* tslint:enable prefer-function-over-method */
}
