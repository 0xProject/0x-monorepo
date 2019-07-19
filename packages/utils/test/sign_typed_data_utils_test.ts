import * as chai from 'chai';
import 'mocha';

import { signTypedDataUtils } from '../src/sign_typed_data_utils';

const expect = chai.expect;

describe('signTypedDataUtils', () => {
    describe('signTypedDataHash', () => {
        const simpleSignTypedDataHashHex = '0xb460d69ca60383293877cd765c0f97bd832d66bca720f7e32222ce1118832493';
        const simpleSignTypedData = {
            types: {
                EIP712Domain: [
                    {
                        name: 'name',
                        type: 'string',
                    },
                ],
                Test: [
                    {
                        name: 'testAddress',
                        type: 'address',
                    },
                    {
                        name: 'testNumber',
                        type: 'uint256',
                    },
                ],
            },
            domain: {
                name: 'Test',
            },
            message: {
                testAddress: '0x0000000000000000000000000000000000000000',
                testNumber: '12345',
            },
            primaryType: 'Test',
        };
        const orderSignTypedDataHashHex = '0x55eaa6ec02f3224d30873577e9ddd069a288c16d6fb407210eecbc501fa76692';
        const orderSignTypedData = {
            types: {
                EIP712Domain: [
                    {
                        name: 'name',
                        type: 'string',
                    },
                    {
                        name: 'version',
                        type: 'string',
                    },
                    {
                        name: 'verifyingContract',
                        type: 'address',
                    },
                ],
                Order: [
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
            },
            domain: {
                name: '0x Protocol',
                version: '2',
                verifyingContract: '0x0000000000000000000000000000000000000000',
            },
            message: {
                makerAddress: '0x0000000000000000000000000000000000000000',
                takerAddress: '0x0000000000000000000000000000000000000000',
                makerAssetAmount: '1000000000000000000',
                takerAssetAmount: '1000000000000000000',
                expirationTimeSeconds: '12345',
                makerFee: '0',
                takerFee: '0',
                feeRecipientAddress: '0x0000000000000000000000000000000000000000',
                senderAddress: '0x0000000000000000000000000000000000000000',
                salt: '12345',
                makerAssetData: '0x0000000000000000000000000000000000000000',
                takerAssetData: '0x0000000000000000000000000000000000000000',
                exchangeAddress: '0x0000000000000000000000000000000000000000',
            },
            primaryType: 'Order',
        };
        it('creates a hash of the test sign typed data', () => {
            const hash = signTypedDataUtils.generateTypedDataHash(simpleSignTypedData).toString('hex');
            const hashHex = `0x${hash}`;
            expect(hashHex).to.be.eq(simpleSignTypedDataHashHex);
        });
        it('creates a hash of the order sign typed data', () => {
            const hash = signTypedDataUtils.generateTypedDataHash(orderSignTypedData).toString('hex');
            const hashHex = `0x${hash}`;
            expect(hashHex).to.be.eq(orderSignTypedDataHashHex);
        });
        it('creates a hash of an uninitialized order', () => {
            const uninitializedOrder = {
                ...orderSignTypedData,
                message: {
                    makerAddress: '0x0000000000000000000000000000000000000000',
                    takerAddress: '0x0000000000000000000000000000000000000000',
                    makerAssetAmount: 0,
                    takerAssetAmount: 0,
                    expirationTimeSeconds: 0,
                    makerFee: 0,
                    takerFee: 0,
                    feeRecipientAddress: '0x0000000000000000000000000000000000000000',
                    senderAddress: '0x0000000000000000000000000000000000000000',
                    salt: 0,
                    makerAssetData: '0x0000000000000000000000000000000000000000',
                    takerAssetData: '0x0000000000000000000000000000000000000000',
                    exchangeAddress: '0x0000000000000000000000000000000000000000',
                },
            };
            const hash = signTypedDataUtils.generateTypedDataHash(uninitializedOrder).toString('hex');
            const hashHex = `0x${hash}`;
            expect(hashHex).to.be.eq('0xfaa49b35faeb9197e9c3ba7a52075e6dad19739549f153b77dfcf59408a4b422');
        });
        it('creates a hash of an object with an array of ints', () => {
            const intArrayData = {
                types: {
                    EIP712Domain: [
                        {
                            name: 'name',
                            type: 'string',
                        },
                        {
                            name: 'version',
                            type: 'string',
                        },
                        {
                            name: 'verifyingContract',
                            type: 'address',
                        },
                    ],
                    MyStruct: [
                        {
                            name: 'myInts',
                            type: 'uint256[]',
                        },
                    ],
                },
                domain: {
                    name: 'TestDomain',
                    version: '4.5',
                    verifyingContract: '0x0000000000000000000000000000000000000000',
                },
                message: {
                    myInts: ['0', '1', '2'],
                },
                primaryType: 'MyStruct',
            };
            const hash = signTypedDataUtils.generateTypedDataHash(intArrayData).toString('hex');
            const hashHex = `0x${hash}`;
            expect(hashHex).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
        });
        it('creates a hash of an object with an array of addresses', () => {
            const addressArrayData = {
                types: {
                    EIP712Domain: [
                        {
                            name: 'name',
                            type: 'string',
                        },
                        {
                            name: 'version',
                            type: 'string',
                        },
                        {
                            name: 'verifyingContract',
                            type: 'address',
                        },
                    ],
                    MyStruct: [
                        {
                            name: 'myAddresses',
                            type: 'address[]',
                        },
                    ],
                },
                domain: {
                    name: 'TestDomain',
                    version: '4.5',
                    verifyingContract: '0x0000000000000000000000000000000000000000',
                },
                message: {
                    myAddresses: [
                      '0x0123456789012345678901234567890123456789',
                      '0x1234567890123456789012345678901234567890',
                      '0x2345678901234567890123456789012345678901',
                    ],
                },
                primaryType: 'MyStruct',
            };
            const hash = signTypedDataUtils.generateTypedDataHash(addressArrayData).toString('hex');
            const hashHex = `0x${hash}`;
            expect(hashHex).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
        });
        it('creates a hash of an object with an array of structs', () => {
            const structArrayData = {
                types: {
                    EIP712Domain: [
                        {
                            name: 'name',
                            type: 'string',
                        },
                        {
                            name: 'version',
                            type: 'string',
                        },
                        {
                            name: 'verifyingContract',
                            type: 'address',
                        },
                    ],
                    MyStruct: [
                        {
                            name: 'mySmallStructs',
                            type: 'MySmallStruct[]',
                        },
                    ],
                    MySmallStruct: [
                        {
                            name: 'myData',
                            type: 'uint256',
                        },
                    ],
                },
                domain: {
                    name: 'TestDomain',
                    version: '4.5',
                    verifyingContract: '0x0000000000000000000000000000000000000000',
                },
                message: {
                    mySmallStructs: [
                      { myData: '1' },
                      { myData: '2' },
                      { myData: '3' },
                    ],
                },
                primaryType: 'MyStruct',
            };
            const hash = signTypedDataUtils.generateTypedDataHash(structArrayData).toString('hex');
            const hashHex = `0x${hash}`;
            expect(hashHex).to.be.eq('0x0000000000000000000000000000000000000000000000000000000000000000');
        });
    });
});
