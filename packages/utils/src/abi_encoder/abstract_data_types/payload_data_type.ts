import { DataItem } from 'ethereum-types';
import * as _ from 'lodash';

import { CalldataBlock, PayloadCalldataBlock, RawCalldata } from '../calldata';
import { DecodingRules } from '../utils/rules';

import { DataType } from './data_type';
import { DataTypeFactory } from './interfaces';

export abstract class PayloadDataType extends DataType {
    protected _hasConstantSize: boolean;

    public constructor(dataItem: DataItem, factory: DataTypeFactory, hasConstantSize: boolean) {
        super(dataItem, factory);
        this._hasConstantSize = hasConstantSize;
    }

    public generateCalldataBlock(value: any, parentBlock?: CalldataBlock): PayloadCalldataBlock {
        const encodedValue = this.encodeValue(value);
        const name = this.getDataItem().name;
        const signature = this.getSignature();
        const parentName = parentBlock === undefined ? '' : parentBlock.getName();
        const block = new PayloadCalldataBlock(name, signature, parentName, encodedValue);
        return block;
    }

    public generateValue(calldata: RawCalldata, rules: DecodingRules): any {
        const value = this.decodeValue(calldata);
        return value;
    }

    public isStatic(): boolean {
        return this._hasConstantSize;
    }

    public abstract encodeValue(value: any): Buffer;
    public abstract decodeValue(calldata: RawCalldata): any;
}
