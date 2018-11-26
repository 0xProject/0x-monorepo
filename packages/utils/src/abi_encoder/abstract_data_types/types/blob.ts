import { DataItem } from 'ethereum-types';
import * as _ from 'lodash';

import { CalldataBlock, CalldataBlocks, RawCalldata } from '../../calldata';
import { DecodingRules } from '../../utils/rules';

import { DataType } from '../data_type';
import { DataTypeFactory } from '../interfaces';

export abstract class Blob extends DataType {
    protected _sizeKnownAtCompileTime: boolean;

    public constructor(dataItem: DataItem, factory: DataTypeFactory, sizeKnownAtCompileTime: boolean) {
        super(dataItem, factory);
        this._sizeKnownAtCompileTime = sizeKnownAtCompileTime;
    }

    public generateCalldataBlock(value: any, parentBlock?: CalldataBlock): CalldataBlocks.Blob {
        const encodedValue = this.encodeValue(value);
        const name = this.getDataItem().name;
        const signature = this.getSignature();
        const parentName = parentBlock ? parentBlock.getName() : '';
        const block = new CalldataBlocks.Blob(name, signature, parentName, encodedValue);
        return block;
    }

    public generateValue(calldata: RawCalldata, rules: DecodingRules): any {
        const value = this.decodeValue(calldata);
        return value;
    }

    public isStatic(): boolean {
        return this._sizeKnownAtCompileTime;
    }

    public abstract encodeValue(value: any): Buffer;
    public abstract decodeValue(calldata: RawCalldata): any;
}
