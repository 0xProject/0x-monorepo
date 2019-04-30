import { ObjectMap } from '@0x/types';
import { DataItem } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { BigNumber } from '../../../configured_bignumber';
import { SetCalldataBlock } from '../../calldata/blocks/set';
import { CalldataBlock } from '../../calldata/calldata_block';
import { RawCalldata } from '../../calldata/raw_calldata';
import { constants } from '../../utils/constants';
import { DecodingRules } from '../../utils/rules';

import { DataType } from '../data_type';
import { DataTypeFactory, MemberIndexByName } from '../interfaces';

import { AbstractPointerDataType } from './pointer';

export abstract class AbstractSetDataType extends DataType {
    protected readonly _arrayLength: number | undefined;
    protected readonly _arrayElementType: string | undefined;
    private readonly _memberIndexByName: MemberIndexByName;
    private readonly _members: DataType[];
    private readonly _isArray: boolean;

    public constructor(
        dataItem: DataItem,
        factory: DataTypeFactory,
        isArray: boolean = false,
        arrayLength?: number,
        arrayElementType?: string,
    ) {
        super(dataItem, factory);
        this._memberIndexByName = {};
        this._members = [];
        this._isArray = isArray;
        this._arrayLength = arrayLength;
        this._arrayElementType = arrayElementType;
        if (isArray && arrayLength !== undefined) {
            [this._members, this._memberIndexByName] = this._createMembersWithLength(dataItem, arrayLength);
        } else if (!isArray) {
            [this._members, this._memberIndexByName] = this._createMembersWithKeys(dataItem);
        }
    }

    public generateCalldataBlock(value: any[] | object, parentBlock?: CalldataBlock): SetCalldataBlock {
        const block =
            value instanceof Array
                ? this._generateCalldataBlockFromArray(value, parentBlock)
                : this._generateCalldataBlockFromObject(value, parentBlock);
        return block;
    }

    public generateValue(calldata: RawCalldata, rules: DecodingRules): any[] | object {
        let members = this._members;
        // Case 1: This is an array of undefined length, which means that `this._members` was not
        //         populated in the constructor. So we must construct the set of members now.
        if (this._isArray && this._arrayLength === undefined) {
            const arrayLengthBuf = calldata.popWord();
            const arrayLengthHex = ethUtil.bufferToHex(arrayLengthBuf);
            const arrayLength = new BigNumber(arrayLengthHex, constants.HEX_BASE);
            [members] = this._createMembersWithLength(this.getDataItem(), arrayLength.toNumber());
        }
        // Create a new scope in the calldata, before descending into the members of this set.
        calldata.startScope();
        let value: any[] | object;
        if (rules.shouldConvertStructsToObjects && !this._isArray) {
            // Construct an object with values for each member of the set.
            value = {};
            _.each(this._memberIndexByName, (idx: number, key: string) => {
                const member = this._members[idx];
                const memberValue = member.generateValue(calldata, rules);
                (value as { [key: string]: any })[key] = memberValue;
            });
        } else {
            // Construct an array with values for each member of the set.
            value = [];
            _.each(members, (member: DataType, idx: number) => {
                const memberValue = member.generateValue(calldata, rules);
                (value as any[]).push(memberValue);
            });
        }
        // Close this scope and return tetheh value.
        calldata.endScope();
        return value;
    }

    public isStatic(): boolean {
        // An array with an undefined length is never static.
        if (this._isArray && this._arrayLength === undefined) {
            return false;
        }
        // If any member of the set is a pointer then the set is not static.
        const dependentMember = _.find(this._members, (member: DataType) => {
            return member instanceof AbstractPointerDataType;
        });
        const isStatic = dependentMember === undefined;
        return isStatic;
    }

    public getDefaultValue(rules?: DecodingRules): any[] | object {
        let defaultValue: any[] | object;
        if (this._isArray && this._arrayLength === undefined) {
            defaultValue = [];
        } else if (rules !== undefined && rules.shouldConvertStructsToObjects && !this._isArray) {
            defaultValue = {};
            _.each(this._memberIndexByName, (idx: number, key: string) => {
                const member = this._members[idx];
                const memberValue = member.getDefaultValue();
                (defaultValue as { [key: string]: any })[key] = memberValue;
            });
        } else {
            defaultValue = [];
            _.each(this._members, (member: DataType, idx: number) => {
                const memberValue = member.getDefaultValue();
                (defaultValue as any[]).push(memberValue);
            });
        }
        return defaultValue;
    }

