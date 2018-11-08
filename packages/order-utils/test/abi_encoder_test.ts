import * as chai from 'chai';
import 'mocha';
import ethUtil = require('ethereumjs-util');

var _ = require('lodash');

// import { assert } from '@0x/order-utils/src/assert';

import { chaiSetup } from './utils/chai_setup';

import { MethodAbi, DataItem } from 'ethereum-types';

import { BigNumber } from '@0x/utils';
import { assert } from '@0x/order-utils/src/assert';

const simpleAbi = {
    constant: false,
    inputs: [
        {
            name: 'greg',
            type: 'uint256',
        },
        {
            name: 'gregStr',
            type: 'string',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

const stringAbi = {
    constant: false,
    inputs: [
        {
            name: 'greg',
            type: 'string[]',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

const tupleAbi = {
    constant: false,
    inputs: [
        {
            components: [
                {
                    name: 'someUint',
                    type: 'uint256',
                },
                {
                    name: 'someStr',
                    type: 'string',
                },
            ],
            name: 'order',
            type: 'tuple',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

const staticArrayAbi = {
    constant: false,
    inputs: [
        {
            name: 'someStaticArray',
            type: 'uint8[3]',
        }
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

const crazyAbi = {
    constant: false,
    inputs: [
        /*{
            name: 'someUInt256',
            type: 'uint256',
        },
        {
            name: 'someInt256',
            type: 'int256',
        },
        {
            name: 'someInt32',
            type: 'int32',
        },
        {
            name: 'someByte',
            type: 'byte',
        },
        {
            name: 'someBytes32',
            type: 'bytes32',
        },
        {
            name: 'someBytes',
            type: 'bytes',
        },
        {
            name: 'someString',
            type: 'string',
        },*/
        /*{
            name: 'someAddress',
            type: 'address',
        },
        {
            name: 'someBool',
            type: 'bool',
        },*/

        {
            name: 'someStaticArray',
            type: 'uint8[3]',
        },
        {
            name: 'someStaticArrayWithDynamicMembers',
            type: 'string[2]',
        },
        {
            name: 'someDynamicArrayWithDynamicMembers',
            type: 'bytes[]',
        },
        {
            name: 'some2DArray',
            type: 'string[][]',
        },
        {
            name: 'someTuple',
            type: 'tuple',
            components: [
                {
                    name: 'someUint32',
                    type: 'uint32',
                },
                {
                    name: 'someStr',
                    type: 'string',
                },
            ],
        },
        {
            name: 'someTupleWithDynamicTypes',
            type: 'tuple',
            components: [
                {
                    name: 'someUint',
                    type: 'uint256',
                },
                {
                    name: 'someStr',
                    type: 'string',
                },
                //{
                //      name: 'someStrArray',
                //     type: 'string[]',
                /// },
                {
                    name: 'someBytes',
                    type: 'bytes',
                },
                {
                    name: 'someAddress',
                    type: 'address',
                },
            ],
        } /*,
        {
            name: 'someArrayOfTuplesWithDynamicTypes',
            type: 'tuple[]',
            components: [
                {
                    name: 'someUint',
                    type: 'uint256',
                },
                {
                    name: 'someStr',
                    type: 'string',
                },
                {
                    name: 'someStrArray',
                    type: 'string[]',
                },
                {
                    name: 'someBytes',
                    type: 'bytes',
                },
                {
                    name: 'someAddress',
                    type: 'address',
                },
            ],
        },*/,
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

const simpleAbi2 = {
    constant: false,
    inputs: [
        {
            name: 'someByte',
            type: 'byte',
        },
        {
            name: 'someBytes32',
            type: 'bytes32',
        },
        {
            name: 'someBytes',
            type: 'bytes',
        },
        {
            name: 'someString',
            type: 'string',
        },
    ],
    name: 'simpleFunction',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

const fillOrderAbi = {
    constant: false,
    inputs: [
        {
            components: [
                {
                    name: 'makerAddress',
                    type: 'address',
                },
                {
                    name: 'takerAddress',
                    type: 'address',
                },
                {
                    name: 'feeRecipientAddress',
                    type: 'address',
                },
                {
                    name: 'senderAddress',
                    type: 'address',
                },
                {
                    name: 'makerAssetAmount',
                    type: 'uint256',
                },
                {
                    name: 'takerAssetAmount',
                    type: 'uint256',
                },
                {
                    name: 'makerFee',
                    type: 'uint256',
                },
                {
                    name: 'takerFee',
                    type: 'uint256',
                },
                {
                    name: 'expirationTimeSeconds',
                    type: 'uint256',
                },
                {
                    name: 'salt',
                    type: 'uint256',
                },
                {
                    name: 'makerAssetData',
                    type: 'bytes',
                },
                {
                    name: 'takerAssetData',
                    type: 'bytes',
                },
            ],
            name: 'order',
            type: 'tuple',
        },
        {
            name: 'takerAssetFillAmount',
            type: 'uint256',
        },
        {
            name: 'salt',
            type: 'uint256',
        },
        {
            name: 'orderSignature',
            type: 'bytes',
        },
        {
            name: 'takerSignature',
            type: 'bytes',
        },
    ],
    name: 'fillOrder',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
} as MethodAbi;

chaiSetup.configure();
const expect = chai.expect;

namespace AbiEncoder {
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
            console.log(this.selector);
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

        public getSize(): BigNumber {
            if (this.memblock === undefined) return new BigNumber(0);
            return this.memblock.getSize();
        }

        public getChildren(): DataType[] {
            return this.children;
        }

        public abstract assignValue(value: any): void;
        public abstract getSignature(): string;
        public abstract isStatic(): boolean;
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

            // Check if length is undefined
            if (matches[2] === '') {
                this.type = matches[1];
                this.length = SolArray.UNDEFINED_LENGTH;
                this.isLengthDefined = false;
                return;
            }

            // Parse out array type/length and construct children
            this.isLengthDefined = true;
            this.type = matches[1];
            this.length = new BigNumber(matches[2], 10);
            if (this.length.lessThan(0)) {
                throw new Error(`Bad array length: ${JSON.stringify(this.length)}`);
            }
            this.constructChildren();
        }

        private constructChildren() {
            for (let idx = new BigNumber(0); idx.lessThan(this.length); idx = idx.plus(1)) {
                const childDataItem = {
                    type: this.type,
                    name: `${this.getDataItem().name}[${idx.toString(10)}]`,
                } as DataItem;
                const child = DataTypeFactory.create(childDataItem, this);
                this.children.push(child);
            }
        }

        // @TODO: HACKY -- shouldn't really have children for a 
        public getChildren(): DataType[] {
            if (this.isStatic()) {
                return [];
            } else {
                return this.children;
            }
        }

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
                this.children[idxNumber].assignValue(value[idxNumber]);
            }
        }

        private getHexValueDynamicArray(): string {
            const lengthBufUnpadded = ethUtil.toBuffer(`0x${this.length.toString(16)}`);
            const lengthBuf = ethUtil.setLengthLeft(lengthBufUnpadded, 32);
            let valueBuf = lengthBuf;

            const valueHex = ethUtil.bufferToHex(valueBuf);
            return valueHex;
        }

        private getHexValueStaticArray(): string {
            let valueBuf = new Buffer("");

            for (let idx = new BigNumber(0); idx.lessThan(this.length); idx = idx.plus(1)) {
                const idxNumber = idx.toNumber();
                const childValueHex = this.children[idxNumber].getHexValue();
                const childValueBuf = ethUtil.toBuffer(childValueHex);
                valueBuf = Buffer.concat([valueBuf, childValueBuf]);

                console.log(JSON.stringify(idx));
            }

            // Convert value buffer to hex
            const valueHex = ethUtil.bufferToHex(valueBuf);
            return valueHex;
        }

        public getHexValue(): string {
            if (this.isLengthDefined) {
                return this.getHexValueStaticArray();
            } else {
                return this.getHexValueDynamicArray();
            }
        }

        public isStatic(): boolean {
            return this.isLengthDefined;
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
                .minus(this.parentDataType.getAbsoluteOffset().plus(this.parentDataType.getSize()));
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

        public encodeToCalldata(calldata: Calldata): void {
            throw 2;
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
            const calldata = new Calldata(this.selector, this.params.length);
            const params = this.params;
            const paramQueue = new Queue<DataType>();
            _.each(params, (param: DataType, i: number) => {
                try {
                    param.assignValue(args[i]);
                } catch (e) {
                    console.log('Failed to assign to ', param.getDataItem().name);
                    throw e;
                }
                param.bind(calldata, CalldataSection.PARAMS);
                _.each(param.getChildren(), (child: DataType) => {
                    paramQueue.push(child);
                });
            });

            let param: DataType | undefined = undefined;
            while ((param = paramQueue.pop()) !== undefined) {
                param.bind(calldata, CalldataSection.DATA);
                _.each(param.getChildren(), (child: DataType) => {
                    paramQueue.push(child);
                });
            }

            console.log(calldata);

            this.assignHexValue(calldata.getHexValue());

            //return calldata.getRaw();
        }

        public encode(args: any[]): string {
            this.assignValue(args);
            return this.getHexValue();
        }

        public isStatic(): boolean {
            return true;
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
}

describe.only('ABI Encoder', () => {
    describe.only('Just a Greg, Eh', () => {
        it('Crazy ABI', async () => {
            const method = new AbiEncoder.Method(crazyAbi);
            console.log(method.getSignature());

            const args = [[new BigNumber(127), new BigNumber(14), new BigNumber(54)],
            [
                'the little piping piper piped a piping pipper papper',
                'the kid knows how to write poems, what can I say -- I guess theres a lot I could say to try to fill this line with a lot of text.',
            ], // l
            [
                '0x38745637834987324827439287423897238947239847',
                '0x7283472398237423984723984729847248927498748974284728947239487498749847874329423743492347329847239842374892374892374892347238947289478947489374289472894738942749823743298742389472389473289472389437249823749823742893472398',
                '0x283473298473248923749238742398742398472894729843278942374982374892374892743982',
            ], // m
            [
                [
                    'some string',
                    'some another string',
                    'there are just too many stringsup in',
                    'here',
                    'yall ghonna make me lose my mind',
                ],
                [
                    'the little piping piper piped a piping pipper papper',
                    'the kid knows how to write poems, what can I say -- I guess theres a lot I could say to try to fill this line with a lot of text.',
                ],
                [],
            ], // n
            [
                new BigNumber(4037824789),
                'the kid knows how to write poems, what can I say -- I guess theres a lot I could say to try to fill this line with a lot of text.',
            ], // o
            [
                new BigNumber('239048320948320948230', 10),
                'akdhjasjkdhasjkldshdjahdkjsahdajksdhsajkdhsajkdhadjkashdjksadhajkdhsajkdhsadjk',
                /*[
                    [
                        '23432423342',
                        'skdjfhdsjkfdhsfkjsdhfjkdshfdsjkfhsdjkfhsdjkfhdsjkfhdsjfhsdfjdshjkfsdhf',
                        'sdfsdfdfdffsdf',
                    ],
                    [],
                    [],
                    ['23ehsdjkfhsiufhwfuefhesfhauhesufheuifhsefushfsufehfeuif'],
                ],*/
                '0xf74848484848484848484848484848484848483847576879809433994458585848932091',
                '0xe41d2489571d322189246dafa5ebde1f4699f498',
            ], // p
                /*[
                    [
                        new BigNumber('23904848320948230', 10),
                        'akdhjasshdjahdkjsahdajksdhsajkdhsajkdhadjkashdjksadhajkdhsajkdhsadjk',
                        [
                            [
                                '234324342',
                                'skdjfhdsjkfdhsfkjsjkfhsdjkfhsdjkfhdsjkfhdsjfhsdfjdshjkfsdhf',
                                'sdffdfdffsdf',
                            ],
                            [],
                            [],
                            ['23ehsdjkfhsiufhwfuefsufheuifhsefushfsufehfeuif'],
                        ],
                        '0xf7484848484848484848484848484876879809433994458585848932091',
                        '0xe41d2489571d322189246dafa6ebde1f4699f498',
                    ],
                    [
                        new BigNumber('23904832094832030', 10),
                        'akdhjasjkdhasjkldshdjahdkjsahdajksdhsajkdhsajkdhadjkashdkdhsajkdhsadjk',
                        [
                            [
                                '2343342',
                                'skdjfhdsjkfdhsfkjsdhfjkdshfdsjkfhsdjkfhsdjkfhdssjfhsdfjdshjkfsdhf',
                                'sdfsdfdfdffsf',
                            ],
                            [],
                            [],
                            ['jkfhsiufhwfuefhesfhauhesufhefeuif'],
                        ],
                        '0xf7484848484848484848484848484848484848384757687980943091',
                        '0xe41d2489571d322189246dafa5ebde1f469af498',
                    ],
                    [],
                    [],
                ],*/
            ];

            const calldata = method.encode(args);
            console.log(calldata);
            console.log('*'.repeat(40));
            console.log(JSON.stringify(args));
            console.log(method.getSignature());

            /*
            const expectedCalldata =
                '0x30e1f844000000000000000000000000000000000000000000000000000000000000007f000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000003600000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000260000000000000000000000000000000000000000000000000000000000000042000000000000000000000000000000000000000000000000000000000000008600000000000000000000000000000000000000000000000000000000000000960000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000034746865206c6974746c6520706970696e67207069706572207069706564206120706970696e6720706970706572207061707065720000000000000000000000000000000000000000000000000000000000000000000000000000000000000081746865206b6964206b6e6f777320686f7720746f20777269746520706f656d732c20776861742063616e204920736179202d2d2049206775657373207468657265732061206c6f74204920636f756c642073617920746f2074727920746f2066696c6c2074686973206c696e6520776974682061206c6f74206f6620746578742e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000163874563783498732482743928742389723894723984700000000000000000000000000000000000000000000000000000000000000000000000000000000006e72834723982374239847239847298472489274987489742847289472394874987498478743294237434923473298472398423748923748923748923472389472894789474893742894728947389427498237432987423894723894732894723894372498237498237428934723980000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000027283473298473248923749238742398742398472894729843278942374982374892374892743982000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000002800000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000000000000000000000000000000000000000000b736f6d6520737472696e670000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000013736f6d6520616e6f7468657220737472696e67000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024746865726520617265206a75737420746f6f206d616e7920737472696e6773757020696e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000046865726500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002079616c6c2067686f6e6e61206d616b65206d65206c6f7365206d79206d696e640000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000034746865206c6974746c6520706970696e67207069706572207069706564206120706970696e6720706970706572207061707065720000000000000000000000000000000000000000000000000000000000000000000000000000000000000081746865206b6964206b6e6f777320686f7720746f20777269746520706f656d732c20776861742063616e204920736179202d2d2049206775657373207468657265732061206c6f74204920636f756c642073617920746f2074727920746f2066696c6c2074686973206c696e6520776974682061206c6f74206f6620746578742e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f0ac511500000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000081746865206b6964206b6e6f777320686f7720746f20777269746520706f656d732c20776861742063616e204920736179202d2d2049206775657373207468657265732061206c6f74204920636f756c642073617920746f2074727920746f2066696c6c2074686973206c696e6520776974682061206c6f74206f6620746578742e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000cf5763d5ec63d500600000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000100000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498000000000000000000000000000000000000000000000000000000000000004e616b64686a61736a6b646861736a6b6c647368646a6168646b6a73616864616a6b73646873616a6b646873616a6b646861646a6b617368646a6b73616468616a6b646873616a6b64687361646a6b0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024f7484848484848484848484848484848484848384757687980943399445858584893209100000000000000000000000000000000000000000000000000000000';
            expect(calldata).to.be.equal(expectedCalldata);*/

            /*const calldata = method.encode([{ someUint: new BigNumber(5), someStr: 'five' }]);
            console.log(method.getSignature());
            console.log(method.selector);

            console.log(calldata);
            const expectedCalldata =
                '0x5b998f3500000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000046669766500000000000000000000000000000000000000000000000000000000';
            expect(calldata).to.be.equal(expectedCalldata);*/
        });

        it.only('Static Array ABI', async () => {
            const method = new AbiEncoder.Method(staticArrayAbi);
            const args = [[new BigNumber(127), new BigNumber(14), new BigNumber(54)]];
            const calldata = method.encode(args);
            console.log(calldata);
            console.log('*'.repeat(40));
            console.log(JSON.stringify(args));
            const expectedCalldata =
                '0xf68ade72000000000000000000000000000000000000000000000000000000000000007f000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000036';
            expect(calldata).to.be.equal(expectedCalldata);
        });

        it('Simple ABI 2', async () => {
            const method = new AbiEncoder.Method(simpleAbi2);

            const args = [
                '0xaf', // e (bytes1)
                '0x0001020304050607080911121314151617181920212223242526272829303132', // f (bytes32)
                '0x616161616161616161616161616161616161616161616161616161616161616161616161616161611114f324567838475647382938475677448899338457668899002020202020', // g
                'My first name is Greg and my last name is Hysen, what do ya know!', // h
            ];

            const calldata = method.encode(args);
            const expectedCalldata =
                '0x7ac2bd96af000000000000000000000000000000000000000000000000000000000000000001020304050607080911121314151617181920212223242526272829303132000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000047616161616161616161616161616161616161616161616161616161616161616161616161616161611114f3245678384756473829384756774488993384576688990020202020200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000414d79206669727374206e616d65206973204772656720616e64206d79206c617374206e616d6520697320487973656e2c207768617420646f207961206b6e6f772100000000000000000000000000000000000000000000000000000000000000';
            expect(calldata).to.be.equal(expectedCalldata);
        });

        it('Yessir', async () => {
            const method = new AbiEncoder.Method(simpleAbi);
            const calldata = method.encode([new BigNumber(5), 'five']);
            console.log(calldata);
            expect(true).to.be.true();
        });

        it('Array ABI', async () => {
            const method = new AbiEncoder.Method(stringAbi);
            const calldata = method.encode([['five', 'six', 'seven']]);
            console.log(method.getSignature());
            console.log(method.selector);

            console.log(calldata);
            const expectedCalldata =
                '0x13e751a900000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000046669766500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000373697800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005736576656e000000000000000000000000000000000000000000000000000000';
            expect(calldata).to.be.equal(expectedCalldata);
        });

        it('Object ABI (Array input)', async () => {
            const method = new AbiEncoder.Method(tupleAbi);
            const calldata = method.encode([[new BigNumber(5), 'five']]);
            console.log(method.getSignature());
            console.log(method.selector);

            console.log(calldata);
            const expectedCalldata =
                '0x5b998f3500000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000046669766500000000000000000000000000000000000000000000000000000000';
            expect(calldata).to.be.equal(expectedCalldata);
        });

        it('Object ABI (Object input)', async () => {
            const method = new AbiEncoder.Method(tupleAbi);
            const calldata = method.encode([{ someUint: new BigNumber(5), someStr: 'five' }]);
            console.log(method.getSignature());
            console.log(method.selector);

            console.log(calldata);
            const expectedCalldata =
                '0x5b998f3500000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000046669766500000000000000000000000000000000000000000000000000000000';
            expect(calldata).to.be.equal(expectedCalldata);
        });

        it.skip('Object ABI (Object input - Missing Key)', async () => {
            const method = new AbiEncoder.Method(tupleAbi);
            const calldata = method.encode([{ someUint: new BigNumber(5) }]);
            console.log(method.getSignature());
            console.log(method.selector);

            console.log(calldata);
            const expectedCalldata =
                '0x5b998f3500000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000046669766500000000000000000000000000000000000000000000000000000000';

            // @TODO: Figure out how to catch throw
            expect(calldata).to.be.equal(expectedCalldata);
        });

        it.skip('Object ABI (Object input - Too Many Keys)', async () => {
            const method = new AbiEncoder.Method(tupleAbi);
            const calldata = method.encode([{ someUint: new BigNumber(5), someStr: 'five', unwantedKey: 14 }]);
            console.log(method.getSignature());
            console.log(method.selector);

            console.log(calldata);
            const expectedCalldata =
                '0x5b998f3500000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000046669766500000000000000000000000000000000000000000000000000000000';

            // @TODO: Figure out how to catch throw
            expect(calldata).to.be.equal(expectedCalldata);
        });
    });

    describe('Array', () => {
        it('sample', async () => {
            const testDataItem = { name: 'testArray', type: 'int[2]' };
            const dataType = new AbiEncoder.SolArray(testDataItem);
            console.log(JSON.stringify(dataType, null, 4));
            console.log('*'.repeat(60));
            dataType.assignValue([new BigNumber(5), new BigNumber(6)]);
            console.log(JSON.stringify(dataType, null, 4));
            const hexValue = dataType.getHexValue();
            console.log('*'.repeat(60));
            console.log(hexValue);
        });

        it('sample undefined size', async () => {
            const testDataItem = { name: 'testArray', type: 'int[]' };
            const dataType = new AbiEncoder.SolArray(testDataItem);
            console.log(JSON.stringify(dataType, null, 4));
            console.log('*'.repeat(60));
            dataType.assignValue([new BigNumber(5), new BigNumber(6)]);
            console.log(JSON.stringify(dataType, null, 4));
            const hexValue = dataType.getHexValue();
            console.log('*'.repeat(60));
            console.log(hexValue);
        });

        it('sample dynamic types', async () => {
            const testDataItem = { name: 'testArray', type: 'string[]' };
            const dataType = new AbiEncoder.SolArray(testDataItem);
            console.log(JSON.stringify(dataType, null, 4));
            console.log('*'.repeat(60));
            dataType.assignValue(['five', 'six', 'seven']);
            console.log(JSON.stringify(dataType, null, 4));
            const hexValue = dataType.getHexValue();
            console.log('*'.repeat(60));
            console.log(hexValue);
            const calldata = new AbiEncoder.Calldata('0x01020304', 1);
            dataType.bind(calldata, AbiEncoder.CalldataSection.PARAMS);
            console.log('*'.repeat(60));
            console.log(calldata.getHexValue());
        });
    });

    describe('Address', () => {
        const testAddressDataItem = { name: 'testAddress', type: 'address' };
        it('Valid Address', async () => {
            const addressDataType = new AbiEncoder.Address(testAddressDataItem);
            addressDataType.assignValue('0xe41d2489571d322189246dafa5ebde1f4699f498');
            const expectedAbiEncodedAddress = '0x000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498';

            console.log(addressDataType.getHexValue());
            console.log(expectedAbiEncodedAddress);
            expect(addressDataType.getHexValue()).to.be.equal(expectedAbiEncodedAddress);
        });
    });

    describe('Bool', () => {
        const testBoolDataItem = { name: 'testBool', type: 'bool' };
        it('True', async () => {
            const boolDataType = new AbiEncoder.Bool(testBoolDataItem);
            boolDataType.assignValue(true);
            const expectedAbiEncodedBool = '0x0000000000000000000000000000000000000000000000000000000000000001';
            expect(boolDataType.getHexValue()).to.be.equal(expectedAbiEncodedBool);
        });

        it('False', async () => {
            const boolDataType = new AbiEncoder.Bool(testBoolDataItem);
            boolDataType.assignValue(false);
            const expectedAbiEncodedBool = '0x0000000000000000000000000000000000000000000000000000000000000000';
            expect(boolDataType.getHexValue()).to.be.equal(expectedAbiEncodedBool);
        });
    });

    describe('Integer', () => {
        const testIntDataItem = { name: 'testInt', type: 'int' };
        it('Positive - Base case', async () => {
            const intDataType = new AbiEncoder.Int(testIntDataItem);
            intDataType.assignValue(new BigNumber(1));
            const expectedAbiEncodedInt = '0x0000000000000000000000000000000000000000000000000000000000000001';
            expect(intDataType.getHexValue()).to.be.equal(expectedAbiEncodedInt);
        });

        it('Positive', async () => {
            const intDataType = new AbiEncoder.Int(testIntDataItem);
            intDataType.assignValue(new BigNumber(437829473));
            const expectedAbiEncodedInt = '0x000000000000000000000000000000000000000000000000000000001a18bf61';
            expect(intDataType.getHexValue()).to.be.equal(expectedAbiEncodedInt);
        });

        it('Negative - Base case', async () => {
            const intDataType = new AbiEncoder.Int(testIntDataItem);
            intDataType.assignValue(new BigNumber(-1));
            const expectedAbiEncodedInt = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
            expect(intDataType.getHexValue()).to.be.equal(expectedAbiEncodedInt);
        });

        it('Negative', async () => {
            const intDataType = new AbiEncoder.Int(testIntDataItem);
            intDataType.assignValue(new BigNumber(-437829473));
            const expectedAbiEncodedInt = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffe5e7409f';
            expect(intDataType.getHexValue()).to.be.equal(expectedAbiEncodedInt);
        });

        // TODO: Add bounds tests + tests for different widths
    });

    describe('Unsigned Integer', () => {
        const testIntDataItem = { name: 'testUInt', type: 'uint' };
        it('Lower Bound', async () => {
            const uintDataType = new AbiEncoder.UInt(testIntDataItem);
            uintDataType.assignValue(new BigNumber(0));
            const expectedAbiEncodedUInt = '0x0000000000000000000000000000000000000000000000000000000000000000';
            expect(uintDataType.getHexValue()).to.be.equal(expectedAbiEncodedUInt);
        });

        it('Base Case', async () => {
            const uintDataType = new AbiEncoder.UInt(testIntDataItem);
            uintDataType.assignValue(new BigNumber(1));
            const expectedAbiEncodedUInt = '0x0000000000000000000000000000000000000000000000000000000000000001';
            expect(uintDataType.getHexValue()).to.be.equal(expectedAbiEncodedUInt);
        });

        it('Random value', async () => {
            const uintDataType = new AbiEncoder.UInt(testIntDataItem);
            uintDataType.assignValue(new BigNumber(437829473));
            const expectedAbiEncodedUInt = '0x000000000000000000000000000000000000000000000000000000001a18bf61';
            expect(uintDataType.getHexValue()).to.be.equal(expectedAbiEncodedUInt);
        });

        // TODO: Add bounds tests + tests for different widths
    });

    describe('Static Bytes', () => {
        it('Byte (padded)', async () => {
            const testByteDataItem = { name: 'testStaticBytes', type: 'byte' };
            const byteDataType = new AbiEncoder.Byte(testByteDataItem);
            byteDataType.assignValue('0x05');
            const expectedAbiEncodedByte = '0x0500000000000000000000000000000000000000000000000000000000000000';
            expect(byteDataType.getHexValue()).to.be.equal(expectedAbiEncodedByte);
        });

        it.skip('Byte (no padding)', async () => {
            const testByteDataItem = { name: 'testStaticBytes', type: 'byte' };
            const byteDataType = new AbiEncoder.Byte(testByteDataItem);

            // @TODO: This does not catch the Error
            expect(byteDataType.assignValue('0x5')).to.throw();
        });

        it('Bytes1', async () => {
            const testByteDataItem = { name: 'testStaticBytes', type: 'bytes1' };
            const byteDataType = new AbiEncoder.Byte(testByteDataItem);
            byteDataType.assignValue('0x05');
            const expectedAbiEncodedByte = '0x0500000000000000000000000000000000000000000000000000000000000000';
            expect(byteDataType.getHexValue()).to.be.equal(expectedAbiEncodedByte);
        });

        it('Bytes32 (padded)', async () => {
            const testByteDataItem = { name: 'testStaticBytes', type: 'bytes32' };
            const byteDataType = new AbiEncoder.Byte(testByteDataItem);
            byteDataType.assignValue('0x0001020304050607080911121314151617181920212223242526272829303132');
            const expectedAbiEncodedByte = '0x0001020304050607080911121314151617181920212223242526272829303132';
            expect(byteDataType.getHexValue()).to.be.equal(expectedAbiEncodedByte);
        });

        it('Bytes32 (unpadded)', async () => {
            const testByteDataItem = { name: 'testStaticBytes', type: 'bytes32' };
            const byteDataType = new AbiEncoder.Byte(testByteDataItem);
            byteDataType.assignValue('0x1a18bf61');
            const expectedAbiEncodedByte = '0x1a18bf6100000000000000000000000000000000000000000000000000000000';
            expect(byteDataType.getHexValue()).to.be.equal(expectedAbiEncodedByte);
        });

        it.skip('Bytes32 - Too long', async () => {
            const testByteDataItem = { name: 'testStaticBytes', type: 'bytes32' };
            const byteDataType = new AbiEncoder.Byte(testByteDataItem);

            // @TODO: This does not catch the Error
            expect(
                byteDataType.assignValue('0x000102030405060708091112131415161718192021222324252627282930313233'),
            ).to.throw(
                `Tried to assign 0x000102030405060708091112131415161718192021222324252627282930313233 (33 bytes), which exceeds max bytes that can be stored in a bytes32`,
            );
        });
    });

    describe('Bytes (Dynamic)', () => {
        const testBytesDataItem = { name: 'testBytes', type: 'bytes' };
        it('Less than 32 bytes', async () => {
            const bytesDataType = new AbiEncoder.Bytes(testBytesDataItem);
            bytesDataType.assignValue('0x010203');
            const expectedAbiEncodedBytes =
                '0x00000000000000000000000000000000000000000000000000000000000000030102030000000000000000000000000000000000000000000000000000000000';

            expect(bytesDataType.getHexValue()).to.be.equal(expectedAbiEncodedBytes);
        });

        it('Greater than 32 bytes', async () => {
            const bytesDataType = new AbiEncoder.Bytes(testBytesDataItem);
            const testValue = '0x' + '61'.repeat(40);
            bytesDataType.assignValue(testValue);
            const expectedAbiEncodedBytes =
                '0x000000000000000000000000000000000000000000000000000000000000002861616161616161616161616161616161616161616161616161616161616161616161616161616161000000000000000000000000000000000000000000000000';
            expect(bytesDataType.getHexValue()).to.be.equal(expectedAbiEncodedBytes);
        });

        // @TODO: Add test for throw on half-byte
        // @TODO: Test with no 0x prefix
        // @TODO: Test with Buffer as input
    });

    describe('String', () => {
        const testStringDataItem = { name: 'testString', type: 'string' };
        it('Less than 32 bytes', async () => {
            const stringDataType = new AbiEncoder.SolString(testStringDataItem);
            stringDataType.assignValue('five');
            const expectedAbiEncodedString =
                '0x00000000000000000000000000000000000000000000000000000000000000046669766500000000000000000000000000000000000000000000000000000000';

            console.log(stringDataType.getHexValue());
            console.log(expectedAbiEncodedString);
            expect(stringDataType.getHexValue()).to.be.equal(expectedAbiEncodedString);
        });

        it('Greater than 32 bytes', async () => {
            const stringDataType = new AbiEncoder.SolString(testStringDataItem);
            const testValue = 'a'.repeat(40);
            stringDataType.assignValue(testValue);
            const expectedAbiEncodedString =
                '0x000000000000000000000000000000000000000000000000000000000000002861616161616161616161616161616161616161616161616161616161616161616161616161616161000000000000000000000000000000000000000000000000';
            expect(stringDataType.getHexValue()).to.be.equal(expectedAbiEncodedString);
        });
    });
});
