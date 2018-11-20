import { DataItem, MethodAbi } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { BigNumber } from '../configured_bignumber';

import { DecodingRules, EncodingRules, RawCalldata } from './calldata';
import * as Constants from './constants';
import { DataType, DataTypeFactory, DependentDataType, MemberDataType, PayloadDataType } from './data_type';

export interface DataTypeStaticInterface {
    matchGrammar: (type: string) => boolean;
    encodeValue: (value: any) => Buffer;
    decodeValue: (rawCalldata: RawCalldata) => any;
}

export class Address extends PayloadDataType {
    public static ERROR_MESSAGE_ADDRESS_MUST_START_WITH_0X = "Address must start with '0x'";
    public static ERROR_MESSAGE_ADDRESS_MUST_BE_20_BYTES = 'Address must be 20 bytes';
    private static readonly _SIZE_KNOWN_AT_COMPILE_TIME: boolean = true;
    private static readonly _ADDRESS_SIZE_IN_BYTES = 20;
    private static readonly _DECODED_ADDRESS_OFFSET_IN_BYTES = Constants.EVM_WORD_WIDTH_IN_BYTES - Address._ADDRESS_SIZE_IN_BYTES;

    public static matchGrammar(type: string): boolean {
        return type === 'address';
    }

    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance(), Address._SIZE_KNOWN_AT_COMPILE_TIME);
        if (!Address.matchGrammar(dataItem.type)) {
            throw new Error(`Tried to instantiate Address with bad input: ${dataItem}`);
        }
    }

    public getSignature(): string {
        return 'address';
    }

    public encodeValue(value: string): Buffer {
        if (!value.startsWith('0x')) {
            throw new Error(Address.ERROR_MESSAGE_ADDRESS_MUST_START_WITH_0X);
        }
        const valueAsBuffer = ethUtil.toBuffer(value);
        if (valueAsBuffer.byteLength !== Address._ADDRESS_SIZE_IN_BYTES) {
            throw new Error(Address.ERROR_MESSAGE_ADDRESS_MUST_BE_20_BYTES);
        }
        const encodedValueBuf = ethUtil.setLengthLeft(valueAsBuffer, Constants.EVM_WORD_WIDTH_IN_BYTES);
        return encodedValueBuf;
    }

    public decodeValue(calldata: RawCalldata): string {
        const paddedValueBuf = calldata.popWord();
        const valueBuf = paddedValueBuf.slice(Address._DECODED_ADDRESS_OFFSET_IN_BYTES);
        const value = ethUtil.bufferToHex(valueBuf);
        return value;
    }
}

export class Bool extends PayloadDataType {
    private static readonly _SIZE_KNOWN_AT_COMPILE_TIME: boolean = true;

    public static matchGrammar(type: string): boolean {
        return type === 'bool';
    }

    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance(), Bool._SIZE_KNOWN_AT_COMPILE_TIME);
        if (!Bool.matchGrammar(dataItem.type)) {
            throw new Error(`Tried to instantiate Bool with bad input: ${dataItem}`);
        }
    }

    public getSignature(): string {
        return 'bool';
    }

    public encodeValue(value: boolean): Buffer {
        const encodedValue = value ? '0x1' : '0x0';
        const encodedValueBuf = ethUtil.setLengthLeft(ethUtil.toBuffer(encodedValue), Constants.EVM_WORD_WIDTH_IN_BYTES);
        return encodedValueBuf;
    }

    public decodeValue(calldata: RawCalldata): boolean {
        const valueBuf = calldata.popWord();
        const valueHex = ethUtil.bufferToHex(valueBuf);
        const valueNumber = new BigNumber(valueHex, 16);
        if (!(valueNumber.equals(0) || valueNumber.equals(1))) {
            throw new Error(`Failed to decode boolean. Expected 0x0 or 0x1, got ${valueHex}`);
        }
        /* tslint:disable boolean-naming */
        const value: boolean = valueNumber.equals(0) ? false : true;
        /* tslint:enable boolean-naming */
        return value;
    }
}

abstract class Number extends PayloadDataType {
    private static readonly _SIZE_KNOWN_AT_COMPILE_TIME: boolean = true;
    private static readonly _MAX_WIDTH: number = 256;
    private static readonly _DEFAULT_WIDTH: number = Number._MAX_WIDTH;
    protected _width: number;

