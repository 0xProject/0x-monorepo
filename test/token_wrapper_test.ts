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
    before(async () => {
        web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3);
        userAddresses = await promisify(web3.eth.getAccounts)();
        tokens = await zeroEx.tokenRegistry.getTokensAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('#transferAsync', () => {
        it('should successfully transfer tokens', async () => {
            const token = tokens[0];
            const fromAddress = userAddresses[0];
            const toAddress = userAddresses[1];
            const preBalance = await zeroEx.token.getBalanceAsync(token.address, toAddress);
            expect(preBalance).to.be.bignumber.equal(0);
            const transferAmount = new BigNumber(42);
            await zeroEx.token.transferAsync(token.address, fromAddress, toAddress, transferAmount);
            const postBalance = await zeroEx.token.getBalanceAsync(token.address, toAddress);
            expect(postBalance).to.be.bignumber.equal(transferAmount);
        });
        it('should throw a CONTRACT_DOES_NOT_EXIST error for a non-existent token contract', async () => {
            const nonExistentTokenAddress = '0x9dd402f14d67e001d8efbe6583e51bf9706aa065';
            const fromAddress = userAddresses[0];
            const toAddress = userAddresses[0];
            expect(zeroEx.token.transferAsync(
                nonExistentTokenAddress, fromAddress, toAddress, new BigNumber(42),
            )).to.be.rejectedWith(ZeroExError.CONTRACT_DOES_NOT_EXIST);
        });
    });
    describe('#getBalanceAsync', () => {
        it('should return the balance for an existing ERC20 token', async () => {
            const token = tokens[0];
            const ownerAddress = userAddresses[0];
            const balance = await zeroEx.token.getBalanceAsync(token.address, ownerAddress);
            const expectedBalance = new BigNumber('100000000000000000000000000');
            expect(balance).to.be.bignumber.equal(expectedBalance);
        });
        it('should throw a CONTRACT_DOES_NOT_EXIST error for a non-existent token contract', async () => {
            const nonExistentTokenAddress = '0x9dd402f14d67e001d8efbe6583e51bf9706aa065';
            const ownerAddress = userAddresses[0];
            expect(zeroEx.token.getBalanceAsync(nonExistentTokenAddress, ownerAddress))
                .to.be.rejectedWith(ZeroExError.CONTRACT_DOES_NOT_EXIST);
        });
        it('should return a balance of 0 for a non-existent owner address', async () => {
            const token = tokens[0];
            const nonExistentOwner = '0x198C6Ad858F213Fb31b6FE809E25040E6B964593';
            const balance = await zeroEx.token.getBalanceAsync(token.address, nonExistentOwner);
            const expectedBalance = new BigNumber('0');
            expect(balance).to.be.bignumber.equal(expectedBalance);
        });
    });
    describe('#getProxyAllowanceAsync', () => {
        it('should get the proxy allowance', async () => {
            const token = tokens[0];
            const ownerAddress = userAddresses[0];

            const amountInUnits = new BigNumber('50');
            const amountInBaseUnits = ZeroEx.toBaseUnitAmount(amountInUnits, token.decimals);
            await zeroEx.token.setProxyAllowanceAsync(token.address, ownerAddress, amountInBaseUnits);

            const allowance = await zeroEx.token.getProxyAllowanceAsync(token.address, ownerAddress);
            const expectedAllowance = amountInBaseUnits;
            expect(allowance).to.be.bignumber.equal(expectedAllowance);
        });
        it('should return 0 if no allowance set yet', async () => {
            const token = tokens[0];
            const ownerAddress = userAddresses[0];
            const allowance = await zeroEx.token.getProxyAllowanceAsync(token.address, ownerAddress);
            const expectedAllowance = new BigNumber('0');
            expect(allowance).to.be.bignumber.equal(expectedAllowance);
        });
    });
    describe('#setProxyAllowanceAsync', () => {
        it('should set the proxy allowance', async () => {
            const token = tokens[0];
            const ownerAddress = userAddresses[0];

            const allowanceBeforeSet = await zeroEx.token.getProxyAllowanceAsync(token.address, ownerAddress);
            const expectedAllowanceBeforeAllowanceSet = new BigNumber('0');
            expect(allowanceBeforeSet).to.be.bignumber.equal(expectedAllowanceBeforeAllowanceSet);

            const amountInUnits = new BigNumber('50');
            const amountInBaseUnits = ZeroEx.toBaseUnitAmount(amountInUnits, token.decimals);
            await zeroEx.token.setProxyAllowanceAsync(token.address, ownerAddress, amountInBaseUnits);

            const allowanceAfterSet = await zeroEx.token.getProxyAllowanceAsync(token.address, ownerAddress);
            const expectedAllowanceAfterAllowanceSet = amountInBaseUnits;
            expect(allowanceAfterSet).to.be.bignumber.equal(expectedAllowanceAfterAllowanceSet);
        });
    });
});
