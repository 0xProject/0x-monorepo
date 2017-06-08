import * as _ from 'lodash';
import * as chai from 'chai';
import {chaiSetup} from './utils/chai_setup';
import 'mocha';
import * as BigNumber from 'bignumber.js';
import * as Sinon from 'sinon';
import {ZeroEx} from '../src/0x.js';
import {constants} from './utils/constants';
import {Order} from '../src/types';
import {ECSignature} from '../src/types';
import {web3Factory} from './utils/web3_factory';

chaiSetup.configure();
const expect = chai.expect;

describe('ZeroEx library', () => {
    describe('#setProvider', () => {
        it('overrides provider in nested web3s and invalidates contractInstances', async () => {
            const web3 = web3Factory.create();
            const zeroEx = new ZeroEx(web3);
            // Instantiate the contract instances with the current provider
            await (zeroEx.exchange as any).getExchangeContractAsync();
            await (zeroEx.tokenRegistry as any).getTokenRegistryContractAsync();
            expect((zeroEx.exchange as any).exchangeContractIfExists).to.not.be.undefined();
            expect((zeroEx.tokenRegistry as any).tokenRegistryContractIfExists).to.not.be.undefined();

            const newProvider = web3Factory.getRpcProvider();
            // Add property to newProvider so that we can differentiate it from old provider
            (newProvider as any).zeroExTestId = 1;
            await zeroEx.setProviderAsync(newProvider);

            // Check that contractInstances with old provider are removed after provider update
            expect((zeroEx.exchange as any).exchangeContractIfExists).to.be.undefined();
            expect((zeroEx.tokenRegistry as any).tokenRegistryContractIfExists).to.be.undefined();

            // Check that all nested web3 instances return the updated provider
            const nestedWeb3WrapperProvider = (zeroEx as any).web3Wrapper.getCurrentProvider();
            expect((nestedWeb3WrapperProvider as any).zeroExTestId).to.be.a('number');
            const exchangeWeb3WrapperProvider = (zeroEx.exchange as any).web3Wrapper.getCurrentProvider();
            expect((exchangeWeb3WrapperProvider as any).zeroExTestId).to.be.a('number');
            const tokenRegistryWeb3WrapperProvider = (zeroEx.tokenRegistry as any).web3Wrapper.getCurrentProvider();
            expect((tokenRegistryWeb3WrapperProvider as any).zeroExTestId).to.be.a('number');
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
        const web3 = web3Factory.create();
        const zeroEx = new ZeroEx(web3);
        it('should return false if the data doesn\'t pertain to the signature & address', async () => {
            expect(ZeroEx.isValidSignature('0x0', signature, address)).to.be.false();
            return expect(
                (zeroEx.exchange as any).isValidSignatureUsingContractCallAsync('0x0', signature, address),
            ).to.become(false);
        });
        it('should return false if the address doesn\'t pertain to the signature & data', async () => {
            const validUnrelatedAddress = '0x8b0292B11a196601eD2ce54B665CaFEca0347D42';
            expect(ZeroEx.isValidSignature(data, signature, validUnrelatedAddress)).to.be.false();
            return expect(
                (zeroEx.exchange as any).isValidSignatureUsingContractCallAsync(data, signature, validUnrelatedAddress),
            ).to.become(false);
        });
        it('should return false if the signature doesn\'t pertain to the data & address', async () => {
            const wrongSignature = _.assign({}, signature, {v: 28});
            expect(ZeroEx.isValidSignature(data, wrongSignature, address)).to.be.false();
            return expect(
                (zeroEx.exchange as any).isValidSignatureUsingContractCallAsync(data, wrongSignature, address),
            ).to.become(false);
        });
        it('should return true if the signature does pertain to the data & address', async () => {
            expect(ZeroEx.isValidSignature(data, signature, address)).to.be.true();
            return expect(
                (zeroEx.exchange as any).isValidSignatureUsingContractCallAsync(data, signature, address),
            ).to.become(true);
        });
    });
    describe('#generateSalt', () => {
        it('generates different salts', () => {
            const equal = ZeroEx.generatePseudoRandomSalt().eq(ZeroEx.generatePseudoRandomSalt());
            expect(equal).to.be.false();
        });
        it('generates salt in range [0..2^256)', () => {
            const salt = ZeroEx.generatePseudoRandomSalt();
            expect(salt.greaterThanOrEqualTo(0)).to.be.true();
            const twoPow256 = new BigNumber(2).pow(256);
            expect(salt.lessThan(twoPow256)).to.be.true();
        });
    });
    describe('#isValidOrderHash', () => {
        it('returns false if the value is not a hex string', () => {
            const isValid = ZeroEx.isValidOrderHash('not a hex');
            expect(isValid).to.be.false();
        });
        it('returns false if the length is wrong', () => {
            const isValid = ZeroEx.isValidOrderHash('0xdeadbeef');
            expect(isValid).to.be.false();
        });
        it('returns true if order hash is correct', () => {
            const isValid = ZeroEx.isValidOrderHash('0x' + Array(65).join('0'));
            expect(isValid).to.be.true();
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
    describe('#getOrderHashHexAsync', () => {
        const exchangeContractAddress = constants.NULL_ADDRESS;
        const expectedOrderHash = '0x103a5e97dab5dbeb8f385636f86a7d1e458a7ccbe1bd194727f0b2f85ab116c7';
        const order: Order = {
            maker: constants.NULL_ADDRESS,
            taker: constants.NULL_ADDRESS,
            feeRecipient: constants.NULL_ADDRESS,
            makerTokenAddress: constants.NULL_ADDRESS,
            takerTokenAddress: constants.NULL_ADDRESS,
            salt: new BigNumber(0),
            makerFee: new BigNumber(0),
            takerFee: new BigNumber(0),
            makerTokenAmount: new BigNumber(0),
            takerTokenAmount: new BigNumber(0),
            expirationUnixTimestampSec: new BigNumber(0),
        };
        let stubs: Sinon.SinonStub[] = [];
        afterEach(() => {
            // clean up any stubs after the test has completed
            _.each(stubs, s => s.restore());
            stubs = [];
        });
        it('calculates the order hash', async () => {
            const web3 = web3Factory.create();
            const zeroEx = new ZeroEx(web3);

            stubs = [
                Sinon.stub((zeroEx as any), 'getExchangeAddressAsync')
                    .returns(Promise.resolve(exchangeContractAddress)),
            ];

            const orderHash = await zeroEx.getOrderHashHexAsync(order);
            expect(orderHash).to.be.equal(expectedOrderHash);
        });
    });
    describe('#signOrderHashAsync', () => {
        let stubs: Sinon.SinonStub[] = [];
        let makerAddress: string;
        const web3 = web3Factory.create();
        const zeroEx = new ZeroEx(web3);
        before(async () => {
            const availableAddreses = await zeroEx.getAvailableAddressesAsync();
            makerAddress = availableAddreses[0];
        });
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
            const ecSignature = await zeroEx.signOrderHashAsync(orderHash, makerAddress);
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
            stubs = [
                Sinon.stub((zeroEx as any).web3Wrapper, 'getNodeVersionAsync')
                    .returns(Promise.resolve(newParityNodeVersion)),
                Sinon.stub((zeroEx as any).web3Wrapper, 'signTransactionAsync')
                    .returns(Promise.resolve(signature)),
                Sinon.stub(ZeroEx, 'isValidSignature').returns(true),
            ];

            const ecSignature = await zeroEx.signOrderHashAsync(orderHash, makerAddress);
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
            stubs = [
                Sinon.stub((zeroEx as any).web3Wrapper, 'getNodeVersionAsync')
                    .returns(Promise.resolve(newParityNodeVersion)),
                Sinon.stub((zeroEx as any).web3Wrapper, 'signTransactionAsync')
                    .returns(Promise.resolve(signature)),
                Sinon.stub(ZeroEx, 'isValidSignature').returns(true),
            ];

            const ecSignature = await zeroEx.signOrderHashAsync(orderHash, makerAddress);
            expect(ecSignature).to.deep.equal(expectedECSignature);
        });
    });
});