    constructor(dataItem: DataItem, matcher: RegExp) {
        super(dataItem, EvmDataTypeFactory.getInstance(), Number._SIZE_KNOWN_AT_COMPILE_TIME);
        const matches = matcher.exec(dataItem.type);
        if (matches === null) {
            throw new Error(`Tried to instantiate Number with bad input: ${dataItem}`);
        }
        this._width = (matches !== null && matches.length === 2 && matches[1] !== undefined) ?
            parseInt(matches[1], Constants.DEC_BASE) :
            this._width = Number._DEFAULT_WIDTH;
    }

    public encodeValue(value_: BigNumber | string | number): Buffer {
        const value = new BigNumber(value_, 10);
        if (value.greaterThan(this.getMaxValue())) {
            throw new Error(`Tried to assign value of ${value}, which exceeds max value of ${this.getMaxValue()}`);
        } else if (value.lessThan(this.getMinValue())) {
            throw new Error(`Tried to assign value of ${value}, which exceeds min value of ${this.getMinValue()}`);
        }

        let valueBuf: Buffer;
        if (value.greaterThanOrEqualTo(0)) {
            valueBuf = ethUtil.setLengthLeft(ethUtil.toBuffer(`0x${value.toString(Constants.HEX_BASE)}`), Constants.EVM_WORD_WIDTH_IN_BYTES);
        } else {
            // BigNumber can't write a negative hex value, so we use twos-complement conversion to do it ourselves.
            // Step 1/3: Convert value to positive binary string
            const binBase = 2;
            const valueBin = value.times(-1).toString(binBase);

            // Step 2/3: Invert binary value
            let invertedValueBin = '1'.repeat(Constants.EVM_WORD_WIDTH_IN_BITS - valueBin.length);
            _.each(valueBin, (bit: string) => {
                invertedValueBin += bit === '1' ? '0' : '1';
            });
            const invertedValue = new BigNumber(invertedValueBin, binBase);

            // Step 3/3: Add 1 to inverted value
            // The result is the two's-complement represent of the input value.
            const negativeValue = invertedValue.plus(1);

            // Convert the negated value to a hex string
            valueBuf = ethUtil.setLengthLeft(ethUtil.toBuffer(`0x${negativeValue.toString(Constants.HEX_BASE)}`), Constants.EVM_WORD_WIDTH_IN_BYTES);
        }

        return valueBuf;
    }

