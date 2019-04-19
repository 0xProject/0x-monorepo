import { DataItem } from 'ethereum-types';
import * as _ from 'lodash';

import { BlobCalldataBlock } from '../../calldata/blocks/blob';
import { CalldataBlock } from '../../calldata/calldata_block';
import { RawCalldata } from '../../calldata/raw_calldata';
import { DecodingRules } from '../../utils/rules';

import { DataType } from '../data_type';
import { DataTypeFactory } from '../interfaces';

export abstract class AbstractBlobDataType extends DataType {
    protected _sizeKnownAtCompileTime: boolean;

    public constructor(dataItem: DataItem, factory: DataTypeFactory, sizeKnownAtCompileTime: boolean) {
        super(dataItem, factory);
        this._sizeKnownAtCompileTime = sizeKnownAtCompileTime;
    }

    public generateCalldataBlock(value: any, parentBlock?: CalldataBlock): BlobCalldataBlock {
        const encodedValue = this.encodeValue(value);
        const name = this.getDataItem().name;
        const signature = this.getSignature();
        const parentName = parentBlock === undefined ? '' : parentBlock.getName();
        const block = new BlobCalldataBlock(name, signature, parentName, encodedValue);
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
