/* tslint:disable prefer-function-over-method */
import { DataItem } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { BigNumber } from '../../configured_bignumber';
import { AbstractDataTypes, DataTypeFactory } from '../abstract_data_types';
import { RawCalldata } from '../calldata';
import * as Constants from '../utils/constants';

export class Bool extends AbstractDataTypes.Blob {
    private static readonly _SIZE_KNOWN_AT_COMPILE_TIME: boolean = true;

    public static matchType(type: string): boolean {
        return type === 'bool';
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        super(dataItem, dataTypeFactory, Bool._SIZE_KNOWN_AT_COMPILE_TIME);
        if (!Bool.matchType(dataItem.type)) {
            throw new Error(`Tried to instantiate Bool with bad input: ${dataItem}`);
        }
    }

    public encodeValue(value: boolean): Buffer {
        const encodedValue = value ? '0x1' : '0x0';
        const encodedValueBuf = ethUtil.setLengthLeft(
            ethUtil.toBuffer(encodedValue),
            Constants.EVM_WORD_WIDTH_IN_BYTES,
        );
        return encodedValueBuf;
    }

    public decodeValue(calldata: RawCalldata): boolean {
        const valueBuf = calldata.popWord();
        const valueHex = ethUtil.bufferToHex(valueBuf);
        const valueNumber = new BigNumber(valueHex, Constants.HEX_BASE);
        if (!(valueNumber.equals(0) || valueNumber.equals(1))) {
            throw new Error(`Failed to decode boolean. Expected 0x0 or 0x1, got ${valueHex}`);
        }
        /* tslint:disable boolean-naming */
        const value: boolean = !valueNumber.equals(0);
        /* tslint:enable boolean-naming */
        return value;
    }

    public getSignature(): string {
        return 'bool';
    }
}