    public decodeValue(calldata: RawCalldata): BigNumber {
        const paddedValueBuf = calldata.popWord();
        const paddedValueHex = ethUtil.bufferToHex(paddedValueBuf);
        let value = new BigNumber(paddedValueHex, 16);
        if (this instanceof Int) {
            // Check if we're negative
            const valueBin = value.toString(Constants.BIN_BASE);
            if (valueBin.length === Constants.EVM_WORD_WIDTH_IN_BITS && valueBin[0].startsWith('1')) {
                // Negative
                // Step 1/3: Invert binary value
                let invertedValueBin = '';
                _.each(valueBin, (bit: string) => {
                    invertedValueBin += bit === '1' ? '0' : '1';
                });
                const invertedValue = new BigNumber(invertedValueBin, Constants.BIN_BASE);

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
    private static readonly _matcher = RegExp(
        '^int(8|16|24|32|40|48|56|64|72|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256){0,1}$',
    );

    public static matchGrammar(type: string): boolean {
        return Int._matcher.test(type);
    }

    public constructor(dataItem: DataItem) {
        super(dataItem, Int._matcher);
    }

    public getMaxValue(): BigNumber {
        return new BigNumber(2).toPower(this._width - 1).sub(1);
    }

    public getMinValue(): BigNumber {
        return new BigNumber(2).toPower(this._width - 1).times(-1);
    }

    public getSignature(): string {
        return `int${this._width}`;
    }
}

export class UInt extends Number {
    private static readonly _matcher = RegExp(
        '^uint(8|16|24|32|40|48|56|64|72|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256){0,1}$',
    );

    public static matchGrammar(type: string): boolean {
        return UInt._matcher.test(type);
    }

    public constructor(dataItem: DataItem) {
        super(dataItem, UInt._matcher);
    }

    public getMaxValue(): BigNumber {
        return new BigNumber(2).toPower(this._width).sub(1);
    }

    public getMinValue(): BigNumber {
        return new BigNumber(0);
    }

    public getSignature(): string {
        return `uint${this._width}`;
    }
}

export class Byte extends PayloadDataType {
    private static readonly _SIZE_KNOWN_AT_COMPILE_TIME: boolean = true;
    private static readonly _matcher = RegExp(
        '^(byte|bytes(1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31|32))$',
    );

    private static readonly _DEFAULT_WIDTH = 1;
    private readonly _width: number;

    public static matchGrammar(type: string): boolean {
        return Byte._matcher.test(type);
    }

    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance(), Byte._SIZE_KNOWN_AT_COMPILE_TIME);
        const matches = Byte._matcher.exec(dataItem.type);
        if (!Byte.matchGrammar(dataItem.type)) {
            throw new Error(`Tried to instantiate Byte with bad input: ${dataItem}`);
        }
        this._width = (matches !== null && matches.length === 3 && matches[2] !== undefined) ? parseInt(matches[2], Constants.DEC_BASE) : Byte._DEFAULT_WIDTH;
    }

    public getSignature(): string {
        // Note that `byte` reduces to `bytes1`
        return `bytes${this._width}`;
    }

    public encodeValue(value: string | Buffer): Buffer {
        // Sanity check if string
        if (typeof value === 'string' && !value.startsWith('0x')) {
            throw new Error(`Tried to encode non-hex value. Value must inlcude '0x' prefix.`);
        }
        // Convert value into a buffer and do bounds checking
        const valueBuf = ethUtil.toBuffer(value);
        if (valueBuf.byteLength > this._width) {
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
        const valueBuf = paddedValueBuf.slice(0, this._width);
        const value = ethUtil.bufferToHex(valueBuf);
        return value;
    }
}

export class Bytes extends PayloadDataType {
    private static readonly _SIZE_KNOWN_AT_COMPILE_TIME: boolean = false;

    public static matchGrammar(type: string): boolean {
        return type === 'bytes';
    }

    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance(), Bytes._SIZE_KNOWN_AT_COMPILE_TIME);
        if (!Bytes.matchGrammar(dataItem.type)) {
            throw new Error(`Tried to instantiate Bytes with bad input: ${dataItem}`);
        }
    }

    public encodeValue(value: string | Buffer): Buffer {
        if (typeof value === 'string' && !value.startsWith('0x')) {
            throw new Error(`Tried to encode non-hex value. Value must inlcude '0x' prefix. Got '${value}'`);
        }
        const valueBuf = ethUtil.toBuffer(value);
        if (value.length % 2 !== 0) {
            throw new Error(`Tried to assign ${value}, which is contains a half-byte. Use full bytes only.`);
        }

        const wordsForValue = Math.ceil(valueBuf.byteLength / Constants.EVM_WORD_WIDTH_IN_BYTES);
        const paddedBytesForValue = wordsForValue * Constants.EVM_WORD_WIDTH_IN_BYTES;
        const paddedValueBuf = ethUtil.setLengthRight(valueBuf, paddedBytesForValue);
        const paddedLengthBuf = ethUtil.setLengthLeft(ethUtil.toBuffer(valueBuf.byteLength), Constants.EVM_WORD_WIDTH_IN_BYTES);
        const encodedValueBuf = Buffer.concat([paddedLengthBuf, paddedValueBuf]);
        return encodedValueBuf;
    }

    public decodeValue(calldata: RawCalldata): string {
        const lengthBuf = calldata.popWord();
        const lengthHex = ethUtil.bufferToHex(lengthBuf);
        const length = parseInt(lengthHex, Constants.HEX_BASE);
        const wordsForValue = Math.ceil(length / Constants.EVM_WORD_WIDTH_IN_BYTES);
        const paddedValueBuf = calldata.popWords(wordsForValue);
        const valueBuf = paddedValueBuf.slice(0, length);
        const decodedValue = ethUtil.bufferToHex(valueBuf);
        return decodedValue;
    }

    public getSignature(): string {
        return 'bytes';
    }
}

export class SolString extends PayloadDataType {
    private static readonly _SIZE_KNOWN_AT_COMPILE_TIME: boolean = false;

