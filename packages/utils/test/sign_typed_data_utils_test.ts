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
    });
});
