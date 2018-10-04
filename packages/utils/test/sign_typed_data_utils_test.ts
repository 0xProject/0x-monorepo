import * as chai from 'chai';
import 'mocha';

import { signTypedDataUtils } from '../src/sign_typed_data_utils';

const expect = chai.expect;

describe('signTypedDataUtils', () => {
    describe('signTypedDataHash', () => {
        const signTypedDataHashHex = '0x55eaa6ec02f3224d30873577e9ddd069a288c16d6fb407210eecbc501fa76692';
        const signTypedData = {
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
        it.only('creates a known hash of the sign typed data', () => {
            const hash = signTypedDataUtils.signTypedDataHash(signTypedData).toString('hex');
            const hashHex = `0x${hash}`;
            expect(hashHex).to.be.eq(signTypedDataHashHex);
            console.log(hash);
        });
    });
});
