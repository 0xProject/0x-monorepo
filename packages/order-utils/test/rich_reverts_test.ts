import { ObjectMap } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import * as RichReverts from '../src/rich_reverts';
import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;
const assert = chai.assert;

describe.only('RichRevertReasons', () => {
    type ValueTypes = number | string | boolean | BigNumber | undefined;

    describe('decoding', () => {
        interface DecoderTestData {
            cls: {name: string},
            values: ObjectMap<ValueTypes>,
            encoded: string
        };

        const decoderTests: ObjectMap<DecoderTestData> = {
            'Error(string message)': {
                cls: RichReverts.StandardError,
                values: {message: 'foobar'},
                encoded: '0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000006666f6f6261720000000000000000000000000000000000000000000000000000'
            },
            'OrderStatusError(bytes32 orderHash, uint8 status)': {
                cls: RichReverts.OrderStatusError,
                values: {orderHash: '0xbc755a65e55fc0dfe7fdae9b4d15e5e7aa9796df8dcf2171600bc9e02a222284', status: 33},
                encoded: '0xfdb6ca8dbc755a65e55fc0dfe7fdae9b4d15e5e7aa9796df8dcf2171600bc9e02a2222840000000000000000000000000000000000000000000000000000000000000021'
            },
            'InvalidSenderError(bytes32 orderHash, address sender)': {
                cls: RichReverts.InvalidSenderError,
                values: {orderHash: '0xf143387d299336f0ae8258cec528106818834ee3ffcdde1d82411f1ae66006e7', sender: '0x96be2510ab6e1e5de1283fe20119ca35d14b5825'},
                encoded: '0x95b59997f143387d299336f0ae8258cec528106818834ee3ffcdde1d82411f1ae66006e700000000000000000000000096be2510ab6e1e5de1283fe20119ca35d14b5825'
            },
            'EpochOrderError(address maker, address sender, uint256 currentEpoch)': {
                cls: RichReverts.EpochOrderError,
                values: {maker: '0xcd37803549a964fe6430322217b8295fe6a9dbf8', sender: '0xf3fe56c9f9274855a67ee0c6bbb3bf967317bade', currentEpoch: new BigNumber('1334113121311294013884102')},
                encoded: '0x33f91892000000000000000000000000cd37803549a964fe6430322217b8295fe6a9dbf8000000000000000000000000f3fe56c9f9274855a67ee0c6bbb3bf967317bade000000000000000000000000000000000000000000011a826acf265da3d4c6c6'
            },
            'AssetProxyExistsError(address proxy)': {
                cls: RichReverts.AssetProxyExistsError,
                values: {proxy: '0xf6ec8aed0f4a730d7b9f62ecec9624dd493adbc2'},
                encoded: '0xcc8b3b53000000000000000000000000f6ec8aed0f4a730d7b9f62ecec9624dd493adbc2'
            },
            'TransactionExecutionError(uint8 error)': {
                cls: RichReverts.TransactionExecutionError,
                values: {error: 66},
                encoded: '0x91e56ab90000000000000000000000000000000000000000000000000000000000000042'
            }
        };

        for (const signature of Object.keys(decoderTests)) {
            it(`can decode ${signature}`, () => {
                const testData = decoderTests[signature];
                const reason = RichReverts.RichRevertReason.decode(testData.encoded);
                expect(reason.constructor).to.be.eq(testData.cls);
                expect(reason.values).to.be.deep.eq(testData.values);
            });
        }

        it('can\'t decode an error with unknown selector', () => {
            const encoded = '0x827c7713000000000000000000000000676ca4badc786f18572163b66efce1372e5c6a04';
            expect(() => RichReverts.RichRevertReason.decode(encoded)).to.throw();
        });
    });

    describe("equality checks", () => {
        it('does not matches two instances of different types', () => {
            const a = new RichReverts.OrderStatusError();
            const b = new RichReverts.SignatureError()
            assert.isNotOk(a.equals(b));
        })
        it('matches two empty instances of the same type', () => {
            const a = new RichReverts.OrderStatusError();
            const b = new RichReverts.OrderStatusError()
            assert.ok(a.equals(b));
        })
        it('matches instances of the same type with the same values', () => {
            const a = new RichReverts.OrderStatusError('0x12345', 55);
            const b = new RichReverts.OrderStatusError('0x12345', 55);
            assert.ok(a.equals(b));
        })
        it('does not match instances of the same type with different values', () => {
            const a = new RichReverts.OrderStatusError('0xf00b4b', 55);
            const b = new RichReverts.OrderStatusError('0xf00b4b', 51);
            assert.isNotOk(a.equals(b));
        })
        it('matches instances of the same type with omitted values', () => {
            const a = new RichReverts.OrderStatusError('0xf00b4b', 55);
            const b = new RichReverts.OrderStatusError('0xf00b4b');
            assert.ok(a.equals(b));
        })
    });
});
