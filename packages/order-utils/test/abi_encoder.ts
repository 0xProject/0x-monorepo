
import * as chai from 'chai';
import 'mocha';
import ethUtil = require('ethereumjs-util');

var _ = require('lodash');

import { chaiSetup } from './utils/chai_setup';

import { MethodAbi, DataItem } from 'ethereum-types';

import { BigNumber } from '@0x/utils';
import { bigNumberify } from 'ethers/utils';

chaiSetup.configure();
const expect = chai.expect;


class Word {
    private value: string;

    constructor(value?: string) {
        if (value === undefined) {
            this.value = '';
        } else {
            this.value = value;
        }
    }

    public set(value: string) {
        if (value.length !== 64) {
            throw `Tried to create word that is not 32 bytes: ${value}`;
        }

        this.value = value;
    }

    public get(): string {
        return this.value;
    }

    public getAsHex(): string {
        return `0x${this.value}`;
    }
}

export enum CalldataSection {
    NONE,
    PARAMS,
    DATA,
}

class Memblock {
    private dataType: DataType;
    private location: { calldataSection: CalldataSection; sectionOffset: BigNumber; offset: BigNumber };

    constructor(dataType: DataType) {
        this.dataType = dataType;
        this.location = {
            calldataSection: CalldataSection.NONE,
            sectionOffset: new BigNumber(0),
            offset: new BigNumber(0),
        };
    }

    public getSize(): BigNumber {
        return new BigNumber(ethUtil.toBuffer(this.dataType.getHexValue()).byteLength);
    }

    public assignLocation(calldataSection: CalldataSection, sectionOffset: BigNumber, offset: BigNumber) {
        this.location.calldataSection = calldataSection;
        this.location.sectionOffset = sectionOffset;
        this.location.offset = offset;
    }

    public get(): string {
        console.log(`Unstripped = '${this.dataType.getHexValue()}' and Stripped = '${ethUtil.stripHexPrefix(this.dataType.getHexValue())}'`);
        return ethUtil.stripHexPrefix(this.dataType.getHexValue());
    }

    public getOffset(): BigNumber {
        return this.location.offset;
    }

    public getAbsoluteOffset(): BigNumber {
        return this.location.sectionOffset.plus(this.location.offset);
    }

    public getSection(): CalldataSection {
        return this.location.calldataSection;
    }
}

interface BindList {
    [key: string]: Memblock;
}

export class Calldata {
    private selector: string;
    private params: Memblock[];
    private data: Memblock[];
    private dataOffset: BigNumber;
    private currentDataOffset: BigNumber;
    private currentParamOffset: BigNumber;
    private bindList: BindList;

    constructor(selector: string, nParams: number) {
        this.selector = selector;
        this.params = [];
        this.data = [];
        const evmWordSize = 32;
        this.dataOffset = new BigNumber(nParams).times(evmWordSize);
        this.currentDataOffset = new BigNumber(0);
        this.currentParamOffset = new BigNumber(0);
        this.bindList = {};
    }

    public bind(dataType: DataType, section: CalldataSection) {
        if (dataType.getId() in this.bindList) {
            throw `Rebind on ${dataType.getId()}`;
        }
        const memblock = new Memblock(dataType);
        switch (section) {
            case CalldataSection.PARAMS:
                this.params.push(memblock);
                memblock.assignLocation(section, new BigNumber(0), this.currentParamOffset);

                console.log(`Binding ${dataType.getDataItem().name} to PARAMS at ${this.currentParamOffset}`);
                this.currentParamOffset = this.currentParamOffset.plus(memblock.getSize());
                break;

            case CalldataSection.DATA:
                this.data.push(memblock);
                memblock.assignLocation(section, this.dataOffset, this.currentDataOffset);

                console.log(
                    `Binding ${dataType.getDataItem().name} to DATA at ${memblock
                        .getAbsoluteOffset()
                        .toString(16)}`,
                );
                this.currentDataOffset = this.currentDataOffset.plus(memblock.getSize());
                break;

            default:
                throw `Unrecognized calldata section: ${section}`;
        }

        this.bindList[dataType.getId()] = memblock;
        dataType.rbind(memblock);
    }

