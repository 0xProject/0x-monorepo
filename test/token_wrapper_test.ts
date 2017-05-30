import 'mocha';
import * as chai from 'chai';
import chaiAsPromised = require('chai-as-promised');
import * as Web3 from 'web3';
import * as BigNumber from 'bignumber.js';
import promisify = require('es6-promisify');
import {web3Factory} from './utils/web3_factory';
import {ZeroEx} from '../src/0x.js';
import {ZeroExError, Token} from '../src/types';
import {BlockchainLifecycle} from './utils/blockchain_lifecycle';

const expect = chai.expect;
chai.use(chaiAsPromised);
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
    describe('#getBalanceAsync', () => {
        it('should return the balance for an existing ERC20 token', async () => {
            const aToken = tokens[0];
            const aOwnerAddress = userAddresses[0];
            const balance = await zeroEx.token.getBalanceAsync(aToken.address, aOwnerAddress);
            const expectedBalance = new BigNumber('100000000000000000000000000');
            expect(balance).to.be.bignumber.equal(expectedBalance);
        });
        it('should throw a CONTRACT_DOES_NOT_EXIST error for a non-existent token contract', async () => {
            const nonExistentTokenAddress = '0x9dd402f14d67e001d8efbe6583e51bf9706aa065';
            const aOwnerAddress = userAddresses[0];
            expect(zeroEx.token.getBalanceAsync(nonExistentTokenAddress, aOwnerAddress))
                .to.be.rejectedWith(ZeroExError.CONTRACT_DOES_NOT_EXIST);
        });
        it('should return a balance of 0 for a non-existent owner address', async () => {
            const aToken = tokens[0];
            const aNonExistentOwner = '0x198C6Ad858F213Fb31b6FE809E25040E6B964593';
            const balance = await zeroEx.token.getBalanceAsync(aToken.address, aNonExistentOwner);
            const expectedBalance = new BigNumber('0');
            expect(balance).to.be.bignumber.equal(expectedBalance);
        });
    });
    describe('#getProxyAllowanceAsync', () => {
        it('should get the proxy allowance', async () => {
            const aToken = tokens[0];
            const aOwnerAddress = userAddresses[0];

            const amountInUnits = new BigNumber('50');
            const amountInBaseUnits = ZeroEx.toBaseUnitAmount(amountInUnits, aToken.decimals);
            await zeroEx.token.setProxyAllowanceAsync(aToken.address, aOwnerAddress, amountInBaseUnits);

            const allowance = await zeroEx.token.getProxyAllowanceAsync(aToken.address, aOwnerAddress);
            const expectedAllowance = amountInBaseUnits;
            expect(allowance).to.be.bignumber.equal(expectedAllowance);
        });
        it('should return 0 if no allowance set yet', async () => {
            const aToken = tokens[0];
            const aOwnerAddress = userAddresses[0];
            const allowance = await zeroEx.token.getProxyAllowanceAsync(aToken.address, aOwnerAddress);
            const expectedAllowance = new BigNumber('0');
            expect(allowance).to.be.bignumber.equal(expectedAllowance);
        });
    });
    describe('#setProxyAllowanceAsync', () => {
        it('should set the proxy allowance', async () => {
            const aToken = tokens[0];
            const aOwnerAddress = userAddresses[0];

            const allowanceBeforeSet = await zeroEx.token.getProxyAllowanceAsync(aToken.address, aOwnerAddress);
            const expectedAllowanceBeforeAllowanceSet = new BigNumber('0');
            expect(allowanceBeforeSet).to.be.bignumber.equal(expectedAllowanceBeforeAllowanceSet);

            const amountInUnits = new BigNumber('50');
            const amountInBaseUnits = ZeroEx.toBaseUnitAmount(amountInUnits, aToken.decimals);
            await zeroEx.token.setProxyAllowanceAsync(aToken.address, aOwnerAddress, amountInBaseUnits);

            const allowanceAfterSet = await zeroEx.token.getProxyAllowanceAsync(aToken.address, aOwnerAddress);
            const expectedAllowanceAfterAllowanceSet = amountInBaseUnits;
            expect(allowanceAfterSet).to.be.bignumber.equal(expectedAllowanceAfterAllowanceSet);
        });
    });
});
