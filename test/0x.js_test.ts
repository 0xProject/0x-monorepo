import * as _ from 'lodash';
import * as chai from 'chai';
import {chaiSetup} from './utils/chai_setup';
import 'mocha';
import * as BigNumber from 'bignumber.js';
import * as Sinon from 'sinon';
import {ZeroEx, Order, ZeroExError, LogWithDecodedArgs} from '../src';
import {constants} from './utils/constants';
import {TokenUtils} from './utils/token_utils';
import {web3Factory} from './utils/web3_factory';
import {BlockchainLifecycle} from './utils/blockchain_lifecycle';

const blockchainLifecycle = new BlockchainLifecycle();
chaiSetup.configure();
const expect = chai.expect;

describe('ZeroEx library', () => {
    const web3 = web3Factory.create();
    const zeroEx = new ZeroEx(web3.currentProvider);
    describe('#setProvider', () => {
        it('overrides provider in nested web3s and invalidates contractInstances', async () => {
            // Instantiate the contract instances with the current provider
            await (zeroEx.exchange as any)._getExchangeContractAsync();
            await (zeroEx.tokenRegistry as any)._getTokenRegistryContractAsync();
            expect((zeroEx.exchange as any)._exchangeContractIfExists).to.not.be.undefined();
            expect((zeroEx.tokenRegistry as any)._tokenRegistryContractIfExists).to.not.be.undefined();

            const newProvider = web3Factory.getRpcProvider();
            // Add property to newProvider so that we can differentiate it from old provider
            (newProvider as any).zeroExTestId = 1;
            await zeroEx.setProviderAsync(newProvider);

            // Check that contractInstances with old provider are removed after provider update
            expect((zeroEx.exchange as any)._exchangeContractIfExists).to.be.undefined();
            expect((zeroEx.tokenRegistry as any)._tokenRegistryContractIfExists).to.be.undefined();

            // Check that all nested web3 wrapper instances return the updated provider
            const nestedWeb3WrapperProvider = (zeroEx as any)._web3Wrapper.getCurrentProvider();
            expect((nestedWeb3WrapperProvider as any).zeroExTestId).to.be.a('number');
            const exchangeWeb3WrapperProvider = (zeroEx.exchange as any)._web3Wrapper.getCurrentProvider();
            expect((exchangeWeb3WrapperProvider as any).zeroExTestId).to.be.a('number');
            const tokenRegistryWeb3WrapperProvider = (zeroEx.tokenRegistry as any)._web3Wrapper.getCurrentProvider();
            expect((tokenRegistryWeb3WrapperProvider as any).zeroExTestId).to.be.a('number');
        });
    });
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
        it('should return false if the data doesn\'t pertain to the signature & address', async () => {
            expect(ZeroEx.isValidSignature('0x0', signature, address)).to.be.false();
            return expect(
                (zeroEx.exchange as any)._isValidSignatureUsingContractCallAsync('0x0', signature, address),
            ).to.become(false);
        });
        it('should return false if the address doesn\'t pertain to the signature & data', async () => {
            const validUnrelatedAddress = '0x8b0292b11a196601ed2ce54b665cafeca0347d42';
            expect(ZeroEx.isValidSignature(dataHex, signature, validUnrelatedAddress)).to.be.false();
            return expect(
                (zeroEx.exchange as any)._isValidSignatureUsingContractCallAsync(dataHex, signature,
                                                                                validUnrelatedAddress),
            ).to.become(false);
        });
        it('should return false if the signature doesn\'t pertain to the dataHex & address', async () => {
            const wrongSignature = _.assign({}, signature, {v: 28});
            expect(ZeroEx.isValidSignature(dataHex, wrongSignature, address)).to.be.false();
            return expect(
                (zeroEx.exchange as any)._isValidSignatureUsingContractCallAsync(dataHex, wrongSignature, address),
            ).to.become(false);
        });
        it('should return true if the signature does pertain to the dataHex & address', async () => {
            const isValidSignatureLocal = ZeroEx.isValidSignature(dataHex, signature, address);
            expect(isValidSignatureLocal).to.be.true();
            const isValidSignatureOnContract = await (zeroEx.exchange as any)
                ._isValidSignatureUsingContractCallAsync(dataHex, signature, address);
            return expect(isValidSignatureOnContract).to.be.true();
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
    describe('#getOrderHashHex', () => {
        const expectedOrderHash = '0x39da987067a3c9e5f1617694f1301326ba8c8b0498ebef5df4863bed394e3c83';
        const fakeExchangeContractAddress = '0xb69e673309512a9d726f87304c6984054f87a93b';
        const order: Order = {
            maker: constants.NULL_ADDRESS,
            taker: constants.NULL_ADDRESS,
            feeRecipient: constants.NULL_ADDRESS,
            makerTokenAddress: constants.NULL_ADDRESS,
            takerTokenAddress: constants.NULL_ADDRESS,
            exchangeContractAddress: fakeExchangeContractAddress,
            salt: new BigNumber(0),
            makerFee: new BigNumber(0),
            takerFee: new BigNumber(0),
            makerTokenAmount: new BigNumber(0),
            takerTokenAmount: new BigNumber(0),
            expirationUnixTimestampSec: new BigNumber(0),
        };
        it('calculates the order hash', async () => {
            const orderHash = ZeroEx.getOrderHashHex(order);
            expect(orderHash).to.be.equal(expectedOrderHash);
        });
    });
    describe('#signOrderHashAsync', () => {
        let stubs: Sinon.SinonStub[] = [];
        let makerAddress: string;
        before(async () => {
            const availableAddreses = await zeroEx.getAvailableAddressesAsync();
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
            const ecSignature = await zeroEx.signOrderHashAsync(orderHash, makerAddress);
            expect(ecSignature).to.deep.equal(expectedECSignature);
        });
        it('should return the correct ECSignature for signatureHex concatenated as R + S + V', async () => {
            const orderHash = '0x34decbedc118904df65f379a175bb39ca18209d6ce41d5ed549d54e6e0a95004';
            // tslint:disable-next-line: max-line-length
            const signature = '0x22109d11d79cb8bf96ed88625e1cd9558800c4073332a9a02857499883ee5ce3050aa3cc1f2c435e67e114cdce54b9527b4f50548342401bc5d2b77adbdacb021b';
            const expectedECSignature = {
                v: 27,
                r: '0x22109d11d79cb8bf96ed88625e1cd9558800c4073332a9a02857499883ee5ce3',
                s: '0x050aa3cc1f2c435e67e114cdce54b9527b4f50548342401bc5d2b77adbdacb02',
            };
            stubs = [
                Sinon.stub((zeroEx as any)._web3Wrapper, 'signTransactionAsync')
                    .returns(Promise.resolve(signature)),
                Sinon.stub(ZeroEx, 'isValidSignature').returns(true),
            ];

            const ecSignature = await zeroEx.signOrderHashAsync(orderHash, makerAddress);
            expect(ecSignature).to.deep.equal(expectedECSignature);
        });
        it('should return the correct ECSignature for signatureHex concatenated as V + R + S', async () => {
            const orderHash = '0xc793e33ffded933b76f2f48d9aa3339fc090399d5e7f5dec8d3660f5480793f7';
            // tslint:disable-next-line: max-line-length
            const signature = '0x1bc80bedc6756722672753413efdd749b5adbd4fd552595f59c13427407ee9aee02dea66f25a608bbae457e020fb6decb763deb8b7192abab624997242da248960';
            const expectedECSignature = {
                v: 27,
                r: '0xc80bedc6756722672753413efdd749b5adbd4fd552595f59c13427407ee9aee0',
                s: '0x2dea66f25a608bbae457e020fb6decb763deb8b7192abab624997242da248960',
            };
            stubs = [
                Sinon.stub((zeroEx as any)._web3Wrapper, 'signTransactionAsync')
                    .returns(Promise.resolve(signature)),
                Sinon.stub(ZeroEx, 'isValidSignature').returns(true),
            ];

            const ecSignature = await zeroEx.signOrderHashAsync(orderHash, makerAddress);
            expect(ecSignature).to.deep.equal(expectedECSignature);
        });
    });
    describe('#awaitTransactionMinedAsync', () => {
        beforeEach(async () => {
            await blockchainLifecycle.startAsync();
        });
        afterEach(async () => {
            await blockchainLifecycle.revertAsync();
        });
        it('returns transaction receipt with decoded logs', async () => {
            const availableAddresses = await zeroEx.getAvailableAddressesAsync();
            const coinbase = availableAddresses[0];
            const tokens = await zeroEx.tokenRegistry.getTokensAsync();
            const tokenUtils = new TokenUtils(tokens);
            const zrxTokenAddress = tokenUtils.getProtocolTokenOrThrow().address;
            const proxyAddress = await zeroEx.proxy.getContractAddressAsync();
            const txHash = await zeroEx.token.setUnlimitedProxyAllowanceAsync(zrxTokenAddress, coinbase);
            const txReceiptWithDecodedLogs = await zeroEx.awaitTransactionMinedAsync(txHash);
            const log = txReceiptWithDecodedLogs.logs[0] as LogWithDecodedArgs;
            expect(log.event).to.be.equal('Approval');
            expect(log.args._owner).to.be.equal(coinbase);
            expect(log.args._spender).to.be.equal(proxyAddress);
            expect(log.args._value).to.be.bignumber.equal(zeroEx.token.UNLIMITED_ALLOWANCE_IN_BASE_UNITS);
        });
    });
    describe('#config', () => {
        it('allows to specify exchange contract address', async () => {
            const config = {
                exchangeContractAddress: ZeroEx.NULL_ADDRESS,
            };
            const zeroExWithWrongExchangeAddress = new ZeroEx(web3.currentProvider, config);
            return expect(zeroExWithWrongExchangeAddress.exchange.getContractAddressAsync())
                .to.be.rejectedWith(ZeroExError.ContractDoesNotExist);
        });
        it('allows to specify ether token contract address', async () => {
            const config = {
                etherTokenContractAddress: ZeroEx.NULL_ADDRESS,
            };
            const zeroExWithWrongEtherTokenAddress = new ZeroEx(web3.currentProvider, config);
            return expect(zeroExWithWrongEtherTokenAddress.etherToken.getContractAddressAsync())
                .to.be.rejectedWith(ZeroExError.ContractDoesNotExist);
        });
        it('allows to specify token registry token contract address', async () => {
            const config = {
                tokenRegistryContractAddress: ZeroEx.NULL_ADDRESS,
            };
            const zeroExWithWrongTokenRegistryAddress = new ZeroEx(web3.currentProvider, config);
            return expect(zeroExWithWrongTokenRegistryAddress.tokenRegistry.getContractAddressAsync())
                .to.be.rejectedWith(ZeroExError.ContractDoesNotExist);
        });
    });
});