    public getHexValue(): string {
        let hexValue = `${this.selector}`;
        _.each(this.params, (memblock: Memblock) => {
            hexValue += memblock.get();
        });
        _.each(this.data, (memblock: Memblock) => {
            hexValue += memblock.get();
        });

        return hexValue;
    }
}

export abstract class DataType {
    private dataItem: DataItem;
    private hexValue: string;
    protected memblock: Memblock | undefined;
    protected children: DataType[];

    constructor(dataItem: DataItem) {
        this.dataItem = dataItem;
        this.hexValue = '0x';
        this.memblock = undefined;
        this.children = [];
    }

    protected assignHexValue(hexValue: string) {
        this.hexValue = hexValue;
    }

    public getHexValue(): string {
        return this.hexValue;
    }

    public getDataItem(): DataItem {
        return this.dataItem;
    }

    public rbind(memblock: Memblock) {
        this.memblock = memblock;
    }

    public bind(calldata: Calldata, section: CalldataSection) {
        calldata.bind(this, section);
        _.each(this.getChildren(), (child: DataType) => {
            child.bind(calldata, CalldataSection.DATA);
        });
    }

    public getId(): string {
        return this.dataItem.name;
    }

    public getOffset(): BigNumber {
        if (this.memblock === undefined) return new BigNumber(0);
        return this.memblock.getOffset();
    }

    public getAbsoluteOffset(): BigNumber {
        if (this.memblock === undefined) return new BigNumber(0);
        return this.memblock.getAbsoluteOffset();
    }
    /*
        public getSize(): BigNumber {
            if (this.memblock === undefined) return new BigNumber(0);
            return this.memblock.getSize();
        }
        */

    public getChildren(): DataType[] {
        return this.children;
    }

    public getSize(): BigNumber {
        return this.getHeaderSize().plus(this.getBodySize());
    }

    public abstract assignValue(value: any): void;
    public abstract getSignature(): string;
    public abstract isStatic(): boolean;
    public abstract getHeaderSize(): BigNumber;
    public abstract getBodySize(): BigNumber;
}

export abstract class StaticDataType extends DataType {
    constructor(dataItem: DataItem) {
        super(dataItem);
    }
}

export abstract class DynamicDataType extends DataType {
    constructor(dataItem: DataItem) {
        super(dataItem);
    }
}

export class Address extends StaticDataType {
    constructor(dataItem: DataItem) {
        super(dataItem);
        expect(Address.matchGrammar(dataItem.type)).to.be.true();
    }

    public assignValue(value: string) {
        const evmWordWidth = 32;
        const hexValue = ethUtil.bufferToHex(ethUtil.setLengthLeft(ethUtil.toBuffer(value), evmWordWidth));
        this.assignHexValue(hexValue);
    }

    public getSignature(): string {
        return `address`;
    }

    public isStatic(): boolean {
        return true;
    }

    public getHeaderSize(): BigNumber {
        return new BigNumber(0);
    }

    public getBodySize(): BigNumber {
        return new BigNumber(32);
    }

    public static matchGrammar(type: string): boolean {
        return type === 'address';
    }
}

export class Bool extends StaticDataType {
    constructor(dataItem: DataItem) {
        super(dataItem);
        expect(Bool.matchGrammar(dataItem.type)).to.be.true();
    }

    public assignValue(value: boolean) {
        const evmWordWidth = 32;
        const encodedValue = value === true ? '0x1' : '0x0';
        const hexValue = ethUtil.bufferToHex(ethUtil.setLengthLeft(ethUtil.toBuffer(encodedValue), evmWordWidth));
        this.assignHexValue(hexValue);
    }

    public getSignature(): string {
        return 'bool';
    }

    public isStatic(): boolean {
        return true;
    }

    public getHeaderSize(): BigNumber {
        return new BigNumber(0);
    }

    public getBodySize(): BigNumber {
        return new BigNumber(32);
    }

    public static matchGrammar(type: string): boolean {
        return type === 'bool';
    }
}

