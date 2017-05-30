import * as _ from 'lodash';
import * as chai from 'chai';
import 'mocha';
import * as BigNumber from 'bignumber.js';
import ChaiBigNumber = require('chai-bignumber');
import * as Sinon from 'sinon';
import {ZeroEx} from '../src/0x.js';
import {constants} from './utils/constants';
import {web3Factory} from './utils/web3_factory';

// Use BigNumber chai add-on
chai.use(ChaiBigNumber());
const expect = chai.expect;

describe('ZeroEx library', () => {
    describe('#getOrderHash', () => {
        const expectedOrderHash = '0x103a5e97dab5dbeb8f385636f86a7d1e458a7ccbe1bd194727f0b2f85ab116c7';
        it('defaults takerAddress to NULL address', () => {
            const orderHash = ZeroEx.getOrderHashHex(
                constants.NULL_ADDRESS,
                constants.NULL_ADDRESS,
                '',
                constants.NULL_ADDRESS,
                constants.NULL_ADDRESS,
                constants.NULL_ADDRESS,
                new BigNumber(0),
                new BigNumber(0),
                new BigNumber(0),
                new BigNumber(0),
                new BigNumber(0),
                new BigNumber(0),
            );
            expect(orderHash).to.be.equal(expectedOrderHash);
        });
        it('calculates the order hash', () => {
            const orderHash = ZeroEx.getOrderHashHex(
                constants.NULL_ADDRESS,
                constants.NULL_ADDRESS,
                constants.NULL_ADDRESS,
                constants.NULL_ADDRESS,
                constants.NULL_ADDRESS,
                constants.NULL_ADDRESS,
                new BigNumber(0),
                new BigNumber(0),
                new BigNumber(0),
                new BigNumber(0),
                new BigNumber(0),
                new BigNumber(0),
            );
            expect(orderHash).to.be.equal(expectedOrderHash);
        });
    });
    describe('#isValidSignature', () => {
        // This test data was borrowed from the JSON RPC documentation
        // Source: https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign
        const data = '0xdeadbeaf';
        const signature = {
            v: 27,
            r: '0xa3f20717a250c2b0b729b7e5becbff67fdaef7e0699da4de7ca5895b02a170a1',
            s: '0x2d887fd3b17bfdce3481f10bea41f45ba9f709d39ce8325427b57afcfc994cee',
        };
        const address = '0x9b2055d370f73ec7d8a03e965129118dc8f5bf83';
        describe('should throw if passed a malformed signature', () => {
            it('malformed v', () => {
                const malformedSignature = {
                    v: 34,
                    r: signature.r,
                    s: signature.s,
                };
                expect(() => ZeroEx.isValidSignature(data, malformedSignature, address)).to.throw();
            });
            it('r lacks 0x prefix', () => {
                const malformedR = signature.r.replace('0x', '');
                const malformedSignature = {
                    v: signature.v,
                    r: malformedR,
                    s: signature.s,
                };
                expect(() => ZeroEx.isValidSignature(data, malformedSignature, address)).to.throw();
            });
            it('r is too short', () => {
                const malformedR = signature.r.substr(10);
                const malformedSignature = {
                    v: signature.v,
                    r: malformedR,
                    s: signature.s.replace('0', 'z'),
                };
                expect(() => ZeroEx.isValidSignature(data, malformedSignature, address)).to.throw();
            });
            it('s is not hex', () => {
                const malformedS = signature.s.replace('0', 'z');
                const malformedSignature = {
                    v: signature.v,
                    r: signature.r,
                    s: malformedS,
                };
                expect(() => ZeroEx.isValidSignature(data, malformedSignature, address)).to.throw();
            });
        });
        it('should return false if the data doesn\'t pertain to the signature & address', () => {
            const isValid = ZeroEx.isValidSignature('0x0', signature, address);
            expect(isValid).to.be.false;
        });
        it('should return false if the address doesn\'t pertain to the signature & data', () => {
            const validUnrelatedAddress = '0x8b0292B11a196601eD2ce54B665CaFEca0347D42';
            const isValid = ZeroEx.isValidSignature(data, signature, validUnrelatedAddress);
            expect(isValid).to.be.false;
        });
        it('should return false if the signature doesn\'t pertain to the data & address', () => {
            const wrongSignature = _.assign({}, signature, {v: 28});
            const isValid = ZeroEx.isValidSignature(data, wrongSignature, address);
            expect(isValid).to.be.false;
        });
        it('should return true if the signature does pertain to the data & address', () => {
            const isValid = ZeroEx.isValidSignature(data, signature, address);
            expect(isValid).to.be.true;
        });
    });
    describe('#generateSalt', () => {
        it('generates different salts', () => {
            const equal = ZeroEx.generatePseudoRandomSalt().eq(ZeroEx.generatePseudoRandomSalt());
            expect(equal).to.be.false;
        });
        it('generates salt in range [0..2^256)', () => {
            const salt = ZeroEx.generatePseudoRandomSalt();
            expect(salt.greaterThanOrEqualTo(0)).to.be.true;
            const twoPow256 = new BigNumber(2).pow(256);
            expect(salt.lessThan(twoPow256)).to.be.true;
        });
    });
    describe('#isValidOrderHash', () => {
        it('returns false if the value is not a hex string', () => {
            const isValid = ZeroEx.isValidOrderHash('not a hex');
            expect(isValid).to.be.false;
        });
        it('returns false if the length is wrong', () => {
            const isValid = ZeroEx.isValidOrderHash('0xdeadbeef');
            expect(isValid).to.be.false;
        });
        it('returns true if order hash is correct', () => {
            const isValid = ZeroEx.isValidOrderHash('0x' + Array(65).join('0'));
            expect(isValid).to.be.true;
        });
    });
    describe('#toUnitAmount', () => {
        it('Should return the expected unit amount for the decimals passed in', () => {
            const baseUnitAmount = new BigNumber(1000000000);
            const decimals = 6;
            const unitAmount = ZeroEx.toUnitAmount(baseUnitAmount, decimals);
            const expectedUnitAmount = new BigNumber(1000);
            expect(unitAmount).to.be.bignumber.equal(expectedUnitAmount);
        });
    });
    describe('#toBaseUnitAmount', () => {
        it('Should return the expected base unit amount for the decimals passed in', () => {
            const unitAmount = new BigNumber(1000);
            const decimals = 6;
            const baseUnitAmount = ZeroEx.toBaseUnitAmount(unitAmount, decimals);
            const expectedUnitAmount = new BigNumber(1000000000);
            expect(baseUnitAmount).to.be.bignumber.equal(expectedUnitAmount);
        });
    });
    describe('#signOrderHashAsync', () => {
        let stubs: Sinon.SinonStub[] = [];
        afterEach(() => {
            // clean up any stubs after the test has completed
            _.each(stubs, s => s.restore());
            stubs = [];
        });
        it ('Should return the correct ECSignature on TestPRC nodeVersion', async () => {
            const orderHash = '0x6927e990021d23b1eb7b8789f6a6feaf98fe104bb0cf8259421b79f9a34222b0';
            const expectedECSignature = {
                v: 27,
                r: '0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33',
                s: '0x40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254',
            };

            const web3 = web3Factory.create();
            const zeroEx = new ZeroEx(web3);
            const ecSignature = await zeroEx.signOrderHashAsync(orderHash);
            expect(ecSignature).to.deep.equal(expectedECSignature);
        });
        it ('should return the correct ECSignature on Parity > V1.6.6', async () => {
            const newParityNodeVersion = 'Parity//v1.6.7-beta-e128418-20170518/x86_64-macos/rustc1.17.0';
            const orderHash = '0x34decbedc118904df65f379a175bb39ca18209d6ce41d5ed549d54e6e0a95004';
            // tslint:disable-next-line: max-line-length
            const signature = '0x22109d11d79cb8bf96ed88625e1cd9558800c4073332a9a02857499883ee5ce3050aa3cc1f2c435e67e114cdce54b9527b4f50548342401bc5d2b77adbdacb021b';
            const expectedECSignature = {
                v: 27,
                r: '0x22109d11d79cb8bf96ed88625e1cd9558800c4073332a9a02857499883ee5ce3',
                s: '0x050aa3cc1f2c435e67e114cdce54b9527b4f50548342401bc5d2b77adbdacb02',
            };

            const web3 = web3Factory.create();
            const zeroEx = new ZeroEx(web3);
            stubs = [
                Sinon.stub((zeroEx as any).web3Wrapper, 'getNodeVersionAsync')
                    .returns(Promise.resolve(newParityNodeVersion)),
                Sinon.stub((zeroEx as any).web3Wrapper, 'signTransactionAsync')
                    .returns(Promise.resolve(signature)),
                Sinon.stub(ZeroEx, 'isValidSignature').returns(true),
            ];

            const ecSignature = await zeroEx.signOrderHashAsync(orderHash);
            expect(ecSignature).to.deep.equal(expectedECSignature);
        });
        it ('should return the correct ECSignature on Parity < V1.6.6', async () => {
            const newParityNodeVersion = 'Parity//v1.6.6-beta-8c6e3f3-20170411/x86_64-macos/rustc1.16.0';
            const orderHash = '0xc793e33ffded933b76f2f48d9aa3339fc090399d5e7f5dec8d3660f5480793f7';
            // tslint:disable-next-line: max-line-length
            const signature = '0x1bc80bedc6756722672753413efdd749b5adbd4fd552595f59c13427407ee9aee02dea66f25a608bbae457e020fb6decb763deb8b7192abab624997242da248960';
            const expectedECSignature = {
                v: 27,
                r: '0xc80bedc6756722672753413efdd749b5adbd4fd552595f59c13427407ee9aee0',
                s: '0x2dea66f25a608bbae457e020fb6decb763deb8b7192abab624997242da248960',
            };

            const web3 = web3Factory.create();
            const zeroEx = new ZeroEx(web3);
            stubs = [
                Sinon.stub((zeroEx as any).web3Wrapper, 'getNodeVersionAsync')
                    .returns(Promise.resolve(newParityNodeVersion)),
                Sinon.stub((zeroEx as any).web3Wrapper, 'signTransactionAsync')
                    .returns(Promise.resolve(signature)),
                Sinon.stub(ZeroEx, 'isValidSignature').returns(true),
            ];

            const ecSignature = await zeroEx.signOrderHashAsync(orderHash);
            expect(ecSignature).to.deep.equal(expectedECSignature);
        });
    });
});
