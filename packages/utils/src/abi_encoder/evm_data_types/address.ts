import { DataItem, SolidityTypes } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { DataTypeFactory } from '../abstract_data_types/interfaces';
import { AbstractBlobDataType } from '../abstract_data_types/types/blob';
import { RawCalldata } from '../calldata/raw_calldata';
import { constants } from '../utils/constants';

export class AddressDataType extends AbstractBlobDataType {
    private static readonly _SIZE_KNOWN_AT_COMPILE_TIME: boolean = true;
    private static readonly _ADDRESS_SIZE_IN_BYTES = 20;
    private static readonly _DECODED_ADDRESS_OFFSET_IN_BYTES =
        constants.EVM_WORD_WIDTH_IN_BYTES - AddressDataType._ADDRESS_SIZE_IN_BYTES;
    private static readonly _DEFAULT_VALUE = '0x0000000000000000000000000000000000000000';

    public static matchType(type: string): boolean {
        return type === SolidityTypes.Address;
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        super(dataItem, dataTypeFactory, AddressDataType._SIZE_KNOWN_AT_COMPILE_TIME);
        if (!AddressDataType.matchType(dataItem.type)) {
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
        const encodedValueBuf = ethUtil.setLengthLeft(valueBuf, constants.EVM_WORD_WIDTH_IN_BYTES);
        return encodedValueBuf;
    }

    public decodeValue(calldata: RawCalldata): string {
        const valueBufPadded = calldata.popWord();
        const valueBuf = valueBufPadded.slice(AddressDataType._DECODED_ADDRESS_OFFSET_IN_BYTES);
        const value = ethUtil.bufferToHex(valueBuf);
        const valueLowercase = _.toLower(value);
        return valueLowercase;
    }

    public getDefaultValue(): string {
        return AddressDataType._DEFAULT_VALUE;
    }

    public getSignatureType(): string {
        return SolidityTypes.Address;
    }
    /* tslint:enable prefer-function-over-method */
}
