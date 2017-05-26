import 'mocha';
import * as chai from 'chai';
import chaiAsPromised = require('chai-as-promised');
import {web3Factory} from './utils/web3_factory';
import * as Web3 from 'web3';
import {ExchangeWrapper} from '../src/ts/contract_wrappers/exchange_wrapper';
import {BlockchainClean} from './utils/blockchain_clean';
import {Web3Wrapper} from './../src/ts/web3_wrapper';

const expect = chai.expect;
chai.use(chaiAsPromised);
const blockchainClean = new BlockchainClean();

describe('ExchangeWrapper', () => {
    let web3Wrapper: Web3Wrapper;
    let exchangeWrapper: ExchangeWrapper;
    before(async () => {
        const web3 = web3Factory.create();
        web3Wrapper = new Web3Wrapper(web3);
        exchangeWrapper = new ExchangeWrapper(web3Wrapper);
    });
    beforeEach(async () => {
        await blockchainClean.setupAsync();
    });
    afterEach(async () => {
        await blockchainClean.restoreAsync();
    });
    describe('#isValidSignatureAsync', () => {
        // The Exchange smart contract `isValidSignature` method only validates orderHashes and assumes
        // the length of the data is exactly 32 bytes. Thus for these tests, we use data of this size.
        const dataHex = '0x6927e990021d23b1eb7b8789f6a6feaf98fe104bb0cf8259421b79f9a34222b0';
        const signature = {
            v: 27,
            r: '0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33',
            s: '0x40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254',
        };
        const address = '0x5409ed021d9299bf6814279a6a1411a7e866a631';
        describe('should throw if passed a malformed signature', () => {
            it('malformed v', async () => {
                const malformedSignature = {
                    v: 34,
                    r: signature.r,
                    s: signature.s,
                };
                expect(exchangeWrapper.isValidSignatureAsync(dataHex, malformedSignature, address))
                    .to.be.rejected;
            });
            it('r lacks 0x prefix', () => {
                const malformedR = signature.r.replace('0x', '');
                const malformedSignature = {
                    v: signature.v,
                    r: malformedR,
                    s: signature.s,
                };
                expect(exchangeWrapper.isValidSignatureAsync(dataHex, malformedSignature, address))
                    .to.be.rejected;
            });
            it('r is too short', () => {
                const malformedR = signature.r.substr(10);
                const malformedSignature = {
                    v: signature.v,
                    r: malformedR,
                    s: signature.s.replace('0', 'z'),
                };
                expect(exchangeWrapper.isValidSignatureAsync(dataHex, malformedSignature, address))
                    .to.be.rejected;
            });
            it('s is not hex', () => {
                const malformedS = signature.s.replace('0', 'z');
                const malformedSignature = {
                    v: signature.v,
                    r: signature.r,
                    s: malformedS,
                };
                expect(exchangeWrapper.isValidSignatureAsync(dataHex, malformedSignature, address))
                    .to.be.rejected;
            });
        });
        it('should return false if the data doesn\'t pertain to the signature & address', async () => {
            const isValid = await exchangeWrapper.isValidSignatureAsync('0x0', signature, address);
            expect(isValid).to.be.false;
        });
        it('should return false if the address doesn\'t pertain to the signature & dataHex', async () => {
            const validUnrelatedAddress = '0x8b0292B11a196601eD2ce54B665CaFEca0347D42';
            const isValid = await exchangeWrapper.isValidSignatureAsync(dataHex, signature, validUnrelatedAddress);
            expect(isValid).to.be.false;
        });
        it('should return false if the signature doesn\'t pertain to the dataHex & address', async () => {
            const wrongSignature = Object.assign({}, signature, {v: 28});
            const isValid = await exchangeWrapper.isValidSignatureAsync(dataHex, wrongSignature, address);
            expect(isValid).to.be.false;
        });
        it('should return true if the signature does pertain to the dataHex & address', async () => {
            const isValid = await exchangeWrapper.isValidSignatureAsync(dataHex, signature, address);
            expect(isValid).to.be.true;
        });
    });
});
