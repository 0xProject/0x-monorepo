import 'mocha';
import * as chai from 'chai';
import * as Web3 from 'web3';
import * as BigNumber from 'bignumber.js';
import promisify = require('es6-promisify');
import {web3Factory} from './utils/web3_factory';
import {ZeroEx} from '../src/0x.js';
import {ZeroExError, Token} from '../src/types';
import {BlockchainLifecycle} from './utils/blockchain_lifecycle';

chai.config.includeStack = true;
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle();

describe('TokenWrapper', () => {
    let web3: Web3;
    let zeroEx: ZeroEx;
    let userAddresses: string[];
    let tokens: Token[];
    let coinbase: string;
    let addressWithoutFunds: string;
    before(async () => {
        web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3);
        userAddresses = await promisify(web3.eth.getAccounts)();
        tokens = await zeroEx.tokenRegistry.getTokensAsync();
        coinbase = userAddresses[0];
        addressWithoutFunds = userAddresses[1];
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('#transferAsync', () => {
        let token: Token;
        let transferAmount: BigNumber.BigNumber;
        before(() => {
            token = tokens[0];
            transferAmount = new BigNumber(42);
        });
        it('should successfully transfer tokens', async () => {
            const fromAddress = coinbase;
            const toAddress = addressWithoutFunds;
            const preBalance = await zeroEx.token.getBalanceAsync(token.address, toAddress);
            expect(preBalance).to.be.bignumber.equal(0);
            await zeroEx.token.transferAsync(token.address, fromAddress, toAddress, transferAmount);
            const postBalance = await zeroEx.token.getBalanceAsync(token.address, toAddress);
            return expect(postBalance).to.be.bignumber.equal(transferAmount);
        });
        it('should fail to transfer tokens if fromAddress has an insufficient balance', async () => {
            const fromAddress = addressWithoutFunds;
            const toAddress = coinbase;
            return expect(zeroEx.token.transferAsync(
                token.address, fromAddress, toAddress, transferAmount,
            )).to.be.rejectedWith(ZeroExError.INSUFFICIENT_BALANCE_FOR_TRANSFER);
        });
        it('should throw a CONTRACT_DOES_NOT_EXIST error for a non-existent token contract', async () => {
            const nonExistentTokenAddress = '0x9dd402f14d67e001d8efbe6583e51bf9706aa065';
            const fromAddress = coinbase;
            const toAddress = coinbase;
            return expect(zeroEx.token.transferAsync(
                nonExistentTokenAddress, fromAddress, toAddress, transferAmount,
            )).to.be.rejectedWith(ZeroExError.CONTRACT_DOES_NOT_EXIST);
        });
    });
    describe('#transferFromAsync', () => {
        let token: Token;
        let toAddress: string;
        let senderAddress: string;
        before(async () => {
            token = tokens[0];
            toAddress = addressWithoutFunds;
            senderAddress = userAddresses[2];
        });
        it('should fail to transfer tokens if fromAddress has insufficient allowance set', async () => {
            const fromAddress = coinbase;
            const transferAmount = new BigNumber(42);

            const fromAddressBalance = await zeroEx.token.getBalanceAsync(token.address, fromAddress);
            expect(fromAddressBalance).to.be.bignumber.greaterThan(transferAmount);

            const fromAddressAllowance = await zeroEx.token.getAllowanceAsync(token.address, fromAddress,
                                                                              toAddress);
            expect(fromAddressAllowance).to.be.bignumber.equal(0);

            return expect(zeroEx.token.transferFromAsync(
                token.address, fromAddress, toAddress, senderAddress, transferAmount,
            )).to.be.rejectedWith(ZeroExError.INSUFFICIENT_ALLOWANCE_FOR_TRANSFER);
        });
        it('should fail to transfer tokens if set allowance for toAddress instead of senderAddress', async () => {
            const fromAddress = coinbase;
            const transferAmount = new BigNumber(42);

            await zeroEx.token.setAllowanceAsync(token.address, fromAddress, toAddress, transferAmount);

            return expect(zeroEx.token.transferFromAsync(
                token.address, fromAddress, toAddress, senderAddress, transferAmount,
            )).to.be.rejectedWith(ZeroExError.INSUFFICIENT_ALLOWANCE_FOR_TRANSFER);
        });
        it('should fail to transfer tokens if fromAddress has insufficient balance', async () => {
            const fromAddress = addressWithoutFunds;
            const transferAmount = new BigNumber(42);

            const fromAddressBalance = await zeroEx.token.getBalanceAsync(token.address, fromAddress);
            expect(fromAddressBalance).to.be.bignumber.equal(0);

            await zeroEx.token.setAllowanceAsync(token.address, fromAddress, senderAddress, transferAmount);
            const fromAddressAllowance = await zeroEx.token.getAllowanceAsync(token.address, fromAddress,
                                                                              senderAddress);
            expect(fromAddressAllowance).to.be.bignumber.equal(transferAmount);

            return expect(zeroEx.token.transferFromAsync(
                token.address, fromAddress, toAddress, senderAddress, transferAmount,
            )).to.be.rejectedWith(ZeroExError.INSUFFICIENT_BALANCE_FOR_TRANSFER);
        });
        it('should successfully transfer tokens', async () => {
            const fromAddress = coinbase;

            const preBalance = await zeroEx.token.getBalanceAsync(token.address, toAddress);
            expect(preBalance).to.be.bignumber.equal(0);

            const transferAmount = new BigNumber(42);
            await zeroEx.token.setAllowanceAsync(token.address, fromAddress, senderAddress, transferAmount);

            await zeroEx.token.transferFromAsync(token.address, fromAddress, toAddress, senderAddress,
                                                 transferAmount);
            const postBalance = await zeroEx.token.getBalanceAsync(token.address, toAddress);
            return expect(postBalance).to.be.bignumber.equal(transferAmount);
        });
        it('should throw a CONTRACT_DOES_NOT_EXIST error for a non-existent token contract', async () => {
            const fromAddress = coinbase;
            const nonExistentTokenAddress = '0x9dd402f14d67e001d8efbe6583e51bf9706aa065';
            return expect(zeroEx.token.transferFromAsync(
                nonExistentTokenAddress, fromAddress, toAddress, senderAddress, new BigNumber(42),
            )).to.be.rejectedWith(ZeroExError.CONTRACT_DOES_NOT_EXIST);
        });
    });
    describe('#getBalanceAsync', () => {
        it('should return the balance for an existing ERC20 token', async () => {
            const token = tokens[0];
            const ownerAddress = coinbase;
            const balance = await zeroEx.token.getBalanceAsync(token.address, ownerAddress);
            const expectedBalance = new BigNumber('100000000000000000000000000');
            return expect(balance).to.be.bignumber.equal(expectedBalance);
        });
        it('should throw a CONTRACT_DOES_NOT_EXIST error for a non-existent token contract', async () => {
            const nonExistentTokenAddress = '0x9dd402f14d67e001d8efbe6583e51bf9706aa065';
            const ownerAddress = coinbase;
            return expect(zeroEx.token.getBalanceAsync(nonExistentTokenAddress, ownerAddress))
                .to.be.rejectedWith(ZeroExError.CONTRACT_DOES_NOT_EXIST);
        });
        it('should return a balance of 0 for a non-existent owner address', async () => {
            const token = tokens[0];
            const nonExistentOwner = '0x198C6Ad858F213Fb31b6FE809E25040E6B964593';
            const balance = await zeroEx.token.getBalanceAsync(token.address, nonExistentOwner);
            const expectedBalance = new BigNumber(0);
            return expect(balance).to.be.bignumber.equal(expectedBalance);
        });
    });
    describe('#setAllowanceAsync', () => {
        it('should set the spender\'s allowance', async () => {
            const token = tokens[0];
            const ownerAddress = coinbase;
            const spenderAddress = addressWithoutFunds;

            const allowanceBeforeSet = await zeroEx.token.getAllowanceAsync(token.address, ownerAddress,
                                                                            spenderAddress);
            const expectedAllowanceBeforeAllowanceSet = new BigNumber(0);
            expect(allowanceBeforeSet).to.be.bignumber.equal(expectedAllowanceBeforeAllowanceSet);

            const amountInBaseUnits = new BigNumber(50);
            await zeroEx.token.setAllowanceAsync(token.address, ownerAddress, spenderAddress, amountInBaseUnits);

            const allowanceAfterSet = await zeroEx.token.getAllowanceAsync(token.address, ownerAddress, spenderAddress);
            const expectedAllowanceAfterAllowanceSet = amountInBaseUnits;
            return expect(allowanceAfterSet).to.be.bignumber.equal(expectedAllowanceAfterAllowanceSet);
        });
    });
    describe('#getAllowanceAsync', () => {
        it('should get the proxy allowance', async () => {
            const token = tokens[0];
            const ownerAddress = coinbase;
            const spenderAddress = addressWithoutFunds;

            const amountInBaseUnits = new BigNumber(50);
            await zeroEx.token.setAllowanceAsync(token.address, ownerAddress, spenderAddress, amountInBaseUnits);

            const allowance = await zeroEx.token.getAllowanceAsync(token.address, ownerAddress, spenderAddress);
            const expectedAllowance = amountInBaseUnits;
            return expect(allowance).to.be.bignumber.equal(expectedAllowance);
        });
        it('should return 0 if no allowance set yet', async () => {
            const token = tokens[0];
            const ownerAddress = coinbase;
            const spenderAddress = addressWithoutFunds;
            const allowance = await zeroEx.token.getAllowanceAsync(token.address, ownerAddress, spenderAddress);
            const expectedAllowance = new BigNumber(0);
            return expect(allowance).to.be.bignumber.equal(expectedAllowance);
        });
    });
    describe('#getProxyAllowanceAsync', () => {
        it('should get the proxy allowance', async () => {
            const token = tokens[0];
            const ownerAddress = coinbase;

            const amountInBaseUnits = new BigNumber(50);
            await zeroEx.token.setProxyAllowanceAsync(token.address, ownerAddress, amountInBaseUnits);

            const allowance = await zeroEx.token.getProxyAllowanceAsync(token.address, ownerAddress);
            const expectedAllowance = amountInBaseUnits;
            return expect(allowance).to.be.bignumber.equal(expectedAllowance);
        });
    });
    describe('#setProxyAllowanceAsync', () => {
        it('should set the proxy allowance', async () => {
            const token = tokens[0];
            const ownerAddress = coinbase;

            const allowanceBeforeSet = await zeroEx.token.getProxyAllowanceAsync(token.address, ownerAddress);
            const expectedAllowanceBeforeAllowanceSet = new BigNumber(0);
            expect(allowanceBeforeSet).to.be.bignumber.equal(expectedAllowanceBeforeAllowanceSet);

            const amountInBaseUnits = new BigNumber(50);
            await zeroEx.token.setProxyAllowanceAsync(token.address, ownerAddress, amountInBaseUnits);

            const allowanceAfterSet = await zeroEx.token.getProxyAllowanceAsync(token.address, ownerAddress);
            const expectedAllowanceAfterAllowanceSet = amountInBaseUnits;
            return expect(allowanceAfterSet).to.be.bignumber.equal(expectedAllowanceAfterAllowanceSet);
        });
    });
});