abstract class Number extends StaticDataType {
    static MAX_WIDTH: number = 256;
    static DEFAULT_WIDTH: number = Number.MAX_WIDTH;
    width: number = Number.DEFAULT_WIDTH;

    constructor(dataItem: DataItem, matcher: RegExp) {
        super(dataItem);
        const matches = matcher.exec(dataItem.type);
        expect(matches).to.be.not.null();
        if (matches !== null && matches.length === 2 && matches[1] !== undefined) {
            this.width = parseInt(matches[1]);
        } else {
            this.width = 256;
        }
    }

    public assignValue(value: BigNumber) {
        if (value.greaterThan(this.getMaxValue())) {
            throw `tried to assign value of ${value}, which exceeds max value of ${this.getMaxValue()}`;
        } else if (value.lessThan(this.getMinValue())) {
            throw `tried to assign value of ${value}, which exceeds min value of ${this.getMinValue()}`;
        }

        const hexBase = 16;
        const evmWordWidth = 32;
        let valueBuf: Buffer;
        if (value.greaterThanOrEqualTo(0)) {
            valueBuf = ethUtil.setLengthLeft(ethUtil.toBuffer(`0x${value.toString(hexBase)}`), evmWordWidth);
        } else {
            // BigNumber can't write a negative hex value, so we use twos-complement conversion to do it ourselves.
            // Step 1/3: Convert value to positive binary string
            const binBase = 2;
            const valueBin = value.times(-1).toString(binBase);

            // Step 2/3: Invert binary value
            const bitsInEvmWord = 256;
            let invertedValueBin = '1'.repeat(bitsInEvmWord - valueBin.length);
            _.each(valueBin, (bit: string) => {
                invertedValueBin += bit === '1' ? '0' : '1';
            });
            const invertedValue = new BigNumber(invertedValueBin, binBase);

            // Step 3/3: Add 1 to inverted value
            // The result is the two's-complement represent of the input value.
            const negativeValue = invertedValue.plus(1);

            // Convert the negated value to a hex string
            valueBuf = ethUtil.setLengthLeft(
                ethUtil.toBuffer(`0x${negativeValue.toString(hexBase)}`),
                evmWordWidth,
            );
        }

        const encodedValue = ethUtil.bufferToHex(valueBuf);
        this.assignHexValue(encodedValue);
    }

    public isStatic(): boolean {
        return true;
    }

    public getHeaderSize(): BigNumber {
        return new BigNumber(0);
    }

    public getBodySize(): BigNumber {
        return new BigNumber(32);
    }

    public abstract getMaxValue(): BigNumber;
    public abstract getMinValue(): BigNumber;
}

export class Int extends Number {
    static matcher = RegExp(
        '^int(8|16|24|32|40|48|56|64|72|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256){0,1}$',
    );

    constructor(dataItem: DataItem) {
        super(dataItem, Int.matcher);
    }

    public getMaxValue(): BigNumber {
        return new BigNumber(2).toPower(this.width - 1).sub(1);
    }

    public getMinValue(): BigNumber {
        return new BigNumber(2).toPower(this.width - 1).times(-1);
    }

    public getSignature(): string {
        return `int${this.width}`;
    }

    public static matchGrammar(type: string): boolean {
        return this.matcher.test(type);
    }
}

export class UInt extends Number {
    static matcher = RegExp(
        '^uint(8|16|24|32|40|48|56|64|72|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256){0,1}$',
    );

    constructor(dataItem: DataItem) {
        super(dataItem, UInt.matcher);
    }

    public getMaxValue(): BigNumber {
        return new BigNumber(2).toPower(this.width).sub(1);
    }

    public getMinValue(): BigNumber {
        return new BigNumber(0);
    }

    public getSignature(): string {
        return `uint${this.width}`;
    }

    public static matchGrammar(type: string): boolean {
        return this.matcher.test(type);
    }
}

export class Byte extends StaticDataType {
    static matcher = RegExp(
        '^(byte|bytes(1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31|32))$',
    );

    static DEFAULT_WIDTH = 1;
    width: number = Byte.DEFAULT_WIDTH;