    public static matchGrammar(type: string): boolean {
        return type === 'string';
    }

    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance(), SolString._SIZE_KNOWN_AT_COMPILE_TIME);
        if (!SolString.matchGrammar(dataItem.type)) {
            throw new Error(`Tried to instantiate String with bad input: ${dataItem}`);
        }
    }

    public encodeValue(value: string): Buffer {
        const wordsForValue = Math.ceil(value.length / Constants.EVM_WORD_WIDTH_IN_BYTES);
        const paddedBytesForValue = wordsForValue * Constants.EVM_WORD_WIDTH_IN_BYTES;
        const valueBuf = ethUtil.setLengthRight(new Buffer(value), paddedBytesForValue);
        const lengthBuf = ethUtil.setLengthLeft(ethUtil.toBuffer(value.length), Constants.EVM_WORD_WIDTH_IN_BYTES);
        const encodedValueBuf = Buffer.concat([lengthBuf, valueBuf]);
        return encodedValueBuf;
    }

    public decodeValue(calldata: RawCalldata): string {
        const lengthBuf = calldata.popWord();
        const lengthHex = ethUtil.bufferToHex(lengthBuf);
        const length = parseInt(lengthHex, Constants.HEX_BASE);
        const wordsForValue = Math.ceil(length / Constants.EVM_WORD_WIDTH_IN_BYTES);
        const paddedValueBuf = calldata.popWords(wordsForValue);
        const valueBuf = paddedValueBuf.slice(0, length);
        const value = valueBuf.toString('ascii');
        return value;
    }

    public getSignature(): string {
        return 'string';
    }
}

export class Pointer extends DependentDataType {
    constructor(destDataType: DataType, parentDataType: DataType) {
        const destDataItem = destDataType.getDataItem();
        const dataItem: DataItem = { name: `ptr<${destDataItem.name}>`, type: `ptr<${destDataItem.type}>` };
        super(dataItem, EvmDataTypeFactory.getInstance(), destDataType, parentDataType);
    }

    public getSignature(): string {
        return this._dependency.getSignature();
    }
}

export class Tuple extends MemberDataType {
    private readonly _tupleSignature: string;

    public static matchGrammar(type: string): boolean {
        return type === 'tuple';
    }

    public constructor(dataItem: DataItem) {
        super(dataItem, EvmDataTypeFactory.getInstance());
        if (!Tuple.matchGrammar(dataItem.type)) {
            throw new Error(`Tried to instantiate Tuple with bad input: ${dataItem}`);
        }
        this._tupleSignature = this._computeSignatureOfMembers();
    }

    public getSignature(): string {
        return this._tupleSignature;
    }
}

export class SolArray extends MemberDataType {
    private static readonly _matcher = RegExp('^(.+)\\[([0-9]*)\\]$');
    private readonly _arraySignature: string;
    private readonly _elementType: string;

    public static matchGrammar(type: string): boolean {
        return SolArray._matcher.test(type);
    }

    public constructor(dataItem: DataItem) {
        // Sanity check
        const matches = SolArray._matcher.exec(dataItem.type);
        if (matches === null || matches.length !== 3) {
            throw new Error(`Could not parse array: ${dataItem.type}`);
        } else if (matches[1] === undefined) {
            throw new Error(`Could not parse array type: ${dataItem.type}`);
        } else if (matches[2] === undefined) {
            throw new Error(`Could not parse array length: ${dataItem.type}`);
        }

        const isArray = true;
        const arrayElementType = matches[1];
        const arrayLength = matches[2] === '' ? undefined : parseInt(matches[2], Constants.DEC_BASE);
        super(dataItem, EvmDataTypeFactory.getInstance(), isArray, arrayLength, arrayElementType);
        this._elementType = arrayElementType;
        this._arraySignature = this._computeSignature();
    }

    public getSignature(): string {
        return this._arraySignature;
    }

    private _computeSignature(): string {
        const dataItem: DataItem = {
            type: this._elementType,
            name: 'N/A',
        };
        const components = this.getDataItem().components;
        if (components !== undefined) {
            dataItem.components = components;
        }
        const elementDataType = this.getFactory().mapDataItemToDataType(dataItem);
        const type = elementDataType.getSignature();
        if (this._arrayLength === undefined) {
            return `${type}[]`;
        } else {
            return `${type}[${this._arrayLength}]`;
        }
    }
}

export class Method extends MemberDataType {
    // TMP
    public selector: string;

    private readonly _methodSignature: string;
    private readonly _methodSelector: string;
    private readonly _returnDataTypes: DataType[];
    private readonly _returnDataItem: DataItem;

