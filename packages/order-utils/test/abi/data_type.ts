import { RawCalldata, Calldata, CalldataBlock, PayloadCalldataBlock, DependentCalldataBlock, MemberCalldataBlock } from "./calldata";
import { MethodAbi, DataItem } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import ethUtil = require('ethereumjs-util');
var _ = require('lodash');



export abstract class DataType {
    private dataItem: DataItem;

    constructor(dataItem: DataItem) {
        this.dataItem = dataItem;
    }

    public getDataItem(): DataItem {
        return this.dataItem;
    }

    public abstract generateCalldataBlock(value: any, parentBlock?: CalldataBlock): CalldataBlock;
    public abstract generateValue(calldata: RawCalldata): any;
    public abstract encode(value: any, calldata: Calldata): void;
    public abstract getSignature(): string;
    public abstract isStatic(): boolean;
}

export abstract class PayloadDataType extends DataType {
    protected hasConstantSize: boolean;

    public constructor(dataItem: DataItem, hasConstantSize: boolean) {
        super(dataItem);
        this.hasConstantSize = hasConstantSize;
    }

    public generateCalldataBlock(value: any, parentBlock?: CalldataBlock): PayloadCalldataBlock {
        const encodedValue = this.encodeValue(value);
        const name = this.getDataItem().name;
        const signature = this.getSignature();
        // const offsetInBytes = calldata.getSizeInBytes();
        const relocatable = false;
        const block = new PayloadCalldataBlock(name, signature, /*offsetInBytes,*/ relocatable, encodedValue);
        return block;
    }

    public encode(value: any, calldata: Calldata): void {
        const block = this.generateCalldataBlock(value);
        // calldata.setRoot(block);
    }

    public generateValue(calldata: RawCalldata): any {
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

    public constructor(dataItem: DataItem, dependency: DataType, parent: DataType) {
        super(dataItem);
        this.dependency = dependency;
        this.parent = parent;
    }

    public generateCalldataBlock(value: any, parentBlock?: CalldataBlock): DependentCalldataBlock {
        if (parentBlock === undefined) {
            throw new Error(`DependentDataType requires a parent block to generate its block`);
        }
        const dependencyBlock = this.dependency.generateCalldataBlock(value);
        const name = this.getDataItem().name;
        const signature = this.getSignature();
        const relocatable = false;
        const block = new DependentCalldataBlock(name, signature, /*offsetInBytes,*/ relocatable, dependencyBlock, parentBlock);
        return block;
    }

    public encode(value: any, calldata: Calldata = new Calldata()): void {
        const block = this.generateCalldataBlock(value);
        //calldata.setRoot(block);
    }

    public generateValue(calldata: RawCalldata): any {
        const destinationOffsetBuf = calldata.popWord();
        const currentOffset = calldata.getOffset();
        const destinationOffsetRelative = parseInt(ethUtil.bufferToHex(destinationOffsetBuf), 16);
        const destinationOffsetAbsolute = calldata.toAbsoluteOffset(destinationOffsetRelative);
        calldata.setOffset(destinationOffsetAbsolute);
        const value = this.dependency.generateValue(calldata);
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


    public constructor(dataItem: DataItem, isArray: boolean = false, arrayLength?: number, arrayElementType?: string) {
        super(dataItem);
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
            const child = DataTypeFactory.create(childDataItem, this);
            memberMap[memberItem.name] = members.length;
            members.push(child);
        });

        return [members, memberMap];
    }

    private createMembersWithLength(dataItem: DataItem, length: number): [DataType[], MemberMap] {
        console.log('!'.repeat(30), dataItem);
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
            const child = DataTypeFactory.create(childDataItem, this);
            memberMap[idx.toString(10)] = members.length;
            members.push(child);
        });

        return [members, memberMap];
    }

    protected generateCalldataBlockFromArray(value: any[]): MemberCalldataBlock {
        // Sanity check length
        if (this.arrayLength !== undefined && value.length !== this.arrayLength) {
            throw new Error(
                `Expected array of ${JSON.stringify(
                    this.arrayLength,
                )} elements, but got array of length ${JSON.stringify(value.length)}`,
            );
        }

        const methodBlock: MemberCalldataBlock = new MemberCalldataBlock(this.getDataItem().name, this.getSignature(), this.isStatic(), false);

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

    protected generateCalldataBlockFromObject(obj: object): MemberCalldataBlock {
        const methodBlock: MemberCalldataBlock = new MemberCalldataBlock(this.getDataItem().name, this.getSignature(), this.isStatic(), false);
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
        const block = (value instanceof Array) ? this.generateCalldataBlockFromArray(value) : this.generateCalldataBlockFromObject(value);
        return block;
    }

    public encode(value: any, calldata: Calldata = new Calldata()): void {
        const block = this.generateCalldataBlock(value);
        calldata.setRoot(block);
    }

    public generateValue(calldata: RawCalldata): any[] {
        let members = this.members;
        if (this.isArray && this.arrayLength === undefined) {
            const arrayLengthBuf = calldata.popWord();
            const arrayLengthHex = ethUtil.bufferToHex(arrayLengthBuf);
            const hexBase = 16;
            const arrayLength = new BigNumber(arrayLengthHex, hexBase);

            [members,] = this.createMembersWithLength(this.getDataItem(), arrayLength.toNumber());
        }

        calldata.startScope();
        const decodedValue: any[] = [];
        _.each(members, (member: DataType, idx: number) => {
            let memberValue = member.generateValue(calldata);
            decodedValue.push(memberValue);
        });
        calldata.endScope();

        return decodedValue;
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

export interface DataTypeFactoryImpl {
    create: (dataItem: DataItem, parentDataType: DataType) => DataType;
    mapDataItemToDataType: (dataItem: DataItem) => DataType;
}

export class DataTypeFactory {
    private static instance: DataTypeFactory;
    private provider: DataTypeFactoryImpl | undefined;

    private constructor() { }

    private static getInstance(): DataTypeFactory {
        if (!DataTypeFactory.instance) {
            DataTypeFactory.instance = new DataTypeFactory();
        }
        return DataTypeFactory.instance;
    }

    public static setImpl(provider: DataTypeFactoryImpl) {
        const instance = DataTypeFactory.getInstance();
        if (instance.provider !== undefined) {
            throw new Error(`Tried to set implementation more than once`);
        }
        DataTypeFactory.getInstance().provider = provider;
    }

    public static create(dataItem: DataItem, parentDataType: DataType): DataType {
        const instance = DataTypeFactory.getInstance();
        if (instance.provider === undefined) {
            throw new Error(`Tried to create before implementation is set`);
        }
        return instance.provider.create(dataItem, parentDataType);
    }

    public static mapDataItemToDataType(dataItem: DataItem): DataType {
        const instance = DataTypeFactory.getInstance();
        if (instance.provider === undefined) {
            throw new Error(`Tried to create before implementation is set`);
        }
        return instance.provider.mapDataItemToDataType(dataItem);
    }
}