    constructor(dataItem: DataItem) {
        super(dataItem);
        const matches = Byte.matcher.exec(dataItem.type);
        expect(matches).to.be.not.null();
        if (matches !== null && matches.length === 3 && matches[2] !== undefined) {
            this.width = parseInt(matches[2]);
        } else {
            this.width = Byte.DEFAULT_WIDTH;
        }
    }

    public assignValue(value: string | Buffer) {
        // Convert value into a buffer and do bounds checking
        const valueBuf = ethUtil.toBuffer(value);
        if (valueBuf.byteLength > this.width) {
            throw new Error(
                `Tried to assign ${value} (${
                valueBuf.byteLength
                } bytes), which exceeds max bytes that can be stored in a ${this.getSignature()}`,
            );
        } else if (value.length % 2 !== 0) {
            throw new Error(`Tried to assign ${value}, which is contains a half-byte. Use full bytes only.`);
        }

        // Store value as hex
        const evmWordWidth = 32;
        const paddedValue = ethUtil.setLengthRight(valueBuf, evmWordWidth);
        const hexValue = ethUtil.bufferToHex(paddedValue);

        this.assignHexValue(hexValue);
    }

    public getSignature(): string {
        // Note that `byte` reduces to `bytes1`
        return `bytes${this.width}`;
    }

    public isStatic(): boolean {
        return true;
    }

    public getHeaderSize(): BigNumber {
        return new BigNumber(0);
    }

    public getBodySize(): BigNumber {
        return new BigNumber(32);
    }

    public static matchGrammar(type: string): boolean {
        return this.matcher.test(type);
    }
}

export class Bytes extends DynamicDataType {
    static UNDEFINED_LENGTH = new BigNumber(-1);
    length: BigNumber = Bytes.UNDEFINED_LENGTH;

    constructor(dataItem: DataItem) {
        super(dataItem);
        expect(Bytes.matchGrammar(dataItem.type)).to.be.true();
    }

    public assignValue(value: string | Buffer) {
        if (typeof value === 'string' && !value.startsWith('0x')) {
            throw new Error(`Input value must be hex (prefixed with 0x). Actual value is '${value}'`);
        }
        const valueBuf = ethUtil.toBuffer(value);
        if (value.length % 2 !== 0) {
            throw new Error(`Tried to assign ${value}, which is contains a half-byte. Use full bytes only.`);
        }

        const wordsForValue = Math.ceil(valueBuf.byteLength / 32);
        const paddedBytesForValue = wordsForValue * 32;
        const paddedValueBuf = ethUtil.setLengthRight(ethUtil.toBuffer(value), paddedBytesForValue);
        const paddedLengthBuf = ethUtil.setLengthLeft(ethUtil.toBuffer(valueBuf.byteLength), 32);
        const encodedValueBuf = Buffer.concat([paddedLengthBuf, paddedValueBuf]);
        const encodedValue = ethUtil.bufferToHex(encodedValueBuf);

        this.assignHexValue(encodedValue);
    }

    public getSignature(): string {
        return 'bytes';
    }

    public isStatic(): boolean {
        return false;
    }

    public getHeaderSize(): BigNumber {
        return new BigNumber(0);
    }

    public getBodySize(): BigNumber {
        const valueBuf = ethUtil.toBuffer(this.getHexValue());
        const size = new BigNumber(valueBuf.byteLength);
        return size;
    }

    public static matchGrammar(type: string): boolean {
        return type === 'bytes';
    }
}

export class SolString extends DynamicDataType {
    constructor(dataItem: DataItem) {
        super(dataItem);
        expect(SolString.matchGrammar(dataItem.type)).to.be.true();
    }

    public assignValue(value: string) {
        const wordsForValue = Math.ceil(value.length / 32);
        const paddedBytesForValue = wordsForValue * 32;
        const valueBuf = ethUtil.setLengthRight(ethUtil.toBuffer(value), paddedBytesForValue);
        const lengthBuf = ethUtil.setLengthLeft(ethUtil.toBuffer(value.length), 32);
        const encodedValueBuf = Buffer.concat([lengthBuf, valueBuf]);
        const encodedValue = ethUtil.bufferToHex(encodedValueBuf);

        this.assignHexValue(encodedValue);
    }

