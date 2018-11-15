import { RawCalldata, Calldata, CalldataBlock, PayloadCalldataBlock, DependentCalldataBlock, MemberCalldataBlock } from "./calldata";
import { MethodAbi, DataItem } from 'ethereum-types';
import { DecodingRules, EncodingRules } from './calldata';
import { BigNumber } from '../configured_bignumber';
import ethUtil = require('ethereumjs-util');
var _ = require('lodash');

export interface DataTypeFactory {
    create: (dataItem: DataItem, parentDataType?: DataType) => DataType;
    mapDataItemToDataType: (dataItem: DataItem) => DataType;
}

export abstract class DataType {
    private static DEFAULT_ENCODING_RULES = { optimize: false, annotate: false } as EncodingRules;
    private static DEFAULT_DECODING_RULES = { structsAsObjects: false } as DecodingRules;

    private dataItem: DataItem;
    private factory: DataTypeFactory;

    constructor(dataItem: DataItem, factory: DataTypeFactory) {
        this.dataItem = dataItem;
        this.factory = factory;
    }

    public getDataItem(): DataItem {
        return this.dataItem;
    }

    public getFactory(): DataTypeFactory {
        return this.factory;
    }

    public encode(value: any, rules?: EncodingRules, selector?: string): string {
        const rules_ = rules ? rules : DataType.DEFAULT_ENCODING_RULES;
        const calldata = new Calldata(rules_);
        if (selector) calldata.setSelector(selector);
        const block = this.generateCalldataBlock(value);
        calldata.setRoot(block as MemberCalldataBlock); // @TODO CHANGE
        const calldataHex = calldata.toHexString();
        return calldataHex;
    }

    public decode(calldata: string, rules?: DecodingRules): any {
        const rawCalldata = new RawCalldata(calldata);
        const rules_ = rules ? rules : DataType.DEFAULT_DECODING_RULES;
        const value = this.generateValue(rawCalldata, rules_);
        return value;
    }

    public abstract generateCalldataBlock(value: any, parentBlock?: CalldataBlock): CalldataBlock;
    public abstract generateValue(calldata: RawCalldata, rules: DecodingRules): any;
    public abstract getSignature(): string;
    public abstract isStatic(): boolean;
}

export abstract class PayloadDataType extends DataType {
    protected hasConstantSize: boolean;

    public constructor(dataItem: DataItem, factory: DataTypeFactory, hasConstantSize: boolean) {
        super(dataItem, factory);
        this.hasConstantSize = hasConstantSize;
    }

    public generateCalldataBlock(value: any, parentBlock?: CalldataBlock): PayloadCalldataBlock {
        const encodedValue = this.encodeValue(value);
        const name = this.getDataItem().name;
        const signature = this.getSignature();
        const parentName = parentBlock === undefined ? '' : parentBlock.getName();
        const relocatable = false;
        const block = new PayloadCalldataBlock(name, signature, parentName, /*offsetInBytes,*/ relocatable, encodedValue);
        return block;
    }

    public generateValue(calldata: RawCalldata, rules: DecodingRules): any {
        const value = this.decodeValue(calldata);
        return value;
    }

    public isStatic(): boolean {
        // If a payload has a constant size then it's static
        return this.hasConstantSize;
    }

    public abstract encodeValue(value: any): Buffer;
    public abstract decodeValue(calldata: RawCalldata): any;
}

export abstract class DependentDataType extends DataType {
    protected dependency: DataType;
    protected parent: DataType;

    public constructor(dataItem: DataItem, factory: DataTypeFactory, dependency: DataType, parent: DataType) {
        super(dataItem, factory);
        this.dependency = dependency;
        this.parent = parent;
    }

    public generateCalldataBlock(value: any, parentBlock?: CalldataBlock): DependentCalldataBlock {
        if (parentBlock === undefined) {
            throw new Error(`DependentDataType requires a parent block to generate its block`);
        }
        const dependencyBlock = this.dependency.generateCalldataBlock(value, parentBlock);
        const name = this.getDataItem().name;
        const signature = this.getSignature();
        const parentName = parentBlock === undefined ? '' : parentBlock.getName();
        const relocatable = false;
        const block = new DependentCalldataBlock(name, signature, parentName, relocatable, dependencyBlock, parentBlock);
        return block;
    }

    public generateValue(calldata: RawCalldata, rules: DecodingRules): any {
        const destinationOffsetBuf = calldata.popWord();
        const currentOffset = calldata.getOffset();
        const destinationOffsetRelative = parseInt(ethUtil.bufferToHex(destinationOffsetBuf), 16);
        const destinationOffsetAbsolute = calldata.toAbsoluteOffset(destinationOffsetRelative);
        calldata.setOffset(destinationOffsetAbsolute);
        const value = this.dependency.generateValue(calldata, rules);
        calldata.setOffset(currentOffset);
        return value;
    }

    public isStatic(): boolean {
        return true;
    }
}

export interface MemberMap {
    [key: string]: number;
}

export abstract class MemberDataType extends DataType {
    private memberMap: MemberMap;
    private members: DataType[];
    private isArray: boolean;
    protected arrayLength: number | undefined;
    protected arrayElementType: string | undefined;


    public constructor(dataItem: DataItem, factory: DataTypeFactory, isArray: boolean = false, arrayLength?: number, arrayElementType?: string) {
        super(dataItem, factory);
        this.memberMap = {};
        this.members = [];
        this.isArray = isArray;
        this.arrayLength = arrayLength;
        this.arrayElementType = arrayElementType;
        if (isArray && arrayLength !== undefined) {
            [this.members, this.memberMap] = this.createMembersWithLength(dataItem, arrayLength);
        } else if (!isArray) {
            [this.members, this.memberMap] = this.createMembersWithKeys(dataItem);
        }
    }

