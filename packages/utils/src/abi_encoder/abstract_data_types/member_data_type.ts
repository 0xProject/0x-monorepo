import { DataItem } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { BigNumber } from '../../configured_bignumber';
import { CalldataBlock, MemberCalldataBlock, RawCalldata } from '../calldata';
import * as Constants from '../constants';
import { DecodingRules } from '../utils/rules';

import { DataType } from './data_type';
import { DependentDataType } from './dependent_data_type';
import { DataTypeFactory } from './interfaces';

interface MemberMap {
    [key: string]: number;
}

export abstract class MemberDataType extends DataType {
    protected readonly _arrayLength: number | undefined;
    protected readonly _arrayElementType: string | undefined;
    private readonly _memberMap: MemberMap;
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
        this._memberMap = {};
        this._members = [];
        this._isArray = isArray;
        this._arrayLength = arrayLength;
        this._arrayElementType = arrayElementType;
        if (isArray && arrayLength !== undefined) {
            [this._members, this._memberMap] = this._createMembersWithLength(dataItem, arrayLength);
        } else if (!isArray) {
            [this._members, this._memberMap] = this._createMembersWithKeys(dataItem);
        }
    }

    public generateCalldataBlock(value: any[] | object, parentBlock?: CalldataBlock): MemberCalldataBlock {
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
            _.each(this._memberMap, (idx: number, key: string) => {
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
            return member instanceof DependentDataType;
        });
        const isStatic = dependentMember === undefined; // static if we couldn't find a dependent member
        return isStatic;
    }

    protected _generateCalldataBlockFromArray(value: any[], parentBlock?: CalldataBlock): MemberCalldataBlock {
        // Sanity check length
        if (this._arrayLength !== undefined && value.length !== this._arrayLength) {
            throw new Error(
                `Expected array of ${JSON.stringify(
                    this._arrayLength,
                )} elements, but got array of length ${JSON.stringify(value.length)}`,
            );
        }

        const parentName = parentBlock === undefined ? '' : parentBlock.getName();
        const methodBlock: MemberCalldataBlock = new MemberCalldataBlock(
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

        const memberBlocks: CalldataBlock[] = [];
        _.each(members, (member: DataType, idx: number) => {
            const block = member.generateCalldataBlock(value[idx], methodBlock);
            memberBlocks.push(block);
        });
        methodBlock.setMembers(memberBlocks);
        return methodBlock;
    }

    protected _generateCalldataBlockFromObject(obj: object, parentBlock?: CalldataBlock): MemberCalldataBlock {
        const parentName = parentBlock === undefined ? '' : parentBlock.getName();
        const methodBlock: MemberCalldataBlock = new MemberCalldataBlock(
            this.getDataItem().name,
            this.getSignature(),
            parentName,
        );
        const memberBlocks: CalldataBlock[] = [];
        const childMap = _.cloneDeep(this._memberMap);
        _.forOwn(obj, (value: any, key: string) => {
            if (!(key in childMap)) {
                throw new Error(
                    `Could not assign tuple to object: unrecognized key '${key}' in object ${this.getDataItem().name}`,
                );
            }
            const block = this._members[this._memberMap[key]].generateCalldataBlock(value, methodBlock);
            memberBlocks.push(block);
            delete childMap[key];
        });

        if (Object.keys(childMap).length !== 0) {
            throw new Error(`Could not assign tuple to object: missing keys ${Object.keys(childMap)}`);
        }

        methodBlock.setMembers(memberBlocks);
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

    private _createMembersWithKeys(dataItem: DataItem): [DataType[], MemberMap] {
        // Sanity check
        if (dataItem.components === undefined) {
            throw new Error(`Expected components`);
        }

        const members: DataType[] = [];
        const memberMap: MemberMap = {};
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
            memberMap[memberItem.name] = members.length;
            members.push(child);
        });

        return [members, memberMap];
    }

    private _createMembersWithLength(dataItem: DataItem, length: number): [DataType[], MemberMap] {
        const members: DataType[] = [];
        const memberMap: MemberMap = {};
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
            memberMap[idx.toString(Constants.DEC_BASE)] = members.length;
            members.push(child);
        });

        return [members, memberMap];
    }
}
