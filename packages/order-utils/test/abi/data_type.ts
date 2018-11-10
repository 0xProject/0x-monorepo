import { Calldata, CalldataBlock, PayloadCalldataBlock, DependentCalldataBlock } from "./calldata";
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

    protected abstract createCalldataBlock(): CalldataBlock;
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

    protected generateCalldataBlock(payload: Buffer, calldata: Calldata): void {
        const name = this.getDataItem().name;
        const signature = this.getSignature();
        const offsetInBytes = calldata.getSizeInBytes();
        const relocatable = false;
        const block = new PayloadCalldataBlock(name, signature, offsetInBytes, relocatable, payload);
        calldata.pushBlock(block);
    }

    public isStatic(): boolean {
        // If a payload has a constant size then it's static
        return this.hasConstantSize;
    }
}

export abstract class DependentDataType extends DataType {
    protected dependency: DataType;
    protected parent: DataType;

    public constructor(dataItem: DataItem, dependency: DataType, parent: DataType) {
        super(dataItem);
        this.dependency = dependency;
        this.parent = parent;
    }

    protected generateCalldataBlock(offsetInBytes: number, calldata: Calldata): CalldataBlock {
        const name = this.getDataItem().name;
        const signature = this.getSignature();
        const relocatable = false;
        const parentBlock = calldata.lookupBlockByName(this.parent.getDataItem().name);
        const dependencyBlock = calldata.lookupBlockByName(this.parent.getDataItem().name);
        const block = new DependentCalldataBlock(name, signature, offsetInBytes, relocatable, dependencyBlock, parentBlock);
        calldata.pushBlock(block);
    }

    public encode(value: any, calldata: Calldata = new Calldata()): void {
        const offsetInBytes = calldata.reserveSpace(DependentCalldataBlock.DEPENDENT_PAYLOAD_SIZE_IN_BYTES);
        this.dependency.encode(value, calldata);
        this.generateCalldataBlock(offsetInBytes, calldata);
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


    public constructor(dataItem: DataItem, isArray: boolean = false, arrayLength?: number) {
        super(dataItem);

        this.memberMap = {};
        this.members = [];
        this.isArray = isArray;
        this.arrayLength = arrayLength;
        if (isArray && arrayLength !== undefined) {
            [this.members, this.memberMap] = MemberDataType.createMembersWithLength(arrayLength);
        } else if (!isArray) {
            [this.members, this.memberMap] = MemberDataType.createMembersWithKeys(dataItem);
        }
    }

    private static createMembersWithKeys(dataItem: DataItem): [DataType[], MemberMap] {
        // Sanity check
        if (dataItem.components === undefined) {
            throw new Error(`Expected components`);
        }

        let members: DataType[] = [];
        let memberMap: MemberMap = {};
        _.each(dataItem.components, (dataItem: DataItem) => {
            const childDataItem = {
                type: dataItem.type,
                name: `${dataItem.name}.${dataItem.name}`,
            } as DataItem;
            const child = DataTypeFactory.create(childDataItem, this);
            members.push(child);
            memberMap[dataItem.name] = members.length;
        });

        return [members, memberMap];
    }

    private static createMembersWithLength(dataItem: DataItem, length: number): [DataType[], MemberMap] {
        let members: DataType[] = [];
        let memberMap: MemberMap = {};
        const range = _.range(length);
        _.each(range, (idx: number) => {
            const childDataItem = {
                type: this.type,
                name: `${dataItem.name}[${idx.toString(10)}]`,
            } as DataItem;
            const components = dataItem.components;
            if (components !== undefined) {
                childDataItem.components = components;
            }
            const child = DataTypeFactory.create(childDataItem, this);
            members.push(child);
            memberMap[idx.toString(10)] = members.length;
        });

        return [members, memberMap];
    }

    protected encodeFromArray(value: any[], calldata: Calldata) {
        // Sanity check length
        const valueLength = new BigNumber(value.length);
        if (this.length !== SolArray.UNDEFINED_LENGTH && valueLength.equals(this.length) === false) {
            throw new Error(
                `Expected array of ${JSON.stringify(
                    this.length,
                )} elements, but got array of length ${JSON.stringify(valueLength)}`,
            );
        }

        // Assign values to children
        for (let idx = new BigNumber(0); idx.lessThan(this.length); idx = idx.plus(1)) {
            const idxNumber = idx.toNumber();
            this.members[idxNumber].assignValue(value[idxNumber]);
        }
    }

    protected encodeFromObject(obj: object, calldata: Calldata) {
        let childMap = _.cloneDeep(this.memberMap);
        _.forOwn(obj, (value: any, key: string) => {
            if (key in childMap === false) {
                throw new Error(`Could not assign tuple to object: unrecognized key '${key}'`);
            }
            this.members[this.childMap[key]].assignValue(value);
            delete childMap[key];
        });

        if (Object.keys(childMap).length !== 0) {
            throw new Error(`Could not assign tuple to object: missing keys ${Object.keys(childMap)}`);
        }
    }

    public encode(value: any[] | object, calldata = new Calldata()) {
        if (value instanceof Array) {
            this.encodeFromArray(value, calldata);
        } else if (typeof value === 'object') {
            this.encodeFromObject(value, encodeFromObject);
        } else {
            throw new Error(`Unexpected type for ${value}`);
        }
    }

    protected generateCalldataBlock(offsetInBytes: number, calldata: Calldata): CalldataBlock {
        const name = this.getDataItem().name;
        const signature = this.getSignature();
        const relocatable = false;
        const parentBlock = calldata.lookupBlockByName(this.parent.getDataItem().name);
        const dependencyBlock = calldata.lookupBlockByName(this.parent.getDataItem().name);
        const block = new DependentCalldataBlock(name, signature, offsetInBytes, relocatable, dependencyBlock, parentBlock);
        calldata.pushBlock(block);
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
            return true;
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