    private createMembersWithKeys(dataItem: DataItem): [DataType[], MemberMap] {
        // Sanity check
        if (dataItem.components === undefined) {
            throw new Error(`Expected components`);
        }

        let members: DataType[] = [];
        let memberMap: MemberMap = {};
        _.each(dataItem.components, (memberItem: DataItem) => {
            const childDataItem = {
                type: memberItem.type,
                name: `${dataItem.name}.${memberItem.name}`,
            } as DataItem;
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

    private createMembersWithLength(dataItem: DataItem, length: number): [DataType[], MemberMap] {
        let members: DataType[] = [];
        let memberMap: MemberMap = {};
        const range = _.range(length);
        _.each(range, (idx: number) => {
            const childDataItem = {
                type: this.arrayElementType,
                name: `${dataItem.name}[${idx.toString(10)}]`,
            } as DataItem;
            const components = dataItem.components;
            if (components !== undefined) {
                childDataItem.components = components;
            }
            const child = this.getFactory().create(childDataItem, this);
            memberMap[idx.toString(10)] = members.length;
            members.push(child);
        });

        return [members, memberMap];
    }

    protected generateCalldataBlockFromArray(value: any[], parentBlock?: CalldataBlock): MemberCalldataBlock {
        // Sanity check length
        if (this.arrayLength !== undefined && value.length !== this.arrayLength) {
            throw new Error(
                `Expected array of ${JSON.stringify(
                    this.arrayLength,
                )} elements, but got array of length ${JSON.stringify(value.length)}`,
            );
        }

        const parentName = parentBlock === undefined ? '' : parentBlock.getName();
        const methodBlock: MemberCalldataBlock = new MemberCalldataBlock(this.getDataItem().name, this.getSignature(), parentName, this.isStatic(), false);

        let members = this.members;
        if (this.isArray && this.arrayLength === undefined) {
            [members,] = this.createMembersWithLength(this.getDataItem(), value.length);

            const lenBuf = ethUtil.setLengthLeft(ethUtil.toBuffer(`0x${value.length.toString(16)}`), 32);
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

    protected generateCalldataBlockFromObject(obj: object, parentBlock?: CalldataBlock): MemberCalldataBlock {
        const parentName = parentBlock === undefined ? '' : parentBlock.getName();
        const methodBlock: MemberCalldataBlock = new MemberCalldataBlock(this.getDataItem().name, this.getSignature(), parentName, this.isStatic(), false);
        const memberBlocks: CalldataBlock[] = [];
        let childMap = _.cloneDeep(this.memberMap);
        _.forOwn(obj, (value: any, key: string) => {
            if (key in childMap === false) {
                throw new Error(`Could not assign tuple to object: unrecognized key '${key}' in object ${this.getDataItem().name}`);
            }
            const block = this.members[this.memberMap[key]].generateCalldataBlock(value, methodBlock);
            memberBlocks.push(block);
            delete childMap[key];
        });

        if (Object.keys(childMap).length !== 0) {
            throw new Error(`Could not assign tuple to object: missing keys ${Object.keys(childMap)}`);
        }

        methodBlock.setMembers(memberBlocks);
        return methodBlock;
    }

    public generateCalldataBlock(value: any[] | object, parentBlock?: CalldataBlock): MemberCalldataBlock {
        const block = (value instanceof Array) ? this.generateCalldataBlockFromArray(value, parentBlock) : this.generateCalldataBlockFromObject(value, parentBlock);
        return block;
    }

    public generateValue(calldata: RawCalldata, rules: DecodingRules): any[] | object {
        let members = this.members;
        if (this.isArray && this.arrayLength === undefined) {
            const arrayLengthBuf = calldata.popWord();
            const arrayLengthHex = ethUtil.bufferToHex(arrayLengthBuf);
            const hexBase = 16;
            const arrayLength = new BigNumber(arrayLengthHex, hexBase);

            [members,] = this.createMembersWithLength(this.getDataItem(), arrayLength.toNumber());
        }

        calldata.startScope();
        let value: any[] | object;
        if (rules.structsAsObjects && !this.isArray) {
            value = {};
            _.each(this.memberMap, (idx: number, key: string) => {
                const member = this.members[idx];
                let memberValue = member.generateValue(calldata, rules);
                (value as { [key: string]: any })[key] = memberValue;
            });
        } else {
            value = [];
            _.each(members, (member: DataType, idx: number) => {
                let memberValue = member.generateValue(calldata, rules);
                (value as any[]).push(memberValue);
            });
        }
        calldata.endScope();
        return value;
    }

    protected computeSignatureOfMembers(): string {
        // Compute signature of members
        let signature = `(`;
        _.each(this.members, (member: DataType, i: number) => {
            signature += member.getSignature();
            if (i < this.members.length - 1) {
                signature += ',';
            }
        });
        signature += ')';
        return signature;
    }

    public isStatic(): boolean {
        /* For Tuple:
                    const isStaticTuple = this.children.length === 0;
                    return isStaticTuple; // @TODO: True in every case or only when dynamic data?

           For Array:
                if isLengthDefined = false then this is false

                Otherwise if the first element is a Pointer then false
        */

        if (this.isArray && this.arrayLength === undefined) {
            return false;
        }

        // Search for dependent members
        const dependentMember = _.find(this.members, (member: DataType) => {
            return (member instanceof DependentDataType);
        });
        const isStatic = (dependentMember === undefined); // static if we couldn't find a dependent member
        return isStatic;
    }
}
