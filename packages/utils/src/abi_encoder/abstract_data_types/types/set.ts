import { DataItem } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { BigNumber } from '../../../configured_bignumber';
import { CalldataBlock, CalldataBlocks, RawCalldata } from '../../calldata';
import * as Constants from '../../utils/constants';
import { DecodingRules } from '../../utils/rules';

import { DataType } from '../data_type';
import { DataTypeFactory, MemberIndexByName } from '../interfaces';

import { Pointer } from './pointer';

export abstract class Set extends DataType {
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

    public generateCalldataBlock(value: any[] | object, parentBlock?: CalldataBlock): CalldataBlocks.Set {
        const block =
            value instanceof Array
                ? this._generateCalldataBlockFromArray(value, parentBlock)
                : this._generateCalldataBlockFromObject(value, parentBlock);
        return block;
    }

    public generateValue(calldata: RawCalldata, rules: DecodingRules): any[] | object {
        let members = this._members;
        if (this._isArray && this._arrayLength === undefined) {
            const arrayLengthBuf = calldata.popWord();
            const arrayLengthHex = ethUtil.bufferToHex(arrayLengthBuf);
            const hexBase = 16;
            const arrayLength = new BigNumber(arrayLengthHex, hexBase);

            [members] = this._createMembersWithLength(this.getDataItem(), arrayLength.toNumber());
        }

        calldata.startScope();
        let value: any[] | object;
        if (rules.structsAsObjects && !this._isArray) {
            value = {};
            _.each(this._memberIndexByName, (idx: number, key: string) => {
                const member = this._members[idx];
                const memberValue = member.generateValue(calldata, rules);
                (value as { [key: string]: any })[key] = memberValue;
            });
        } else {
            value = [];
            _.each(members, (member: DataType, idx: number) => {
                const memberValue = member.generateValue(calldata, rules);
                (value as any[]).push(memberValue);
            });
        }
        calldata.endScope();
        return value;
    }

    public isStatic(): boolean {
        /* For Tuple:
                    const isStaticTuple = this.children.length === 0;
                    return isStaticTuple; // @TODO: True in every case or only when dynamic data?

           For Array:
                if isLengthDefined = false then this is false

                Otherwise if the first element is a Pointer then false
        */

        if (this._isArray && this._arrayLength === undefined) {
            return false;
        }

        // Search for dependent members
        const dependentMember = _.find(this._members, (member: DataType) => {
            return member instanceof Pointer;
        });
        const isStatic = dependentMember === undefined; // static if we couldn't find a dependent member
        return isStatic;
    }

    protected _generateCalldataBlockFromArray(value: any[], parentBlock?: CalldataBlock): CalldataBlocks.Set {
        // Sanity check length
        if (this._arrayLength !== undefined && value.length !== this._arrayLength) {
            throw new Error(
                `Expected array of ${JSON.stringify(
                    this._arrayLength,
                )} elements, but got array of length ${JSON.stringify(value.length)}`,
            );
        }

        const parentName = parentBlock === undefined ? '' : parentBlock.getName();
        const methodBlock: CalldataBlocks.Set = new CalldataBlocks.Set(
            this.getDataItem().name,
            this.getSignature(),
            parentName,
        );

        let members = this._members;
        if (this._isArray && this._arrayLength === undefined) {
            [members] = this._createMembersWithLength(this.getDataItem(), value.length);

            const lenBuf = ethUtil.setLengthLeft(
                ethUtil.toBuffer(`0x${value.length.toString(Constants.HEX_BASE)}`),
                Constants.EVM_WORD_WIDTH_IN_BYTES,
            );
            methodBlock.setHeader(lenBuf);
        }

        const memberCalldataBlocks: CalldataBlock[] = [];
        _.each(members, (member: DataType, idx: number) => {
            const block = member.generateCalldataBlock(value[idx], methodBlock);
            memberCalldataBlocks.push(block);
        });
        methodBlock.setMembers(memberCalldataBlocks);
        return methodBlock;
    }

    protected _generateCalldataBlockFromObject(obj: object, parentBlock?: CalldataBlock): CalldataBlocks.Set {
        const parentName = parentBlock === undefined ? '' : parentBlock.getName();
        const methodBlock: CalldataBlocks.Set = new CalldataBlocks.Set(
            this.getDataItem().name,
            this.getSignature(),
            parentName,
        );
        const memberCalldataBlocks: CalldataBlock[] = [];
        const childMap = _.cloneDeep(this._memberIndexByName);
        _.forOwn(obj, (value: any, key: string) => {
            if (!(key in childMap)) {
                throw new Error(
                    `Could not assign tuple to object: unrecognized key '${key}' in object ${this.getDataItem().name}`,
                );
            }
            const block = this._members[this._memberIndexByName[key]].generateCalldataBlock(value, methodBlock);
            memberCalldataBlocks.push(block);
            delete childMap[key];
        });

        if (Object.keys(childMap).length !== 0) {
            throw new Error(`Could not assign tuple to object: missing keys ${Object.keys(childMap)}`);
        }

        methodBlock.setMembers(memberCalldataBlocks);
        return methodBlock;
    }

    protected _computeSignatureOfMembers(): string {
        // Compute signature of members
        let signature = `(`;
        _.each(this._members, (member: DataType, i: number) => {
            signature += member.getSignature();
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
            throw new Error(`Expected components`);
        }

        const members: DataType[] = [];
        const memberIndexByName: MemberIndexByName = {};
        _.each(dataItem.components, (memberItem: DataItem) => {
            const childDataItem: DataItem = {
                type: memberItem.type,
                name: `${dataItem.name}.${memberItem.name}`,
            };
            const components = memberItem.components;
            if (components !== undefined) {
                childDataItem.components = components;
            }
            const child = this.getFactory().create(childDataItem, this);
            memberIndexByName[memberItem.name] = members.length;
            members.push(child);
        });

        return [members, memberIndexByName];
    }

    private _createMembersWithLength(dataItem: DataItem, length: number): [DataType[], MemberIndexByName] {
        const members: DataType[] = [];
        const memberIndexByName: MemberIndexByName = {};
        const range = _.range(length);
        _.each(range, (idx: number) => {
            const childDataItem: DataItem = {
                type: this._arrayElementType ? this._arrayElementType : '',
                name: `${dataItem.name}[${idx.toString(Constants.DEC_BASE)}]`,
            };
            const components = dataItem.components;
            if (components !== undefined) {
                childDataItem.components = components;
            }
            const child = this.getFactory().create(childDataItem, this);
            memberIndexByName[idx.toString(Constants.DEC_BASE)] = members.length;
            members.push(child);
        });

        return [members, memberIndexByName];
    }
}
