import * as _ from 'lodash';
import * as chai from 'chai';
import 'mocha';
import * as BigNumber from 'bignumber.js';
import ChaiBigNumber = require('chai-bignumber');
import {ZeroEx} from '../src/0x.js';
import {constants} from './utils/constants';

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
});