    public constructor(abi: MethodAbi) {
        super({ type: 'method', name: abi.name, components: abi.inputs }, EvmDataTypeFactory.getInstance());
        this._methodSignature = this._computeSignature();
        this.selector = this._methodSelector = this._computeSelector();
        this._returnDataTypes = [];
        this._returnDataItem = { type: 'tuple', name: abi.name, components: abi.outputs };
        const dummy = new Byte({ type: 'byte', name: 'DUMMY' }); // @TODO TMP
        _.each(abi.outputs, (dataItem: DataItem) => {
            this._returnDataTypes.push(this.getFactory().create(dataItem, dummy));
        });
    }

    public encode(value: any, rules?: EncodingRules): string {
        const calldata = super.encode(value, rules, this.selector);
        return calldata;
    }

    public decode(calldata: string, rules?: DecodingRules): any[] | object {
        if (!calldata.startsWith(this.selector)) {
            throw new Error(
                `Tried to decode calldata, but it was missing the function selector. Expected '${this.selector}'.`,
            );
        }
        const hasSelector = true;
        const value = super.decode(calldata, rules, hasSelector);
        return value;
    }

    public encodeReturnValues(value: any, rules?: EncodingRules): string {
        const returnDataType = new Tuple(this._returnDataItem);
        const returndata = returnDataType.encode(value, rules);
        return returndata;
    }

    public decodeReturnValues(returndata: string, rules?: DecodingRules): any {
        const returnValues: any[] = [];
        const rules_: DecodingRules = rules ? rules : { structsAsObjects: false };
        const rawReturnData = new RawCalldata(returndata, false);
        _.each(this._returnDataTypes, (dataType: DataType) => {
            returnValues.push(dataType.generateValue(rawReturnData, rules_));
        });
        return returnValues;
    }

    public getSignature(): string {
        return this._methodSignature;
    }

    public getSelector(): string {
        return this._methodSelector;
    }

    private _computeSignature(): string {
        const memberSignature = this._computeSignatureOfMembers();
        const methodSignature = `${this.getDataItem().name}${memberSignature}`;
        return methodSignature;
    }

    private _computeSelector(): string {
        const signature = this._computeSignature();
        const selector = ethUtil.bufferToHex(ethUtil.toBuffer(ethUtil.sha3(signature).slice(Constants.HEX_SELECTOR_BYTE_OFFSET_IN_CALLDATA, Constants.HEX_SELECTOR_LENGTH_IN_BYTES)));
        return selector;
    }
}

export class EvmDataTypeFactory implements DataTypeFactory {
    private static _instance: DataTypeFactory;

    public static getInstance(): DataTypeFactory {
        if (!EvmDataTypeFactory._instance) {
            EvmDataTypeFactory._instance = new EvmDataTypeFactory();
        }
        return EvmDataTypeFactory._instance;
    }

    public mapDataItemToDataType(dataItem: DataItem): DataType {
        if (SolArray.matchGrammar(dataItem.type)) {
            return new SolArray(dataItem);
        } else if (Address.matchGrammar(dataItem.type)) {
            return new Address(dataItem);
        } else if (Bool.matchGrammar(dataItem.type)) {
            return new Bool(dataItem);
        } else if (Int.matchGrammar(dataItem.type)) {
            return new Int(dataItem);
        } else if (UInt.matchGrammar(dataItem.type)) {
            return new UInt(dataItem);
        } else if (Byte.matchGrammar(dataItem.type)) {
            return new Byte(dataItem);
        } else if (Tuple.matchGrammar(dataItem.type)) {
            return new Tuple(dataItem);
        } else if (Bytes.matchGrammar(dataItem.type)) {
            return new Bytes(dataItem);
        } else if (SolString.matchGrammar(dataItem.type)) {
            return new SolString(dataItem);
        }
        // @TODO: Implement Fixed/UFixed types
        throw new Error(`Unrecognized data type: '${dataItem.type}'`);
    }

    public create(dataItem: DataItem, parentDataType?: DataType): DataType {
        const dataType = this.mapDataItemToDataType(dataItem);
        if (dataType.isStatic()) {
            return dataType;
        }

        if (parentDataType === undefined) {
            // @Todo -- will this work for return values?
            throw new Error(`Trying to create a pointer`);
        }
        const pointer = new Pointer(dataType, parentDataType);
        return pointer;
    }

    private constructor() { }
}