    protected _generateCalldataBlockFromArray(value: any[], parentBlock?: CalldataBlock): SetCalldataBlock {
        // Sanity check: if the set has a defined length then `value` must have the same length.
        if (this._arrayLength !== undefined && value.length !== this._arrayLength) {
            throw new Error(
                `Expected array of ${JSON.stringify(
                    this._arrayLength,
                )} elements, but got array of length ${JSON.stringify(value.length)}`,
            );
        }
        // Create a new calldata block for this set.
        const parentName = parentBlock === undefined ? '' : parentBlock.getName();
        const block = new SetCalldataBlock(this.getDataItem().name, this.getSignature(), parentName);
        // If this set has an undefined length then set its header to be the number of elements.
        let members = this._members;
        if (this._isArray && this._arrayLength === undefined) {
            [members] = this._createMembersWithLength(this.getDataItem(), value.length);
            const lenBuf = ethUtil.setLengthLeft(
                ethUtil.toBuffer(`0x${value.length.toString(constants.HEX_BASE)}`),
                constants.EVM_WORD_WIDTH_IN_BYTES,
            );
            block.setHeader(lenBuf);
        }
        // Create blocks for members of set.
        const memberCalldataBlocks: CalldataBlock[] = [];
        _.each(members, (member: DataType, idx: number) => {
            const memberBlock = member.generateCalldataBlock(value[idx], block);
            memberCalldataBlocks.push(memberBlock);
        });
        block.setMembers(memberCalldataBlocks);
        return block;
    }

    protected _generateCalldataBlockFromObject(obj: object, parentBlock?: CalldataBlock): SetCalldataBlock {
        // Create a new calldata block for this set.
        const parentName = parentBlock === undefined ? '' : parentBlock.getName();
        const block = new SetCalldataBlock(this.getDataItem().name, this.getSignature(), parentName);
        // Create blocks for members of set.
        const memberCalldataBlocks: CalldataBlock[] = [];
        _.forEach(this._memberIndexByName, (memberIndex: number, memberName: string) => {
            if (!(memberName in obj)) {
                throw new Error(
                    `Could not assign tuple to object: missing key '${memberName}' in object ${JSON.stringify(obj)}`,
                );
            }
            const memberValue: any = (obj as ObjectMap<any>)[memberName];
            const memberBlock = this._members[memberIndex].generateCalldataBlock(memberValue, block);
            memberCalldataBlocks.push(memberBlock);
        });
        // Associate member blocks with Set block.
        block.setMembers(memberCalldataBlocks);
        return block;
    }

    protected _computeSignatureOfMembers(isDetailed?: boolean): string {
        // Compute signature of members
        let signature = `(`;
        _.each(this._members, (member: DataType, i: number) => {
            signature += member.getSignature(isDetailed);
            if (i < this._members.length - 1) {
                signature += ',';
            }
        });
        signature += ')';
        return signature;
    }

    private _createMembersWithKeys(dataItem: DataItem): [DataType[], MemberIndexByName] {
        // Sanity check
        if (dataItem.components === undefined) {
            throw new Error(
                `Tried to create a set using key/value pairs, but no components were defined by the input DataItem '${
                    dataItem.name
                }'.`,
            );
        }
        // Create one member for each component of `dataItem`
        const members: DataType[] = [];
        const memberIndexByName: MemberIndexByName = {};
        const memberNames: string[] = [];
        _.each(dataItem.components, (memberItem: DataItem) => {
            // If a component with `name` already exists then
            // rename to `name_nameIdx` to avoid naming conflicts.
            let memberName = memberItem.name;
            let nameIdx = 0;
            while (_.includes(memberNames, memberName) || _.isEmpty(memberName)) {
                nameIdx++;
                memberName = `${memberItem.name}_${nameIdx}`;
            }
            memberNames.push(memberName);
            const childDataItem: DataItem = {
                type: memberItem.type,
                name: `${dataItem.name}.${memberName}`,
            };
            const components = memberItem.components;
            if (components !== undefined) {
                childDataItem.components = components;
            }
            const child = this.getFactory().create(childDataItem, this);
            memberIndexByName[memberName] = members.length;
            members.push(child);
        });
        return [members, memberIndexByName];
    }

    private _createMembersWithLength(dataItem: DataItem, length: number): [DataType[], MemberIndexByName] {
        // Create `length` members, deriving the type from `dataItem`
        const members: DataType[] = [];
        const memberIndexByName: MemberIndexByName = {};
        const range = _.range(length);
        _.each(range, (idx: number) => {
            const memberDataItem: DataItem = {
                type: this._arrayElementType === undefined ? '' : this._arrayElementType,
                name: `${dataItem.name}[${idx.toString(constants.DEC_BASE)}]`,
            };
            const components = dataItem.components;
            if (components !== undefined) {
                memberDataItem.components = components;
            }
            const memberType = this.getFactory().create(memberDataItem, this);
            memberIndexByName[idx.toString(constants.DEC_BASE)] = members.length;
            members.push(memberType);
        });
        return [members, memberIndexByName];
    }
}
