import { DataItem, SolidityTypes } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { BigNumber } from '../../configured_bignumber';
import { DataTypeFactory } from '../abstract_data_types/interfaces';
import { AbstractBlobDataType } from '../abstract_data_types/types/blob';
import { RawCalldata } from '../calldata/raw_calldata';
import { constants } from '../utils/constants';

export class BoolDataType extends AbstractBlobDataType {
    private static readonly _SIZE_KNOWN_AT_COMPILE_TIME: boolean = true;
    private static readonly _DEFAULT_VALUE: boolean = false;

    public static matchType(type: string): boolean {
        return type === SolidityTypes.Bool;
    }

    public constructor(dataItem: DataItem, dataTypeFactory: DataTypeFactory) {
        super(dataItem, dataTypeFactory, BoolDataType._SIZE_KNOWN_AT_COMPILE_TIME);
        if (!BoolDataType.matchType(dataItem.type)) {
            throw new Error(`Tried to instantiate Bool with bad input: ${dataItem}`);
        }
    }

    // Disable prefer-function-over-method for inherited abstract methods.
    /* tslint:disable prefer-function-over-method */
    public encodeValue(value: boolean): Buffer {
        const encodedValue = value ? '0x1' : '0x0';
        const encodedValueBuf = ethUtil.setLengthLeft(
            ethUtil.toBuffer(encodedValue),
            constants.EVM_WORD_WIDTH_IN_BYTES,
        );
        return encodedValueBuf;
    }

    public decodeValue(calldata: RawCalldata): boolean {
        const valueBuf = calldata.popWord();
        const valueHex = ethUtil.bufferToHex(valueBuf);
        // Hack @hysz: there are some cases where `false` is encoded as 0x instead of 0x0.
        const valueNumber = valueHex === '0x' ? new BigNumber(0) : new BigNumber(valueHex, constants.HEX_BASE);
        if (!(valueNumber.isEqualTo(0) || valueNumber.isEqualTo(1))) {
            throw new Error(`Failed to decode boolean. Expected 0x0 or 0x1, got ${valueHex}`);
        }
        /* tslint:disable boolean-naming */
        const value: boolean = !valueNumber.isEqualTo(0);
        /* tslint:enable boolean-naming */
        return value;
    }

    public getDefaultValue(): boolean {
        return BoolDataType._DEFAULT_VALUE;
    }

    public getSignatureType(): string {
        return SolidityTypes.Bool;
    }
    /* tslint:enable prefer-function-over-method */
}