    public getSignature(): string {
        return 'string';
    }

    public isStatic(): boolean {
        return false;
    }

    public getHeaderSize(): BigNumber {
        return new BigNumber(0);
    }

    public getBodySize(): BigNumber {
        const valueBuf = ethUtil.toBuffer(this.getHexValue());
        const size = new BigNumber(valueBuf.byteLength);
        return size;
    }

    public static matchGrammar(type: string): boolean {
        return type === 'string';
    }
}

export class SolArray extends DynamicDataType {
    static matcher = RegExp('^(.+)\\[([0-9]*)\\]$');
    static UNDEFINED_LENGTH = new BigNumber(-1);
    length: BigNumber = SolArray.UNDEFINED_LENGTH;
    type: string = '[undefined]';
    isLengthDefined: boolean;
    isStaticArray: boolean; // An array is dynamic if it's lenghth is undefined or if its children are dynamic.
    private elements: DataType[];

    /*
    --- Layout 1: Fixed Length Array with Static Types ---
    Elem1, Elem2, ..., ElemN

    --- Layout 2: Fixed Length Array with Dynamic Types ---
    PtrToArray, ..., Elem1, Elem2, ..., ElemN

    --- Layout 3: Dynamic Length Array with Static Types ---
    PtrToArray, ..., ArrayLength, Elem1, Elem2, ..., ElemN

    --- Layout 4: Dynamic Length Array with Dynamic Types ---
    PtrToArray, ..., ArrayLength, PtrToElem1, PtrToElem2, ..., PtrToElemN, ..., Elem1, Elem2, ..., ElemN
    */

    constructor(dataItem: DataItem) {
        super(dataItem);
        const matches = SolArray.matcher.exec(dataItem.type);
        expect(matches).to.be.not.null();
        console.log(JSON.stringify(matches));
        if (matches === null || matches.length !== 3) {
            throw new Error(`Could not parse array: ${dataItem.type}`);
        } else if (matches[1] === undefined) {
            throw new Error(`Could not parse array type: ${dataItem.type}`);
        } else if (matches[2] === undefined) {
            throw new Error(`Could not parse array length: ${dataItem.type}`);
        }

        this.elements = [];

        // Check if length is undefined
        if (matches[2] === '') {
            this.type = matches[1];
            this.length = SolArray.UNDEFINED_LENGTH;
            this.isLengthDefined = false;
            this.isStaticArray = false;
            return;
        }

        // Parse out array type/length and construct children
        this.isLengthDefined = true;
        this.type = matches[1];
        this.length = new BigNumber(matches[2], 10);
        if (this.length.lessThan(1)) {
            throw new Error(`Bad array length: ${JSON.stringify(this.length)}`);
        }
        this.constructChildren();

        // Check if we're static or not
        this.isStaticArray = !(this.elements[0] instanceof Pointer);  //this.elements[0].isStatic();
        //throw new Error(`Am I static? ${this.isStaticArray}`);
    }

    private constructChildren() {
        for (let idx = new BigNumber(0); idx.lessThan(this.length); idx = idx.plus(1)) {
            const childDataItem = {
                type: this.type,
                name: `${this.getDataItem().name}[${idx.toString(10)}]`,
            } as DataItem;
            const child = DataTypeFactory.create(childDataItem, this);
            this.elements.push(child);
            if (child instanceof Pointer) {
                const pointsTo = child.getChildren()[0];
                console.log(JSON.stringify(pointsTo));
                this.children.push(pointsTo); // DataType pointing to
            }
        }
    }

    // @TODO: HACKY -- shouldn't really have children for a 
    /*
    public getChildren(): DataType[] {
        if (this.isStatic()) {
            return [];
        } else {
            return this.children;
        }
    }*/

