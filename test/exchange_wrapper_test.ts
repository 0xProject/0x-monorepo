import 'mocha';
import * as _ from 'lodash';
import * as chai from 'chai';
import * as Web3 from 'web3';
import * as BigNumber from 'bignumber.js';
import * as dirtyChai from 'dirty-chai';
import ChaiBigNumber = require('chai-bignumber');
import promisify = require('es6-promisify');
import {web3Factory} from './utils/web3_factory';
import {ZeroEx} from '../src/0x.js';
import {BlockchainLifecycle} from './utils/blockchain_lifecycle';
import {orderFactory} from './utils/order_factory';
import {FillOrderValidationErrs, Token} from '../src/types';

chai.use(dirtyChai);
chai.use(ChaiBigNumber());
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle();

describe('ExchangeWrapper', () => {
    let zeroEx: ZeroEx;
    let userAddresses: string[];
    let web3: Web3;
    before(async () => {
        web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3);
        userAddresses = await promisify(web3.eth.getAccounts)();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
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
                expect(zeroEx.exchange.isValidSignatureAsync(dataHex, malformedSignature, address))
                    .to.be.rejected();
            });
            it('r lacks 0x prefix', () => {
                const malformedR = signature.r.replace('0x', '');
                const malformedSignature = {
                    v: signature.v,
                    r: malformedR,
                    s: signature.s,
                };
                expect(zeroEx.exchange.isValidSignatureAsync(dataHex, malformedSignature, address))
                    .to.be.rejected();
            });
            it('r is too short', () => {
                const malformedR = signature.r.substr(10);
                const malformedSignature = {
                    v: signature.v,
                    r: malformedR,
                    s: signature.s.replace('0', 'z'),
                };
                expect(zeroEx.exchange.isValidSignatureAsync(dataHex, malformedSignature, address))
                    .to.be.rejected();
            });
            it('s is not hex', () => {
                const malformedS = signature.s.replace('0', 'z');
                const malformedSignature = {
                    v: signature.v,
                    r: signature.r,
                    s: malformedS,
                };
                expect(zeroEx.exchange.isValidSignatureAsync(dataHex, malformedSignature, address))
                    .to.be.rejected();
            });
        });
        it('should return false if the data doesn\'t pertain to the signature & address', async () => {
            const isValid = await zeroEx.exchange.isValidSignatureAsync('0x0', signature, address);
            expect(isValid).to.be.false();
        });
        it('should return false if the address doesn\'t pertain to the signature & dataHex', async () => {
            const validUnrelatedAddress = '0x8b0292B11a196601eD2ce54B665CaFEca0347D42';
            const isValid = await zeroEx.exchange.isValidSignatureAsync(dataHex, signature, validUnrelatedAddress);
            expect(isValid).to.be.false();
        });
        it('should return false if the signature doesn\'t pertain to the dataHex & address', async () => {
            const wrongSignature = {...signature, v: 28};
            const isValid = await zeroEx.exchange.isValidSignatureAsync(dataHex, wrongSignature, address);
            expect(isValid).to.be.false();
        });
        it('should return true if the signature does pertain to the dataHex & address', async () => {
            const isValid = await zeroEx.exchange.isValidSignatureAsync(dataHex, signature, address);
            expect(isValid).to.be.true();
        });
    });
    describe('#fillOrderAsync', () => {
        let tokens: Token[];
        let maker: string;
        let taker: string;
        let networkId: number;
        const addressBySymbol: {[symbol: string]: string} = {};
        const shouldCheckTransfer = false;
        const setBalance = async (toAddress: string,
                                  amountInBaseUnits: BigNumber.BigNumber|number,
                                  tokenAddress: string) => {
            const amount = _.isNumber(amountInBaseUnits) ? new BigNumber(amountInBaseUnits) : amountInBaseUnits;
            await zeroEx.token.transferAsync(tokenAddress, userAddresses[0], toAddress, amount);
        };
        const setAllowance = async (ownerAddress: string,
                                    amountInBaseUnits: BigNumber.BigNumber|number,
                                    tokenAddress: string) => {
            const amount = _.isNumber(amountInBaseUnits) ? new BigNumber(amountInBaseUnits) : amountInBaseUnits;
            await zeroEx.token.setProxyAllowanceAsync(tokenAddress, ownerAddress, amount);
        };
        before('fetch tokens', async () => {
            tokens = await zeroEx.tokenRegistry.getTokensAsync();
            _.forEach(tokens, token => {
                addressBySymbol[token.symbol] = token.address;
            });
            networkId = await promisify(web3.version.getNetwork)();
        });
        beforeEach('setup', () => {
            maker = userAddresses[0];
            taker = userAddresses[1];
        });
        afterEach('reset default account', () => {
            zeroEx.setDefaultAccount(userAddresses[0]);
        });
        describe('failed fills', () => {
            it('should throw when the fill amount is zero', async () => {
                const signedOrder = await orderFactory.createSignedOrderAsync(zeroEx, networkId, maker, taker,
                    5, addressBySymbol.MLN, 5, addressBySymbol.GNT);
                const fillAmount = new BigNumber(0);
                zeroEx.setDefaultAccount(taker);
                expect(zeroEx.exchange.fillOrderAsync(signedOrder, fillAmount, shouldCheckTransfer))
                    .to.be.rejectedWith(FillOrderValidationErrs.FILL_AMOUNT_IS_ZERO);
            });
            it('should throw when sender is not a taker', async () => {
                const signedOrder = await orderFactory.createSignedOrderAsync(zeroEx, networkId, maker, taker,
                    5, addressBySymbol.MLN, 5, addressBySymbol.GNT);
                const fillAmount = new BigNumber(5);
                expect(zeroEx.exchange.fillOrderAsync(signedOrder, fillAmount, shouldCheckTransfer))
                    .to.be.rejectedWith(FillOrderValidationErrs.NOT_A_TAKER);
            });
        });
        describe('successful fills', () => {
            it('should fill the valid order', async () => {
                await setAllowance(maker, 5, addressBySymbol.MLN);
                await setBalance(taker, 5, addressBySymbol.GNT);
                await setAllowance(taker, 5, addressBySymbol.GNT);
                const signedOrder = await orderFactory.createSignedOrderAsync(zeroEx, networkId, maker, taker,
                    5, addressBySymbol.MLN, 5, addressBySymbol.GNT);
                const fillAmount = new BigNumber(5);
                zeroEx.setDefaultAccount(taker);
                await zeroEx.exchange.fillOrderAsync(signedOrder, fillAmount, shouldCheckTransfer);
                expect(await zeroEx.token.getBalanceAsync(addressBySymbol.MLN, taker)).to.be.bignumber.equal(5);
                expect(await zeroEx.token.getBalanceAsync(addressBySymbol.GNT, taker)).to.be.bignumber.equal(0);
            });
        });
    });
});
