import { web3Factory } from '@0xproject/dev-utils';
import { JSONRPCErrorCallback, JSONRPCRequestPayload } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';
import * as Sinon from 'sinon';

import { generatePseudoRandomSalt, isValidOrderHash, isValidSignature, signOrderHashAsync } from '../src';

import { chaiSetup } from './utils/chai_setup';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;

const SHOULD_ADD_PERSONAL_MESSAGE_PREFIX = false;

describe('Signature utils', () => {
    describe('#isValidSignature', () => {
        // The Exchange smart contract `isValidSignature` method only validates orderHashes and assumes
        // the length of the data is exactly 32 bytes. Thus for these tests, we use data of this size.
        const dataHex = '0x6927e990021d23b1eb7b8789f6a6feaf98fe104bb0cf8259421b79f9a34222b0';
        const signature = {
            v: 27,
            r: '0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33',
            s: '0x40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254',
        };
        const address = '0x5409ed021d9299bf6814279a6a1411a7e866a631';
        it("should return false if the data doesn't pertain to the signature & address", async () => {
            expect(isValidSignature('0x0', signature, address)).to.be.false();
        });
        it("should return false if the address doesn't pertain to the signature & data", async () => {
            const validUnrelatedAddress = '0x8b0292b11a196601ed2ce54b665cafeca0347d42';
            expect(isValidSignature(dataHex, signature, validUnrelatedAddress)).to.be.false();
        });
        it("should return false if the signature doesn't pertain to the dataHex & address", async () => {
            const wrongSignature = _.assign({}, signature, { v: 28 });
            expect(isValidSignature(dataHex, wrongSignature, address)).to.be.false();
        });
        it('should return true if the signature does pertain to the dataHex & address', async () => {
            const isValidSignatureLocal = isValidSignature(dataHex, signature, address);
            expect(isValidSignatureLocal).to.be.true();
        });
    });
    describe('#generateSalt', () => {
        it('generates different salts', () => {
            const equal = generatePseudoRandomSalt().eq(generatePseudoRandomSalt());
            expect(equal).to.be.false();
        });
        it('generates salt in range [0..2^256)', () => {
            const salt = generatePseudoRandomSalt();
            expect(salt.greaterThanOrEqualTo(0)).to.be.true();
            const twoPow256 = new BigNumber(2).pow(256);
            expect(salt.lessThan(twoPow256)).to.be.true();
        });
    });
    describe('#isValidOrderHash', () => {
        it('returns false if the value is not a hex string', () => {
            const isValid = isValidOrderHash('not a hex');
            expect(isValid).to.be.false();
        });
        it('returns false if the length is wrong', () => {
            const isValid = isValidOrderHash('0xdeadbeef');
            expect(isValid).to.be.false();
        });
        it('returns true if order hash is correct', () => {
            const isValid = isValidOrderHash('0x' + Array(65).join('0'));
            expect(isValid).to.be.true();
        });
    });
    describe('#signOrderHashAsync', () => {
        let stubs: Sinon.SinonStub[] = [];
        let makerAddress: string;
        before(async () => {
            const availableAddreses = await web3Wrapper.getAvailableAddressesAsync();
            makerAddress = availableAddreses[0];
        });
        afterEach(() => {
            // clean up any stubs after the test has completed
            _.each(stubs, s => s.restore());
            stubs = [];
        });
        it('Should return the correct ECSignature', async () => {
            const orderHash = '0x6927e990021d23b1eb7b8789f6a6feaf98fe104bb0cf8259421b79f9a34222b0';
            const expectedECSignature = {
                v: 27,
                r: '0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33',
                s: '0x40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254',
            };
            const ecSignature = await signOrderHashAsync(
                provider,
                orderHash,
                makerAddress,
                SHOULD_ADD_PERSONAL_MESSAGE_PREFIX,
            );
            expect(ecSignature).to.deep.equal(expectedECSignature);
        });
        it('should return the correct ECSignature for signatureHex concatenated as R + S + V', async () => {
            const orderHash = '0x34decbedc118904df65f379a175bb39ca18209d6ce41d5ed549d54e6e0a95004';
            const signature =
                '0x22109d11d79cb8bf96ed88625e1cd9558800c4073332a9a02857499883ee5ce3050aa3cc1f2c435e67e114cdce54b9527b4f50548342401bc5d2b77adbdacb021b';
            const expectedECSignature = {
                v: 27,
                r: '0x22109d11d79cb8bf96ed88625e1cd9558800c4073332a9a02857499883ee5ce3',
                s: '0x050aa3cc1f2c435e67e114cdce54b9527b4f50548342401bc5d2b77adbdacb02',
            };
            stubs = [Sinon.stub('isValidSignature').returns(true)];

            const fakeProvider = {
                sendAsync(payload: JSONRPCRequestPayload, callback: JSONRPCErrorCallback) {
                    if (payload.method === 'eth_sign') {
                        callback(null, { id: 42, jsonrpc: '2.0', result: signature });
                    } else {
                        callback(null, { id: 42, jsonrpc: '2.0', result: [makerAddress] });
                    }
                },
            };

            const ecSignature = await signOrderHashAsync(
                fakeProvider,
                orderHash,
                makerAddress,
                SHOULD_ADD_PERSONAL_MESSAGE_PREFIX,
            );
            expect(ecSignature).to.deep.equal(expectedECSignature);
        });
        it('should return the correct ECSignature for signatureHex concatenated as V + R + S', async () => {
            const orderHash = '0xc793e33ffded933b76f2f48d9aa3339fc090399d5e7f5dec8d3660f5480793f7';
            const signature =
                '0x1bc80bedc6756722672753413efdd749b5adbd4fd552595f59c13427407ee9aee02dea66f25a608bbae457e020fb6decb763deb8b7192abab624997242da248960';
            const expectedECSignature = {
                v: 27,
                r: '0xc80bedc6756722672753413efdd749b5adbd4fd552595f59c13427407ee9aee0',
                s: '0x2dea66f25a608bbae457e020fb6decb763deb8b7192abab624997242da248960',
            };
            stubs = [Sinon.stub('isValidSignature').returns(true)];
            const fakeProvider = {
                sendAsync(payload: JSONRPCRequestPayload, callback: JSONRPCErrorCallback) {
                    if (payload.method === 'eth_sign') {
                        callback(null, { id: 42, jsonrpc: '2.0', result: signature });
                    } else {
                        callback(null, { id: 42, jsonrpc: '2.0', result: [makerAddress] });
                    }
                },
            };

            const ecSignature = await signOrderHashAsync(
                fakeProvider,
                orderHash,
                makerAddress,
                SHOULD_ADD_PERSONAL_MESSAGE_PREFIX,
            );
            expect(ecSignature).to.deep.equal(expectedECSignature);
        });
    });
});
