import * as chai from 'chai';
import 'mocha';
import ethUtil = require('ethereumjs-util');

var _ = require('lodash');

// import { assert } from '@0x/order-utils/src/assert';

import { chaiSetup } from './utils/chai_setup';

import { MethodAbi, DataItem } from 'ethereum-types';

import { BigNumber } from '@0x/utils';

const simpleAbi = {
    name: 'SimpleAbi',
    inputs: [
        {
            components: [
                {
                    name: 'greg',
                    type: 'uint256',
                },
                {
                    name: 'gregStr',
                    type: 'string',
                },
            ],
        },
    ],
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
    class Memory {}

    class Word {}

    abstract class DataType {
        private dataItem: DataItem;
        private hexValue: string;

        constructor(dataItem: DataItem) {
            this.dataItem = dataItem;
            this.hexValue = '0x';
        }

        protected assignHexValue(hexValue: string) {
            this.hexValue = hexValue;
        }

        public getHexValue(): string {
            return this.hexValue;
        }

        public abstract assignValue(value: any): void;

        // abstract match(type: string): Bool;
    }

    class Calldata {}

    abstract class StaticDataType extends DataType {
        constructor(dataItem: DataItem) {
            super(dataItem);
        }
    }

    abstract class DynamicDataType extends DataType {
        constructor(dataItem: DataItem) {
            super(dataItem);
        }
    }

    class Address extends StaticDataType {
        constructor(dataItem: DataItem) {
            super(dataItem);
            expect(Tuple.matchGrammar(dataItem.type)).to.be.true();
        }

        public assignValue(value: string) {
            const hexValue = ethUtil.bufferToHex(new Buffer(value));
            this.assignHexValue(hexValue);
        }

        public static matchGrammar(type: string): boolean {
            return type === 'address';
        }
    }

    class Bool extends StaticDataType {
        constructor(dataItem: DataItem) {
            super(dataItem);
            expect(Tuple.matchGrammar(dataItem.type)).to.be.true();
        }

        public assignValue(value: string) {
            //const hexValue = ethUtil.bufferToHex(new Buffer(value));
            //this.assignHexValue(hexValue);
        }

        public static matchGrammar(type: string): boolean {
            return type === 'bool';
        }
    }

    class Int extends StaticDataType {
        static matcher = RegExp(
            '^int(8|16|24|32|40|48|56|64|72|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256){0,1}$',
        );

        static DEFAULT_WIDTH = new BigNumber(1);
        width: BigNumber = Byte.DEFAULT_WIDTH;

        constructor(dataItem: DataItem) {
            super(dataItem);
            const matches = Byte.matcher.exec(dataItem.type);
            expect(matches).to.be.not.null();
            if (matches !== null && matches.length === 1) {
                this.width = new BigNumber(matches[1], 10);
            }
        }

        public assignValue(value: string) {
            //const hexValue = ethUtil.bufferToHex(new Buffer(value));
            //this.assignHexValue(hexValue);
        }

        public static matchGrammar(type: string): boolean {
            return this.matcher.test(type);
        }
    }

    class UInt extends StaticDataType {
        static matcher = RegExp(
            '^uint(8|16|24|32|40|48|56|64|72|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256){0,1}$',
        );

        static DEFAULT_WIDTH: number = 1;
        width: number = UInt.DEFAULT_WIDTH;

        constructor(dataItem: DataItem) {
            super(dataItem);
            const matches = Byte.matcher.exec(dataItem.type);
            expect(matches).to.be.not.null();
            if (matches !== null && matches.length === 1) {
                this.width = parseInt(matches[1]);
            }
        }

        public getMaxValue() {
            return new BigNumber(2).toPower(this.width - 1);
        }

        public assignValue(value: BigNumber) {
            if (value > this.getMaxValue()) {
                throw 1;
            }

            const valueBuf = ethUtil.setLengthLeft(ethUtil.toBuffer(value), 32);
            const encodedValue = ethUtil.bufferToHex(valueBuf);

            this.assignHexValue(encodedValue);
        }

        public static matchGrammar(type: string): boolean {
            return this.matcher.test(type);
        }
    }

    class Byte extends StaticDataType {
        static matcher = RegExp(
            '^(byte|bytes(1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31|32))$',
        );

        static DEFAULT_WIDTH = new BigNumber(1);
        width: BigNumber = Byte.DEFAULT_WIDTH;

        constructor(dataItem: DataItem) {
            super(dataItem);
            const matches = Byte.matcher.exec(dataItem.type);
            expect(matches).to.be.not.null();
            if (matches !== null && matches.length === 1) {
                this.width = new BigNumber(matches[1], 10);
            }
        }

        public assignValue(value: string) {
            //const hexValue = ethUtil.bufferToHex(new Buffer(value));
            //this.assignHexValue(hexValue);
        }

        public static matchGrammar(type: string): boolean {
            return this.matcher.test(type);
        }
    }

    class Tuple extends DynamicDataType {
        constructor(dataItem: DataItem) {
            super(dataItem);
            expect(Tuple.matchGrammar(dataItem.type)).to.be.true();
        }

        public assignValue(value: string) {
            //const hexValue = ethUtil.bufferToHex(new Buffer(value));
            //this.assignHexValue(hexValue);
        }

        public static matchGrammar(type: string): boolean {
            return type === 'tuple';
        }
    }

    class Bytes extends StaticDataType {
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

        public static matchGrammar(type: string): boolean {
            return type === 'bytes';
        }
    }

    class SolArray extends DynamicDataType {
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

        public static matchGrammar(type: string): boolean {
            return this.matcher.test(type);
        }
    }

    class SolString extends DynamicDataType {
        constructor(dataItem: DataItem) {
            super(dataItem);
            expect(SolString.matchGrammar(dataItem.type)).to.be.true();
        }

        public assignValue(value: string) {
            const valueBuf = ethUtil.setLengthLeft(ethUtil.toBuffer(value), 32);
            const lengthBuf = ethUtil.setLengthLeft(ethUtil.toBuffer(value.length), 32);
            const encodedValueBuf = Buffer.concat([lengthBuf, valueBuf]);
            const encodedValue = ethUtil.bufferToHex(encodedValueBuf);

            this.assignHexValue(encodedValue);
        }

        public static matchGrammar(type: string): boolean {
            return type === 'string';
        }
    }

    /* TODO
    class Fixed extends StaticDataType {}

    class UFixed extends StaticDataType {}*/

    class Pointer extends StaticDataType {
        destDataType: DynamicDataType;
        static metaDataItem = { name: '[ptr]', type: '[ptr]' } as DataItem;

        constructor(destDataType: DynamicDataType) {
            super(Pointer.metaDataItem);
            this.destDataType = destDataType;
        }

        public assignValue(destDataType: DynamicDataType) {
            this.destDataType = destDataType;
        }
    }

    class DataTypeFactory {
        public static mapDataItemToDataType(dataItem: DataItem): DataType {
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

        constructor(abi: MethodAbi) {
            // super();
            this.name = abi.name;
            this.params = [];

            _.each(abi.inputs, function(this: Method, input: DataItem) {
                this.params.push(DataTypeFactory.create(input));
            });
        }

        encode(args: any[]): string {
            //const calldata = new Calldata(this.name, this.params.length);
            let params = this.params;
            _.each(params, function(args: any[], i: number, param: DataType) {
                param.assignValue(args[i]);
                console.log(param.getHexValue());
                //param.encodeToCalldata(calldata);
            });

            return '';

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
        it.only('Yessir', async () => {
            const method = new AbiEncoder.Method(simpleAbi);
            method.encode([new BigNumber(5), 'five']);
            expect(true).to.be.true();
        });
    });
});
