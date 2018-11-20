import { DataItem } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { CalldataBlock, DependentCalldataBlock, RawCalldata } from '../calldata';
import * as Constants from '../constants';
import { DecodingRules } from '../utils/rules';

import { DataType } from './data_type';
import { DataTypeFactory } from './interfaces';

export abstract class DependentDataType extends DataType {
    protected _dependency: DataType;
    protected _parent: DataType;
    private readonly _isStatic: boolean;

    public constructor(dataItem: DataItem, factory: DataTypeFactory, dependency: DataType, parent: DataType) {
        super(dataItem, factory);
        this._dependency = dependency;
        this._parent = parent;
        this._isStatic = true;
    }

    public generateCalldataBlock(value: any, parentBlock?: CalldataBlock): DependentCalldataBlock {
        if (parentBlock === undefined) {
            throw new Error(`DependentDataType requires a parent block to generate its block`);
        }
        const dependencyBlock = this._dependency.generateCalldataBlock(value, parentBlock);
        const name = this.getDataItem().name;
        const signature = this.getSignature();
        const parentName = parentBlock === undefined ? '' : parentBlock.getName();
        const block = new DependentCalldataBlock(name, signature, parentName, dependencyBlock, parentBlock);
        return block;
    }

    public generateValue(calldata: RawCalldata, rules: DecodingRules): any {
        const destinationOffsetBuf = calldata.popWord();
        const currentOffset = calldata.getOffset();
        const destinationOffsetRelative = parseInt(ethUtil.bufferToHex(destinationOffsetBuf), Constants.HEX_BASE);
        const destinationOffsetAbsolute = calldata.toAbsoluteOffset(destinationOffsetRelative);
        calldata.setOffset(destinationOffsetAbsolute);
        const value = this._dependency.generateValue(calldata, rules);
        calldata.setOffset(currentOffset);
        return value;
    }

    public isStatic(): boolean {
        return this._isStatic;
    }
}
