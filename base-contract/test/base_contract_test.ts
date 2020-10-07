import * as chai from 'chai';
import 'mocha';

import { BaseContract } from '../src';

const { expect } = chai;

describe('BaseContract', () => {
    describe('strictArgumentEncodingCheck', () => {
        it('works for simple types', () => {
            BaseContract.strictArgumentEncodingCheck(
                [{ name: 'to', type: 'address' }],
                ['0xe834ec434daba538cd1b9fe1582052b880bd7e63'],
            );
        });
        it('works for array types', () => {
            const inputAbi = [
                {
                    name: 'takerAssetFillAmounts',
                    type: 'uint256[]',
                },
            ];
            const args = [
                ['9000000000000000000', '79000000000000000000', '979000000000000000000', '7979000000000000000000'],
            ];
            BaseContract.strictArgumentEncodingCheck(inputAbi, args);
        });
        it('works for tuple/struct types', () => {
            const inputAbi = [
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
            ];
            const args = [
                {
                    makerAddress: '0x6ecbe1db9ef729cbe972c83fb886247691fb6beb',
                    takerAddress: '0x0000000000000000000000000000000000000000',
                    feeRecipientAddress: '0xe834ec434daba538cd1b9fe1582052b880bd7e63',
                    senderAddress: '0x0000000000000000000000000000000000000000',
                    makerAssetAmount: '0',
                    takerAssetAmount: '200000000000000000000',
                    makerFee: '1000000000000000000',
                    takerFee: '1000000000000000000',
                    expirationTimeSeconds: '1532563026',
                    salt: '59342956082154660870994022243365949771115859664887449740907298019908621891376',
                    makerAssetData: '0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48',
                    takerAssetData: '0xf47261b00000000000000000000000001d7022f5b17d2f8b695918fb48fa1089c9f85401',
                },
            ];
            BaseContract.strictArgumentEncodingCheck(inputAbi, args);
        });
        it('throws for integer overflows', () => {
            expect(() =>
                BaseContract.strictArgumentEncodingCheck([{ name: 'amount', type: 'uint8' }], ['256']),
            ).to.throw();
        });
        it('throws for fixed byte array overflows', () => {
            expect(() =>
                BaseContract.strictArgumentEncodingCheck([{ name: 'hash', type: 'bytes8' }], ['0x001122334455667788']),
            ).to.throw();
        });
    });
});
