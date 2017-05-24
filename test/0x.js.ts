import {ZeroEx} from '../src/ts/0x.js';
import {expect} from 'chai';
import 'mocha';

describe('ZeroEx library', () => {
    describe('#isValidSignature', () => {
        // Source: https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign
        const data = '0xdeadbeaf';
        const signature = {
            v: 27,
            r: '0xa3f20717a250c2b0b729b7e5becbff67fdaef7e0699da4de7ca5895b02a170a1',
            s: '0x2d887fd3b17bfdce3481f10bea41f45ba9f709d39ce8325427b57afcfc994cee',
        };
        const address = '0x9b2055d370f73ec7d8a03e965129118dc8f5bf83';
        describe('should return false for malformed signature', () => {
            it('malformed v', () => {
                const malformedSignature = {
                    v: 34,
                    r: signature.r,
                    s: signature.s,
                };
                const isValid = ZeroEx.isValidSignature(data, malformedSignature, address);
                expect(isValid).to.be.false;
            });
            it('malformed r', () => {
                const malformedSignature = {
                    v: signature.v,
                    r: signature.r.replace('0x', ''),
                    s: signature.s,
                };
                const isValid = ZeroEx.isValidSignature(data, malformedSignature, address);
                expect(isValid).to.be.false;
            });
        });
        describe('should return false for invalid signature', () => {
            it('wrong data', () => {
                const isValid = ZeroEx.isValidSignature('wrong data', signature, address);
                expect(isValid).to.be.false;
            });
            it('wrong signer', () => {
                const isValid = ZeroEx.isValidSignature(data, signature, '0xIamWrong');
                expect(isValid).to.be.false;
            });
            it('wrong signature', () => {
                const wrongSignature = Object.assign({}, signature, {v: 28});
                const isValid = ZeroEx.isValidSignature(data, wrongSignature, address);
                expect(isValid).to.be.false;
            });
        });
        it('should return true for valid signature', () => {
            const isValid = ZeroEx.isValidSignature(data, signature, address);
            expect(isValid).to.be.true;
        });
    });
});
