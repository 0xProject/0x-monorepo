import { DataType, DataTypeFactory, DataTypeFactoryImpl, PayloadDataType, DependentDataType, MemberDataType } from './data_type';

import { DecodingRules, EncodingRules } from './calldata';

import { MethodAbi, DataItem } from 'ethereum-types';

import ethUtil = require('ethereumjs-util');

import { Calldata, RawCalldata } from './calldata';

import { BigNumber } from '@0x/utils';

var _ = require('lodash');

export interface DataTypeStaticInterface {
    matchGrammar: (type: string) => boolean;
    encodeValue: (value: any) => Buffer;
    decodeValue: (rawCalldata: RawCalldata) => any;
}

export class Address extends PayloadDataType {
    private static SIZE_KNOWN_AT_COMPILE_TIME: boolean = true;

    constructor(dataItem: DataItem) {
        super(dataItem, Address.SIZE_KNOWN_AT_COMPILE_TIME);
        if (!Address.matchGrammar(dataItem.type)) {
            throw new Error(`Tried to instantiate Address with bad input: ${dataItem}`);
        }
    }

    public getSignature(): string {
        return 'address';
    }

    public static matchGrammar(type: string): boolean {
        return type === 'address';
    }

    public encodeValue(value: boolean): Buffer {
        const evmWordWidth = 32;
        const encodedValueBuf = ethUtil.setLengthLeft(ethUtil.toBuffer(value), evmWordWidth);
        return encodedValueBuf;
    }

    public decodeValue(calldata: RawCalldata): string {
        const paddedValueBuf = calldata.popWord();
        const valueBuf = paddedValueBuf.slice(12);
        const value = ethUtil.bufferToHex(valueBuf);
        return value;
    }
}

export class Bool extends PayloadDataType {
    private static SIZE_KNOWN_AT_COMPILE_TIME: boolean = true;

    constructor(dataItem: DataItem) {
        super(dataItem, Bool.SIZE_KNOWN_AT_COMPILE_TIME);
        if (!Bool.matchGrammar(dataItem.type)) {
            throw new Error(`Tried to instantiate Bool with bad input: ${dataItem}`);
        }
    }

    public getSignature(): string {
        return 'bool';
    }

    public static matchGrammar(type: string): boolean {
        return type === 'bool';
    }

    public encodeValue(value: boolean): Buffer {
        const evmWordWidth = 32;
        const encodedValue = value === true ? '0x1' : '0x0';
        const encodedValueBuf = ethUtil.setLengthLeft(ethUtil.toBuffer(encodedValue), evmWordWidth);
        return encodedValueBuf;
    }

    public decodeValue(calldata: RawCalldata): boolean {
        const valueBuf = calldata.popWord();
        const valueHex = ethUtil.bufferToHex(valueBuf);
        const valueNumber = new BigNumber(valueHex, 16);
        let value: boolean = (valueNumber.equals(0)) ? false : true;
        if (!(valueNumber.equals(0) || valueNumber.equals(1))) {
            throw new Error(`Failed to decode boolean. Expected 0x0 or 0x1, got ${valueHex}`);
        }
        return value;
    }
}

abstract class Number extends PayloadDataType {
    private static SIZE_KNOWN_AT_COMPILE_TIME: boolean = true;
    static MAX_WIDTH: number = 256;
    static DEFAULT_WIDTH: number = Number.MAX_WIDTH;
    width: number = Number.DEFAULT_WIDTH;

    constructor(dataItem: DataItem, matcher: RegExp) {
        super(dataItem, Number.SIZE_KNOWN_AT_COMPILE_TIME);
        const matches = matcher.exec(dataItem.type);
        if (matches === null) {
            throw new Error(`Tried to instantiate Number with bad input: ${dataItem}`);
        }
        if (matches !== null && matches.length === 2 && matches[1] !== undefined) {
            this.width = parseInt(matches[1]);
        } else {
            this.width = 256;
        }
    }

