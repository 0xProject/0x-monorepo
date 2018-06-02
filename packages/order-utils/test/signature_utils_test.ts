import { web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import { JSONRPCErrorCallback, JSONRPCRequestPayload } from 'ethereum-types';
import * as _ from 'lodash';
import 'make-promises-safe';
import 'mocha';
import * as Sinon from 'sinon';

import { ecSignOrderHashAsync, generatePseudoRandomSalt, MessagePrefixType, orderHashUtils } from '../src';
import { isValidECSignature, isValidSignatureAsync } from '../src/signature_utils';

import { chaiSetup } from './utils/chai_setup';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;

describe('Signature utils', () => {
    describe('#isValidSignature', () => {
        let dataHex = '0x6927e990021d23b1eb7b8789f6a6feaf98fe104bb0cf8259421b79f9a34222b0';
        const ethSignSignature =
            '0x1B61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc3340349190569279751135161d22529dc25add4f6069af05be04cacbda2ace225403';
        let address = '0x5409ed021d9299bf6814279a6a1411a7e866a631';

        it("should return false if the data doesn't pertain to the signature & address", async () => {
            expect(await isValidSignatureAsync(provider, '0x0', ethSignSignature, address)).to.be.false();
        });
        it("should return false if the address doesn't pertain to the signature & data", async () => {
            const validUnrelatedAddress = '0x8b0292b11a196601ed2ce54b665cafeca0347d42';
            expect(
                await isValidSignatureAsync(provider, dataHex, ethSignSignature, validUnrelatedAddress),
            ).to.be.false();
        });
        it("should return false if the signature doesn't pertain to the dataHex & address", async () => {
            const signatureArray = ethSignSignature.split('');
            // tslint:disable-next-line:custom-no-magic-numbers
            signatureArray[5] = 'C'; // V = 28, instead of 27
            const wrongSignature = signatureArray.join('');
            expect(await isValidSignatureAsync(provider, dataHex, wrongSignature, address)).to.be.false();
        });

        it('should throw if signatureType is invalid', () => {
            const signatureArray = ethSignSignature.split('');
            signatureArray[3] = '9'; // SignatureType w/ index 9 doesn't exist
            const signatureWithInvalidType = signatureArray.join('');
            expect(isValidSignatureAsync(provider, dataHex, signatureWithInvalidType, address)).to.be.rejected();
        });

        it('should return true for a valid Ecrecover (EthSign) signature', async () => {
            const isValidSignatureLocal = await isValidSignatureAsync(provider, dataHex, ethSignSignature, address);
            expect(isValidSignatureLocal).to.be.true();
        });

        it('should return true for a valid EIP712 signature', async () => {
            dataHex = '0xa1d7403bcbbcd75ec233cfd6584ff8dabed677d0e9bb32c2bea94e9dd8a109da';
            address = '0x6ecbe1db9ef729cbe972c83fb886247691fb6beb';
            const eip712Signature =
                '0x1bdde07aac4bf12c12ddbb155919c43eba4146a2cfcf904a862950dbebe332554c6674975603eb5a4eaf8fd7f2e06350267e5b36cda9851a89f8bb49fe2fc9afe202';
            const isValidSignatureLocal = await isValidSignatureAsync(provider, dataHex, eip712Signature, address);
            expect(isValidSignatureLocal).to.be.true();
        });

        it('should return true for a valid Trezor signature', async () => {
            dataHex = '0xd0d994e31c88f33fd8a572552a70ed339de579e5ba49ee1d17cc978bbe1cdd21';
            address = '0x6ecbe1db9ef729cbe972c83fb886247691fb6beb';
            const trezorSignature =
                '0x1ce4760660e6495b5ae6723087bea073b3a99ce98ea81fdf00c240279c010e63d05b87bc34c4d67d4776e8d5aeb023a67484f4eaf0fd353b40893e5101e845cd9908';
            const isValidSignatureLocal = await isValidSignatureAsync(provider, dataHex, trezorSignature, address);
            expect(isValidSignatureLocal).to.be.true();
        });
    });
    describe('#isValidECSignature', () => {
        const signature = {
            v: 27,
            r: '0xaca7da997ad177f040240cdccf6905b71ab16b74434388c3a72f34fd25d64393',
            s: '0x46b2bac274ff29b48b3ea6e2d04c1336eaceafda3c53ab483fc3ff12fac3ebf2',
        };
        const data = '0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad';
        const address = '0x0e5cb767cce09a7f3ca594df118aa519be5e2b5a';

        it("should return false if the data doesn't pertain to the signature & address", async () => {
            expect(isValidECSignature('0x0', signature, address)).to.be.false();
        });
        it("should return false if the address doesn't pertain to the signature & data", async () => {
            const validUnrelatedAddress = '0x8b0292b11a196601ed2ce54b665cafeca0347d42';
            expect(isValidECSignature(data, signature, validUnrelatedAddress)).to.be.false();
        });
        it("should return false if the signature doesn't pertain to the data & address", async () => {
            const wrongSignature = _.assign({}, signature, { v: 28 });
            expect(isValidECSignature(data, wrongSignature, address)).to.be.false();
        });
        it('should return true if the signature does pertain to the data & address', async () => {
            const isValidSignatureLocal = isValidECSignature(data, signature, address);
            expect(isValidSignatureLocal).to.be.true();
        });
    });
    describe('#generateSalt', () => {
        it('generates different salts', () => {
            const isEqual = generatePseudoRandomSalt().eq(generatePseudoRandomSalt());
            expect(isEqual).to.be.false();
        });
        it('generates salt in range [0..2^256)', () => {
            const salt = generatePseudoRandomSalt();
            expect(salt.greaterThanOrEqualTo(0)).to.be.true();
            // tslint:disable-next-line:custom-no-magic-numbers
            const twoPow256 = new BigNumber(2).pow(256);
            expect(salt.lessThan(twoPow256)).to.be.true();
        });
    });
    describe('#ecSignOrderHashAsync', () => {
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
            const messagePrefixOpts = {
                prefixType: MessagePrefixType.EthSign,
                shouldAddPrefixBeforeCallingEthSign: false,
            };
            const ecSignature = await ecSignOrderHashAsync(provider, orderHash, makerAddress, messagePrefixOpts);
            expect(ecSignature).to.deep.equal(expectedECSignature);
        });
        it('should return the correct ECSignature for signatureHex concatenated as R + S + V', async () => {
            const orderHash = '0x34decbedc118904df65f379a175bb39ca18209d6ce41d5ed549d54e6e0a95004';
            const expectedECSignature = {
                v: 27,
                r: '0x117902c86dfb95fe0d1badd983ee166ad259b27acb220174cbb4460d87287113',
                s: '0x7feabdfe76e05924b484789f79af4ee7fa29ec006cedce1bbf369320d034e10b',
            };

            const fakeProvider = {
                async sendAsync(payload: JSONRPCRequestPayload, callback: JSONRPCErrorCallback): Promise<void> {
                    if (payload.method === 'eth_sign') {
                        const [address, message] = payload.params;
                        const signature = await web3Wrapper.signMessageAsync(address, message);
                        // tslint:disable-next-line:custom-no-magic-numbers
                        const rsvHex = `0x${signature.substr(130)}${signature.substr(2, 128)}`;
                        callback(null, {
                            id: 42,
                            jsonrpc: '2.0',
                            result: rsvHex,
                        });
                    } else {
                        callback(null, { id: 42, jsonrpc: '2.0', result: [makerAddress] });
                    }
                },
            };

            const messagePrefixOpts = {
                prefixType: MessagePrefixType.EthSign,
                shouldAddPrefixBeforeCallingEthSign: false,
            };
            const ecSignature = await ecSignOrderHashAsync(fakeProvider, orderHash, makerAddress, messagePrefixOpts);
            expect(ecSignature).to.deep.equal(expectedECSignature);
        });
        it('should return the correct ECSignature for signatureHex concatenated as V + R + S', async () => {
            const orderHash = '0x34decbedc118904df65f379a175bb39ca18209d6ce41d5ed549d54e6e0a95004';
            const expectedECSignature = {
                v: 27,
                r: '0x117902c86dfb95fe0d1badd983ee166ad259b27acb220174cbb4460d87287113',
                s: '0x7feabdfe76e05924b484789f79af4ee7fa29ec006cedce1bbf369320d034e10b',
            };
            const fakeProvider = {
                async sendAsync(payload: JSONRPCRequestPayload, callback: JSONRPCErrorCallback): Promise<void> {
                    if (payload.method === 'eth_sign') {
                        const [address, message] = payload.params;
                        const signature = await web3Wrapper.signMessageAsync(address, message);
                        callback(null, {
                            id: 42,
                            jsonrpc: '2.0',
                            result: signature,
                        });
                    } else {
                        callback(null, { id: 42, jsonrpc: '2.0', result: [makerAddress] });
                    }
                },
            };

            const messagePrefixOpts = {
                prefixType: MessagePrefixType.EthSign,
                shouldAddPrefixBeforeCallingEthSign: false,
            };
            const ecSignature = await ecSignOrderHashAsync(fakeProvider, orderHash, makerAddress, messagePrefixOpts);
            expect(ecSignature).to.deep.equal(expectedECSignature);
        });
    });
});