    public assignValue(value: any[]) {
        // Sanity check length
        const valueLength = new BigNumber(value.length);
        if (this.length !== SolArray.UNDEFINED_LENGTH && valueLength.equals(this.length) === false) {
            throw new Error(
                `Expected array of length ${JSON.stringify(this.length)}, but got array of length ${JSON.stringify(
                    valueLength,
                )}`,
            );
        }

        // Assign length if not already set
        if (this.length === SolArray.UNDEFINED_LENGTH) {
            this.length = valueLength;
            this.constructChildren();
        }

        // Assign values to children
        for (let idx = new BigNumber(0); idx.lessThan(this.length); idx = idx.plus(1)) {
            const idxNumber = idx.toNumber();
            this.elements[idxNumber].assignValue(value[idxNumber]);
        }
    }

    public getHexValue(): string {
        let valueBuf = new Buffer("");

        if (this.isLengthDefined === false) {
            // Must include the array length
            const lengthBufUnpadded = ethUtil.toBuffer(`0x${this.length.toString(16)}`);
            const lengthBuf = ethUtil.setLengthLeft(lengthBufUnpadded, 32);
            valueBuf = lengthBuf;
        }

        for (let idx = new BigNumber(0); idx.lessThan(this.length); idx = idx.plus(1)) {
            const idxNumber = idx.toNumber();
            const childValueHex = this.elements[idxNumber].getHexValue();
            const childValueBuf = ethUtil.toBuffer(childValueHex);
            valueBuf = Buffer.concat([valueBuf, childValueBuf]);
        }

        // Convert value buffer to hex
        const valueHex = ethUtil.bufferToHex(valueBuf);
        return valueHex;
    }

    public isStatic(): boolean {
        return this.isStaticArray;
    }

    public getHeaderSize(): BigNumber {
        let size = new BigNumber(0);
        if (!this.isLengthDefined) {
            size = new BigNumber(32); // stores length of bytes
        }
        return size;
    }

    public getBodySize(): BigNumber {
        const evmWordWidth = new BigNumber(32);
        const body = this.length.times(evmWordWidth);
        return body;
    }

    public static matchGrammar(type: string): boolean {
        return this.matcher.test(type);
    }

    public getSignature(): string {
        let type = this.type;
        if (this.type === 'tuple') {
            let tupleDataItem = {
                type: 'tuple',
                name: 'N/A',
            } as DataItem;
            const tupleComponents = this.getDataItem().components;
            if (tupleComponents !== undefined) {
                tupleDataItem.components = tupleComponents;
            }
            const tuple = new Tuple(tupleDataItem);
            type = tuple.getSignature();
        }

        if (this.length.equals(SolArray.UNDEFINED_LENGTH)) {
            return `${type}[]`;
        }
        return `${type}[${this.length}]`;
    }
}

export class Tuple extends DynamicDataType {
    private length: BigNumber;
    private childMap: { [key: string]: number };

    constructor(dataItem: DataItem) {
        super(dataItem);
        expect(Tuple.matchGrammar(dataItem.type)).to.be.true();
        this.length = new BigNumber(0);
        this.childMap = {};
        if (dataItem.components !== undefined) {
            this.constructChildren(dataItem.components);
            this.length = new BigNumber(dataItem.components.length);
        } else {
            throw new Error('Components undefined');
        }
    }

    private constructChildren(dataItems: DataItem[]) {
        _.each(dataItems, (dataItem: DataItem) => {
            const childDataItem = {
                type: dataItem.type,
                name: `${this.getDataItem().name}.${dataItem.name}`,
            } as DataItem;
            const child = DataTypeFactory.create(childDataItem, this);
            this.childMap[dataItem.name] = this.children.length;
            this.children.push(child);
        });
    }

