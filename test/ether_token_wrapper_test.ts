import 'mocha';
import * as chai from 'chai';
import {chaiSetup} from './utils/chai_setup';
import * as Web3 from 'web3';
import * as BigNumber from 'bignumber.js';
import promisify = require('es6-promisify');
import {web3Factory} from './utils/web3_factory';
import {ZeroEx, ZeroExError, Token} from '../src';
import {BlockchainLifecycle} from './utils/blockchain_lifecycle';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle();

describe.only('EtherTokenWrapper', () => {
    let web3: Web3;
    let zeroEx: ZeroEx;
    let userAddresses: string[];
    let addressWithETH: string;
    let wethContractAddress: string;
    let depositETHAmount: BigNumber.BigNumber;
    let depositWeiAmount: BigNumber.BigNumber;
    let decimalPlaces: number;
    before(async () => {
        web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3.currentProvider);
        userAddresses = await promisify(web3.eth.getAccounts)();
        addressWithETH = userAddresses[0];
        wethContractAddress = await zeroEx.etherToken.getContractAddressAsync();
        depositETHAmount = new BigNumber(5);
        depositWeiAmount = (zeroEx as any)._web3Wrapper.toWei(depositETHAmount);
        decimalPlaces = 7;
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('#depositAsync', () => {
        it('should successfully deposit ETH and issue Wrapped ETH tokens', async () => {
            const preETHBalance = await (zeroEx as any)._web3Wrapper.getBalanceInEthAsync(addressWithETH);
            const preWETHBalance = await zeroEx.token.getBalanceAsync(wethContractAddress, addressWithETH);
            expect(preETHBalance).to.be.bignumber.gt(0);
            expect(preWETHBalance).to.be.bignumber.equal(0);

            await zeroEx.etherToken.depositAsync(depositWeiAmount, addressWithETH);

            const postETHBalance = await (zeroEx as any)._web3Wrapper.getBalanceInEthAsync(addressWithETH);
            const postWETHBalanceInBaseUnits = await zeroEx.token.getBalanceAsync(wethContractAddress, addressWithETH);

            expect(postWETHBalanceInBaseUnits).to.be.bignumber.equal(depositWeiAmount);
            const remainingETH = preETHBalance.minus(depositETHAmount);
            return expect(postETHBalance.round(decimalPlaces)).to.be.bignumber.equal(remainingETH);
        });
        it('should throw if user has insufficient ETH balance for deposit', async () => {
            const preETHBalance = await (zeroEx as any)._web3Wrapper.getBalanceInEthAsync(addressWithETH);

            const overETHBalance = preETHBalance.add(5);
            const overETHBalanceinWei = (zeroEx as any)._web3Wrapper.toWei(overETHBalance);

            return expect(
                zeroEx.etherToken.depositAsync(overETHBalanceinWei, addressWithETH),
            ).to.be.rejectedWith(ZeroExError.INSUFFICIENT_ETH_BALANCE_FOR_DEPOSIT);
        });
    });
    describe('#withdrawAsync', () => {
        it('should successfully withdraw ETH in return for Wrapped ETH tokens', async () => {
            const ETHBalance = await (zeroEx as any)._web3Wrapper.getBalanceInEthAsync(addressWithETH);

            await zeroEx.etherToken.depositAsync(depositWeiAmount, addressWithETH);

            const expectedPreETHBalance = ETHBalance.minus(depositETHAmount);
            const preETHBalance = await (zeroEx as any)._web3Wrapper.getBalanceInEthAsync(addressWithETH);
            const preWETHBalance = await zeroEx.token.getBalanceAsync(wethContractAddress, addressWithETH);
            expect(preETHBalance.round(decimalPlaces)).to.be.bignumber.equal(expectedPreETHBalance);
            expect(preWETHBalance).to.be.bignumber.equal(depositWeiAmount);

            await zeroEx.etherToken.withdrawAsync(depositWeiAmount, addressWithETH);

            const postETHBalance = await (zeroEx as any)._web3Wrapper.getBalanceInEthAsync(addressWithETH);
            const postWETHBalanceInBaseUnits = await zeroEx.token.getBalanceAsync(wethContractAddress, addressWithETH);

            expect(postWETHBalanceInBaseUnits).to.be.bignumber.equal(0);
            const expectedETHBalance = preETHBalance.add(depositETHAmount).round(decimalPlaces);
            return expect(postETHBalance.round(decimalPlaces)).to.be.bignumber.equal(expectedETHBalance);
        });
        it('should throw if user has insufficient WETH balance for withdrawl', async () => {
            const preWETHBalance = await zeroEx.token.getBalanceAsync(wethContractAddress, addressWithETH);
            expect(preWETHBalance).to.be.bignumber.equal(0);

            const overWETHBalance = preWETHBalance.add(999999999);

            return expect(
                zeroEx.etherToken.withdrawAsync(overWETHBalance, addressWithETH),
            ).to.be.rejectedWith(ZeroExError.INSUFFICIENT_WETH_BALANCE_FOR_WITHDRAWAL);
        });
    });
});
