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
        const orderSignTypedDataHashHex = '0xc59d01479d63bda79d1c7fefc883a81ff247f9a1f9168c748922cd7e0dcd5eca';
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
                        name: 'chainId',
                        type: 'uint256',
                    },
                    {
                        name: 'verifyingContractAddress',
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
                chainId: 1337,
                verifyingContractAddress: '0x0000000000000000000000000000000000000000',
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
                },
            };
            const hash = signTypedDataUtils.generateTypedDataHash(uninitializedOrder).toString('hex');
            const hashHex = `0x${hash}`;
            expect(hashHex).to.be.eq('0x7624dcf06a5ba0e2799a87adba76a13c7d6418214d6b3c9bc239fdf2422f2027');
        });
    });
});
