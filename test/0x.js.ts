import {ZeroEx} from '../src/ts/0x.js';
import {expect} from 'chai';
import 'mocha';

describe('ZeroEx library', () => {
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
                try {
                    const isValid = ZeroEx.isValidSignature(data, malformedSignature, address);
                    throw new Error('isValidSignature should have thrown');
                } catch (err) {
                    // continue
                }
            });
            it('r lacks 0x prefix', () => {
                const malformedR = signature.r.replace('0x', '');
                const malformedSignature = {
                    v: signature.v,
                    r: malformedR,
                    s: signature.s,
                };
                try {
                    const isValid = ZeroEx.isValidSignature(data, malformedSignature, address);
                    throw new Error('isValidSignature should have thrown');
                } catch (err) {
                    // continue
                }
            });
            it('r is too short', () => {
                const malformedR = signature.r.substr(10);
                const malformedSignature = {
                    v: signature.v,
                    r: malformedR,
                    s: signature.s.replace('0', 'z'),
                };
                try {
                    const isValid = ZeroEx.isValidSignature(data, malformedSignature, address);
                    throw new Error('isValidSignature should have thrown');
                } catch (err) {
                    console.log(err);
                    // continue
                }
            });
            it('s is not hex', () => {
                const malformedS = signature.s.replace('0', 'z');
                const malformedSignature = {
                    v: signature.v,
                    r: signature.r,
                    s: malformedS,
                };
                try {
                    const isValid = ZeroEx.isValidSignature(data, malformedSignature, address);
                    throw new Error('isValidSignature should have thrown');
                } catch (err) {
                    // continue
                }
            });
        });
        it('should return false if the data doesn\'t pertain to the signature & address', () => {
            const isValid = ZeroEx.isValidSignature('wrong data', signature, address);
            expect(isValid).to.be.false;
        });
        it('should return false if the address doesn\'t pertain to the signature & data', () => {
            const validUnrelatedAddress = '0x8b0292B11a196601eD2ce54B665CaFEca0347D42';
            const isValid = ZeroEx.isValidSignature(data, signature, validUnrelatedAddress);
            expect(isValid).to.be.false;
        });
        it('should return false if the signature doesn\'t pertain to the data & address', () => {
            const wrongSignature = Object.assign({}, signature, {v: 28});
            const isValid = ZeroEx.isValidSignature(data, wrongSignature, address);
            expect(isValid).to.be.false;
        });
        it('should return true if the signature does pertain to the data & address', () => {
            const isValid = ZeroEx.isValidSignature(data, signature, address);
            expect(isValid).to.be.true;
        });
    });
});
