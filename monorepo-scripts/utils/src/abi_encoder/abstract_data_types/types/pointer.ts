import { DataItem } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { PointerCalldataBlock } from '../../calldata/blocks/pointer';
import { CalldataBlock } from '../../calldata/calldata_block';
import { RawCalldata } from '../../calldata/raw_calldata';
import { constants } from '../../utils/constants';
import { DecodingRules } from '../../utils/rules';

import { DataType } from '../data_type';
import { DataTypeFactory } from '../interfaces';

export abstract class AbstractPointerDataType extends DataType {
    protected _destination: DataType;
    protected _parent: DataType;

    public constructor(dataItem: DataItem, factory: DataTypeFactory, destination: DataType, parent: DataType) {
        super(dataItem, factory);
        this._destination = destination;
        this._parent = parent;
    }

    public generateCalldataBlock(value: any, parentBlock?: CalldataBlock): PointerCalldataBlock {
        if (parentBlock === undefined) {
            throw new Error(`DependentDataType requires a parent block to generate its block`);
        }
        const destinationBlock = this._destination.generateCalldataBlock(value, parentBlock);
        const name = this.getDataItem().name;
        const signature = this.getSignature();
        const parentName = parentBlock.getName();
        const block = new PointerCalldataBlock(name, signature, parentName, destinationBlock, parentBlock);
        return block;
    }

    public generateValue(calldata: RawCalldata, rules: DecodingRules): any {
        const destinationOffsetBuf = calldata.popWord();
        const destinationOffsetHex = ethUtil.bufferToHex(destinationOffsetBuf);
        const destinationOffsetRelative = parseInt(destinationOffsetHex, constants.HEX_BASE);
        const destinationOffsetAbsolute = calldata.toAbsoluteOffset(destinationOffsetRelative);
        const currentOffset = calldata.getOffset();
        calldata.setOffset(destinationOffsetAbsolute);
        const value = this._destination.generateValue(calldata, rules);
        calldata.setOffset(currentOffset);
        return value;
    }

    // Disable prefer-function-over-method for inherited abstract method.
    /* tslint:disable prefer-function-over-method */
    public isStatic(): boolean {
        return true;
    }
    /* tslint:enable prefer-function-over-method */
}