    public encodeValue(value: BigNumber): Buffer {
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

        return valueBuf;
    }

    public decodeValue(calldata: RawCalldata): BigNumber {
        const paddedValueBuf = calldata.popWord();
        const paddedValueHex = ethUtil.bufferToHex(paddedValueBuf);
        let value = new BigNumber(paddedValueHex, 16);
        if (this instanceof Int) {
            // Check if we're negative
            const binBase = 2;
            const paddedValueBin = value.toString(binBase);
            const valueBin = paddedValueBin.slice(paddedValueBin.length - this.width);
            if (valueBin[0].startsWith('1')) {
                // Negative
                // Step 1/3: Invert binary value
                let invertedValueBin = '';
                _.each(valueBin, (bit: string) => {
                    invertedValueBin += bit === '1' ? '0' : '1';
                });
                const invertedValue = new BigNumber(invertedValueBin, binBase);

                // Step 2/3: Add 1 to inverted value
                // The result is the two's-complement represent of the input value.
                const positiveValue = invertedValue.plus(1);

                // Step 3/3: Invert positive value
                const negativeValue = positiveValue.times(-1);
                value = negativeValue;
            }
        }

        return value;
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

export class Byte extends PayloadDataType {
    private static SIZE_KNOWN_AT_COMPILE_TIME: boolean = true;
    static matcher = RegExp(
        '^(byte|bytes(1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31|32))$',
    );

    static DEFAULT_WIDTH = 1;
    width: number = Byte.DEFAULT_WIDTH;

    constructor(dataItem: DataItem) {
        super(dataItem, Byte.SIZE_KNOWN_AT_COMPILE_TIME);
        const matches = Byte.matcher.exec(dataItem.type);
        if (!Byte.matchGrammar(dataItem.type)) {
            throw new Error(`Tried to instantiate Byte with bad input: ${dataItem}`);
        }
        if (matches !== null && matches.length === 3 && matches[2] !== undefined) {
            this.width = parseInt(matches[2]);
        } else {
            this.width = Byte.DEFAULT_WIDTH;
        }
    }

    public getSignature(): string {
        // Note that `byte` reduces to `bytes1`
        return `bytes${this.width}`;
    }

    public encodeValue(value: string | Buffer): Buffer {
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
        return paddedValue;
    }

    public decodeValue(calldata: RawCalldata): string {
        const paddedValueBuf = calldata.popWord();
        const valueBuf = paddedValueBuf.slice(0, this.width);
        const value = ethUtil.bufferToHex(valueBuf);
        return value;
    }

    public static matchGrammar(type: string): boolean {
        return this.matcher.test(type);
    }
}

export class Bytes extends PayloadDataType {
    private static SIZE_KNOWN_AT_COMPILE_TIME: boolean = false;
    static UNDEFINED_LENGTH = new BigNumber(-1);
    length: BigNumber = Bytes.UNDEFINED_LENGTH;

    constructor(dataItem: DataItem) {
        super(dataItem, Bytes.SIZE_KNOWN_AT_COMPILE_TIME);
        if (!Bytes.matchGrammar(dataItem.type)) {
            throw new Error(`Tried to instantiate Bytes with bad input: ${dataItem}`);
        }
    }

    public encodeValue(value: string | Buffer): Buffer {
        if (typeof value === 'string' && !value.startsWith('0x')) {
            throw new Error(`Input value must be hex (prefixed with 0x). Actual value is '${value}'`);
        }
        const valueBuf = ethUtil.toBuffer(value);
        if (value.length % 2 !== 0) {
            throw new Error(`Tried to assign ${value}, which is contains a half-byte. Use full bytes only.`);
        }

        const wordsForValue = Math.ceil(valueBuf.byteLength / 32);
        const paddedBytesForValue = wordsForValue * 32;
        const paddedValueBuf = ethUtil.setLengthRight(valueBuf, paddedBytesForValue);
        const paddedLengthBuf = ethUtil.setLengthLeft(ethUtil.toBuffer(valueBuf.byteLength), 32);
        const encodedValueBuf = Buffer.concat([paddedLengthBuf, paddedValueBuf]);
        return encodedValueBuf;
    }

    public decodeValue(calldata: RawCalldata): string {
        const lengthBuf = calldata.popWord();
        const lengthHex = ethUtil.bufferToHex(lengthBuf);
        const length = parseInt(lengthHex, 16);
        const wordsForValue = Math.ceil(length / 32);
        const paddedValueBuf = calldata.popWords(wordsForValue);
        const valueBuf = paddedValueBuf.slice(0, length);
        const decodedValue = ethUtil.bufferToHex(valueBuf);
        return decodedValue;
    }

    public getSignature(): string {
        return 'bytes';
    }

    public static matchGrammar(type: string): boolean {
        return type === 'bytes';
    }
}

export class SolString extends PayloadDataType {
    private static SIZE_KNOWN_AT_COMPILE_TIME: boolean = false;
    constructor(dataItem: DataItem) {
        super(dataItem, SolString.SIZE_KNOWN_AT_COMPILE_TIME);
        if (!SolString.matchGrammar(dataItem.type)) {
            throw new Error(`Tried to instantiate String with bad input: ${dataItem}`);
        }
    }

    public encodeValue(value: string): Buffer {
        const wordsForValue = Math.ceil(value.length / 32);
        const paddedBytesForValue = wordsForValue * 32;
        const valueBuf = ethUtil.setLengthRight(ethUtil.toBuffer(value), paddedBytesForValue);
        const lengthBuf = ethUtil.setLengthLeft(ethUtil.toBuffer(value.length), 32);
        const encodedValueBuf = Buffer.concat([lengthBuf, valueBuf]);
        return encodedValueBuf;
    }

    public decodeValue(calldata: RawCalldata): string {
        const lengthBuf = calldata.popWord();
        const lengthHex = ethUtil.bufferToHex(lengthBuf);
        const length = parseInt(lengthHex, 16);
        const wordsForValue = Math.ceil(length / 32);
        const paddedValueBuf = calldata.popWords(wordsForValue);
        const valueBuf = paddedValueBuf.slice(0, length);
        const value = valueBuf.toString('ascii');
        return value;
    }

    public getSignature(): string {
        return 'string';
    }

    public static matchGrammar(type: string): boolean {
        return type === 'string';
    }
}

export class Pointer extends DependentDataType {

    constructor(destDataType: DataType, parentDataType: DataType) {
        const destDataItem = destDataType.getDataItem();
        const dataItem = { name: `ptr<${destDataItem.name}>`, type: `ptr<${destDataItem.type}>` } as DataItem;
        super(dataItem, destDataType, parentDataType);
    }

    public getSignature(): string {
        return this.dependency.getSignature();
    }
}

export class Tuple extends MemberDataType {
    private tupleSignature: string;

    constructor(dataItem: DataItem) {
        super(dataItem);
        if (!Tuple.matchGrammar(dataItem.type)) {
            throw new Error(`Tried to instantiate Tuple with bad input: ${dataItem}`);
        }
        this.tupleSignature = this.computeSignatureOfMembers();
    }

    public getSignature(): string {
        return this.tupleSignature;
    }

    public static matchGrammar(type: string): boolean {
        return type === 'tuple';
    }
}

export class SolArray extends MemberDataType {
    static matcher = RegExp('^(.+)\\[([0-9]*)\\]$');
    private arraySignature: string;
    private elementType: string;

    constructor(dataItem: DataItem) {
        // Sanity check
        const matches = SolArray.matcher.exec(dataItem.type);
        if (matches === null || matches.length !== 3) {
            throw new Error(`Could not parse array: ${dataItem.type}`);
        } else if (matches[1] === undefined) {
            throw new Error(`Could not parse array type: ${dataItem.type}`);
        } else if (matches[2] === undefined) {
            throw new Error(`Could not parse array length: ${dataItem.type}`);
        }

        const isArray = true;
        const arrayElementType = matches[1];
        const arrayLength = (matches[2] === '') ? undefined : parseInt(matches[2], 10);
        super(dataItem, isArray, arrayLength, arrayElementType);
        this.elementType = arrayElementType;
        this.arraySignature = this.computeSignature();
    }

    private computeSignature(): string {
        let dataItem = {
            type: this.elementType,
            name: 'N/A',
        } as DataItem;
        const components = this.getDataItem().components;
        if (components !== undefined) {
            dataItem.components = components;
        }
        const elementDataType = DataTypeFactory.mapDataItemToDataType(dataItem);
        const type = elementDataType.getSignature();
        if (this.arrayLength === undefined) {
            return `${type}[]`;
        } else {
            return `${type}[${this.arrayLength}]`;
        }
    }

    public getSignature(): string {
        return this.arraySignature;
    }

    public static matchGrammar(type: string): boolean {
        return this.matcher.test(type);
    }
}

export class Method extends MemberDataType {
    private methodSignature: string;
    private methodSelector: string;

    // TMP
    public selector: string;

    constructor(abi: MethodAbi) {
        super({ type: 'method', name: abi.name, components: abi.inputs });
        this.methodSignature = this.computeSignature();
        this.selector = this.methodSelector = this.computeSelector();

    }

    private computeSignature(): string {
        const memberSignature = this.computeSignatureOfMembers();
        const methodSignature = `${this.getDataItem().name}${memberSignature}`;
        return methodSignature;
    }

    private computeSelector(): string {
        const signature = this.computeSignature();
        const selector = ethUtil.bufferToHex(ethUtil.toBuffer(ethUtil.sha3(signature).slice(0, 4)));
        return selector;
    }

    public encode(value: any, rules?: EncodingRules): string {
        const calldata = super.encode(value, rules, this.selector);
        return calldata;
    }

    public decode(calldata: string, rules?: DecodingRules): any[] | object {
        if (!calldata.startsWith(this.selector)) {
            throw new Error(`Tried to decode calldata, but it was missing the function selector. Expected '${this.selector}'.`);
        }
        const value = super.decode(calldata, rules);
        return value;
    }

    public getSignature(): string {
        return this.methodSignature;
    }

    public getSelector(): string {
        return this.methodSelector;
    }
}

export class EvmDataTypeFactoryImpl implements DataTypeFactoryImpl {

    public mapDataItemToDataType(dataItem: DataItem): DataType {
        if (SolArray.matchGrammar(dataItem.type)) return new SolArray(dataItem);
        if (Address.matchGrammar(dataItem.type)) return new Address(dataItem);
        if (Bool.matchGrammar(dataItem.type)) return new Bool(dataItem);
        if (Int.matchGrammar(dataItem.type)) return new Int(dataItem);
        if (UInt.matchGrammar(dataItem.type)) return new UInt(dataItem);
        if (Byte.matchGrammar(dataItem.type)) return new Byte(dataItem);
        if (Tuple.matchGrammar(dataItem.type)) return new Tuple(dataItem);
        if (Bytes.matchGrammar(dataItem.type)) return new Bytes(dataItem);
        if (SolString.matchGrammar(dataItem.type)) return new SolString(dataItem);
        //if (Fixed.matchGrammar(dataItem.type)) return Fixed(dataItem);
        //if (UFixed.matchGrammar(dataItem.type)) return UFixed(dataItem);

        throw new Error(`Unrecognized data type: '${dataItem.type}'`);
    }

    public create(dataItem: DataItem, parentDataType: DataType): DataType {
        const dataType = this.mapDataItemToDataType(dataItem);
        if (dataType.isStatic()) {
            return dataType;
        }

        const pointer = new Pointer(dataType, parentDataType);
        return pointer;
    }
}