    private assignValueFromArray(value: any[]) {
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
            this.children[idxNumber].assignValue(value[idxNumber]);
        }
    }

    private assignValueFromObject(obj: object) {
        let childMap = _.cloneDeep(this.childMap);
        _.forOwn(obj, (value: any, key: string) => {
            if (key in childMap === false) {
                throw new Error(`Could not assign tuple to object: unrecognized key '${key}'`);
            }
            this.children[this.childMap[key]].assignValue(value);
            delete childMap[key];
        });

        if (Object.keys(childMap).length !== 0) {
            throw new Error(`Could not assign tuple to object: missing keys ${Object.keys(childMap)}`);
        }
    }

    public assignValue(value: any[] | object) {
        if (value instanceof Array) {
            this.assignValueFromArray(value);
        } else if (typeof value === 'object') {
            this.assignValueFromObject(value);
        } else {
            throw new Error(`Unexpected type for ${value}`);
        }
    }

    public getHexValue(): string {
        return '0x';
    }

    public getHeaderSize(): BigNumber {
        return new BigNumber(0);
    }

    public getBodySize(): BigNumber {
        const evmWordWidth = new BigNumber(32);
        const size = this.length.times(evmWordWidth);
        return size;
    }

    public getSignature(): string {
        // Compute signature
        let signature = `(`;
        _.each(this.children, (child: DataType, i: number) => {
            signature += child.getSignature();
            if (i < this.children.length - 1) {
                signature += ',';
            }
        });
        signature += ')';
        return signature;
    }

    public isStatic(): boolean {
        return false; // @TODO: True in every case or only when dynamic data?
    }

    public static matchGrammar(type: string): boolean {
        return type === 'tuple';
    }
}

/* TODO
class Fixed extends StaticDataType {}

class UFixed extends StaticDataType {}*/

export class Pointer extends StaticDataType {
    destDataType: DynamicDataType;
    parentDataType: DataType;

    constructor(destDataType: DynamicDataType, parentDataType: DataType) {
        const destDataItem = destDataType.getDataItem();
        const dataItem = { name: `ptr<${destDataItem.name}>`, type: `ptr<${destDataItem.type}>` } as DataItem;
        super(dataItem);
        this.destDataType = destDataType;
        this.parentDataType = parentDataType;
        this.children.push(destDataType);
    }

    /*
    public assignValue(destDataType: DynamicDataType) {
        this.destDataType = destDataType;
    }*/

    public assignValue(value: any) {
        this.destDataType.assignValue(value);
    }

    public getHexValue(): string {
        console.log(
            '*'.repeat(40),
            this.destDataType.getAbsoluteOffset().toString(16),
            '^'.repeat(150),
            this.parentDataType.getAbsoluteOffset().toString(16),
        );

        let offset = this.destDataType
            .getAbsoluteOffset()
            .minus(this.parentDataType.getAbsoluteOffset())
            .minus(this.parentDataType.getHeaderSize());

        console.log("OFFSET == ", JSON.stringify(offset), " or in hex -- 0x", offset.toString(16));

        const hexBase = 16;
        const evmWordWidth = 32;
        const valueBuf = ethUtil.setLengthLeft(ethUtil.toBuffer(`0x${offset.toString(hexBase)}`), evmWordWidth);
        const encodedValue = ethUtil.bufferToHex(valueBuf);
        return encodedValue;
    }

    public getSignature(): string {
        return this.destDataType.getSignature();
    }

    public isStatic(): boolean {
        return true;
    }

    public getHeaderSize(): BigNumber {
        return new BigNumber(0);
    }

    public getBodySize(): BigNumber {
        return new BigNumber(32);
    }

}

export class DataTypeFactory {
    public static mapDataItemToDataType(dataItem: DataItem): DataType {
        console.log(`Type: ${dataItem.type}`);

        if (SolArray.matchGrammar(dataItem.type)) return new SolArray(dataItem);
        if (Address.matchGrammar(dataItem.type)) return new Address(dataItem);
        if (Bool.matchGrammar(dataItem.type)) return new Bool(dataItem);
        if (Int.matchGrammar(dataItem.type)) return new Int(dataItem);
        if (UInt.matchGrammar(dataItem.type)) return new UInt(dataItem);
        if (Byte.matchGrammar(dataItem.type)) return new Byte(dataItem);
        if (Tuple.matchGrammar(dataItem.type)) return new Tuple(dataItem);
        if (SolArray.matchGrammar(dataItem.type)) return new SolArray(dataItem);
        if (Bytes.matchGrammar(dataItem.type)) return new Bytes(dataItem);
        if (SolString.matchGrammar(dataItem.type)) return new SolString(dataItem);
        //if (Fixed.matchGrammar(dataItem.type)) return Fixed(dataItem);
        //if (UFixed.matchGrammar(dataItem.type)) return UFixed(dataItem);

        throw new Error(`Unrecognized data type: '${dataItem.type}'`);
    }

