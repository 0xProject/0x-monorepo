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

    enum CalldataSection {
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

    class Calldata {
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
                    this.currentParamOffset = this.currentParamOffset.plus(memblock.getSize());
                    break;

                case CalldataSection.DATA:
                    this.data.push(memblock);
                    memblock.assignLocation(section, this.dataOffset, this.currentDataOffset);
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
            if (this.memblock === undefined) {
                calldata.bind(this, section);
            }
            _.each(this.children, (child: DataType) => {
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

        public abstract assignValue(value: any): void;
        public abstract getSignature(): string;
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

        static DEFAULT_WIDTH = new BigNumber(1);
        width: BigNumber = Byte.DEFAULT_WIDTH;

        constructor(dataItem: DataItem) {
            super(dataItem);
            const matches = Byte.matcher.exec(dataItem.type);
            expect(matches).to.be.not.null();
            if (matches !== null && matches.length === 2) {
                this.width = new BigNumber(matches[1], 10);
            }
        }

        public assignValue(value: string) {
            //const hexValue = ethUtil.bufferToHex(new Buffer(value));
            //this.assignHexValue(hexValue);
        }

        public getSignature(): string {
            throw 1;
        }

        public encodeToCalldata(calldata: Calldata): void {
            throw 2;
        }

        public static matchGrammar(type: string): boolean {
            return this.matcher.test(type);
        }
    }

    export class Tuple extends DynamicDataType {
        constructor(dataItem: DataItem) {
            super(dataItem);
            expect(Tuple.matchGrammar(dataItem.type)).to.be.true();
        }

        public assignValue(value: string) {
            //const hexValue = ethUtil.bufferToHex(new Buffer(value));
            //this.assignHexValue(hexValue);
        }

        public getSignature(): string {
            throw 1;
        }

        public encodeToCalldata(calldata: Calldata): void {
            throw 2;
        }

        public static matchGrammar(type: string): boolean {
            return type === 'tuple';
        }
    }

    export class Bytes extends StaticDataType {
        static UNDEFINED_LENGTH = new BigNumber(-1);
        length: BigNumber = SolArray.UNDEFINED_LENGTH;

        constructor(dataItem: DataItem) {
            super(dataItem);
            expect(Bytes.matchGrammar(dataItem.type)).to.be.true();
        }

        public assignValue(value: string) {
            //const hexValue = ethUtil.bufferToHex(new Buffer(value));
            //this.assignHexValue(hexValue);
        }

        public getSignature(): string {
            throw 1;
        }

        public encodeToCalldata(calldata: Calldata): void {
            throw 2;
        }

        public static matchGrammar(type: string): boolean {
            return type === 'bytes';
        }
    }

    export class SolArray extends DynamicDataType {
        static matcher = RegExp('^.+\\[([0-9]d*)\\]$');
        static UNDEFINED_LENGTH = new BigNumber(-1);
        length: BigNumber = SolArray.UNDEFINED_LENGTH;

        constructor(dataItem: DataItem) {
            super(dataItem);
            const matches = SolArray.matcher.exec(dataItem.type);
            expect(matches).to.be.not.null();
            if (matches !== null && matches.length === 1) {
                this.length = new BigNumber(matches[1], 10);
            }
        }

        public assignValue(value: string) {
            //const hexValue = ethUtil.bufferToHex(new Buffer(value));
            //this.assignHexValue(hexValue);
        }

        public encodeToCalldata(calldata: Calldata): void {
            throw 2;
        }

        public static matchGrammar(type: string): boolean {
            return this.matcher.test(type);
        }

        public getSignature(): string {
            throw 1;
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

        public encodeToCalldata(calldata: Calldata): void {}

        public static matchGrammar(type: string): boolean {
            return type === 'string';
        }
    }

    /* TODO
    class Fixed extends StaticDataType {}

    class UFixed extends StaticDataType {}*/

    export class Pointer extends StaticDataType {
        destDataType: DynamicDataType;

        constructor(destDataType: DynamicDataType) {
            const destDataItem = destDataType.getDataItem();
            const dataItem = { name: `ptr<${destDataItem.name}>`, type: `ptr<${destDataItem.type}>` } as DataItem;
            super(dataItem);
            this.destDataType = destDataType;
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
            let offset = new BigNumber(0);
            if (this.memblock !== undefined) {
                switch (this.memblock.getSection()) {
                    case CalldataSection.PARAMS:
                        offset = this.destDataType.getAbsoluteOffset();
                        break;
                    case CalldataSection.DATA:
                        offset = this.destDataType.getOffset();
                        break;
                }
            }

            const hexBase = 16;
            const evmWordWidth = 32;
            const valueBuf = ethUtil.setLengthLeft(ethUtil.toBuffer(`0x${offset.toString(hexBase)}`), evmWordWidth);
            const encodedValue = ethUtil.bufferToHex(valueBuf);
            return encodedValue;
        }

        public getSignature(): string {
            return this.destDataType.getSignature();
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

        public static create(dataItem: DataItem): DataType {
            const dataType = DataTypeFactory.mapDataItemToDataType(dataItem);
            if (dataType instanceof StaticDataType) {
                return dataType;
            } else if (dataType instanceof DynamicDataType) {
                const pointer = new Pointer(dataType);
                return pointer;
            }

            throw new Error(`Unrecognized instance type: '${dataType}'`);
        }
    }

    export class Method {
        name: string;
        params: DataType[];
        signature: string;
        selector: string;

        constructor(abi: MethodAbi) {
            // super();
            this.name = abi.name;
            this.params = [];

            _.each(abi.inputs, (input: DataItem) => {
                this.params.push(DataTypeFactory.create(input));
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

        encode(args: any[]): string {
            const calldata = new Calldata(this.selector, this.params.length);
            const params = this.params;
            _.each(params, (param: DataType, i: number) => {
                param.assignValue(args[i]);
                param.bind(calldata, CalldataSection.PARAMS);
            });

            console.log(calldata);

            return calldata.getHexValue();

            //return calldata.getRaw();
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
        it('Yessir', async () => {
            const method = new AbiEncoder.Method(simpleAbi);
            const calldata = method.encode([new BigNumber(5), 'five']);
            console.log(calldata);
            expect(true).to.be.true();
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

    describe.only('Integer', () => {
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