    public static create(dataItem: DataItem, parentDataType: DataType): DataType {
        const dataType = DataTypeFactory.mapDataItemToDataType(dataItem);
        if (dataType.isStatic()) {
            return dataType;
        } else {
            const pointer = new Pointer(dataType, parentDataType);
            return pointer;
        }

        throw new Error(`Unrecognized instance type: '${dataType}'`);
    }
}

class Queue<T> {
    private store: T[] = [];
    push(val: T) {
        this.store.push(val);
    }
    pop(): T | undefined {
        return this.store.shift();
    }
}

export class Method extends DataType {
    name: string;
    params: DataType[];
    private signature: string;
    selector: string;

    constructor(abi: MethodAbi) {
        super({ type: 'method', name: abi.name });
        this.name = abi.name;
        this.params = [];

        _.each(abi.inputs, (input: DataItem) => {
            this.params.push(DataTypeFactory.create(input, this));
        });

        // Compute signature
        this.signature = `${this.name}(`;
        _.each(this.params, (param: DataType, i: number) => {
            this.signature += param.getSignature();
            if (i < this.params.length - 1) {
                this.signature += ',';
            }
        });
        this.signature += ')';

        // Compute selector
        this.selector = ethUtil.bufferToHex(ethUtil.toBuffer(ethUtil.sha3(this.signature).slice(0, 4)));

        console.log(`--SIGNATURE--\n${this.signature}\n---------\n`);
        console.log(`--SELECTOR--\n${this.selector}\n---------\n`);
    }

    public getSignature(): string {
        return this.signature;
    }

    public assignValue(args: any[]) {
        _.each(this.params, (param: DataType, i: number) => {
            // Assign value to parameter
            try {
                param.assignValue(args[i]);
            } catch (e) {
                console.log('Failed to assign to ', param.getDataItem().name);
                throw e;
            }

            if (param instanceof Pointer) {
                this.children.push(param.getChildren()[0]);
            }
        });
    }

    public getHexValue(): string {
        let paramBufs: Buffer[] = [];
        _.each(this.params, (param: DataType) => {
            paramBufs.push(ethUtil.toBuffer(param.getHexValue()));
        });

        const value = Buffer.concat(paramBufs);
        const hexValue = ethUtil.bufferToHex(value);
        return hexValue;
    }

    public encode(args: any[]): string {
        this.assignValue(args);
        const calldata = new Calldata(this.selector, this.params.length);
        this.bind(calldata, CalldataSection.PARAMS);

        return calldata.getHexValue();
    }

    public isStatic(): boolean {
        return true;
    }

    public getHeaderSize(): BigNumber {
        // Exclude selector
        return new BigNumber(0);
    }

    public getBodySize(): BigNumber {
        const nParams = new BigNumber(this.params.length);
        const evmWordWidth = new BigNumber(32);
        const size = nParams.times(evmWordWidth);
        return size;
    }

    /*
    encodeOptimized(args: any[]): string {
        const calldata = new Memory();
        // Assign values
        optimizableParams : StaticDataType = [];
        _.each(this.params, function(args: any[], i: number, param: DataType) {
            param.assignValue(args[i]);
            if (param instanceof DynamicDataType) {

            }
        });

        // Find non-parameter leaves


        return '';
    } */

    /*
    decode(rawCalldata: string): any[] {
        const calldata = new Calldata(this.name, this.params.length);
        calldata.assignRaw(rawCalldata);
        let args: any[];
        let params = this.params;
        _.each(params, function(args: any[], i: number, param: DataType) {
            param.decodeFromCalldata(calldata);
            args.push(param.getValue());
        });

        return args;
    }*/
}