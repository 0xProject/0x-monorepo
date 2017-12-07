import {ZeroEx} from '0x.js';
import {BigNumber} from 'bignumber.js';
import * as chai from 'chai';
import Web3 = require('web3');

import {Artifacts} from '../../util/artifacts';
import {constants} from '../../util/constants';
import {ContractInstance} from '../../util/types';

import {chaiSetup} from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;
const {Exchange, ZRXToken} = new Artifacts(artifacts);
const web3: Web3 = (global as any).web3;

contract('ZRXToken', (accounts: string[]) => {
    const owner = accounts[0];
    const spender = accounts[1];
    let zeroEx: ZeroEx;

    let MAX_UINT: BigNumber;

    let zrx: ContractInstance;
    let zrxAddress: string;

    beforeEach(async () => {
        zeroEx = new ZeroEx(web3.currentProvider, {
            exchangeContractAddress: Exchange.address,
            networkId: constants.TESTRPC_NETWORK_ID,
        });
        zrxAddress = zeroEx.exchange.getZRXTokenAddress();
        zrx = await ZRXToken.at(zrxAddress);
        MAX_UINT = zeroEx.token.UNLIMITED_ALLOWANCE_IN_BASE_UNITS;
    });

    describe('constants', () => {
        it('should have 18 decimals', async () => {
            const decimals = new BigNumber(await zrx.decimals.call());
            const expectedDecimals = 18;
            expect(decimals).to.be.bignumber.equal(expectedDecimals);
        });

        it('should have a total supply of 1 billion tokens', async () => {
            const totalSupply = new BigNumber(await zrx.totalSupply.call());
            const expectedTotalSupply = 1000000000;
            expect(ZeroEx.toUnitAmount(totalSupply, 18)).to.be.bignumber.equal(expectedTotalSupply);
        });

        it('should be named 0x Protocol Token', async () => {
            const name = await zrx.name.call();
            const expectedName = '0x Protocol Token';
            expect(name).to.be.equal(expectedName);
        });

        it('should have the symbol ZRX', async () => {
            const symbol = await zrx.symbol.call();
            const expectedSymbol = 'ZRX';
            expect(symbol).to.be.equal(expectedSymbol);
        });
    });

    describe('constructor', () => {
        it('should initialize owner balance to totalSupply', async () => {
            const ownerBalance = await zeroEx.token.getBalanceAsync(zrxAddress, owner);
            const totalSupply = new BigNumber(await zrx.totalSupply.call());
            expect(totalSupply).to.be.bignumber.equal(ownerBalance);
        });
    });

    describe('transfer', () => {
        it('should transfer balance from sender to receiver', async () => {
            const receiver = spender;
            const initOwnerBalance = await zeroEx.token.getBalanceAsync(zrxAddress, owner);
            const amountToTransfer = new BigNumber(1);
            const txHash = await zeroEx.token.transferAsync(zrxAddress, owner, receiver, amountToTransfer);
            await zeroEx.awaitTransactionMinedAsync(txHash);
            const finalOwnerBalance = await zeroEx.token.getBalanceAsync(zrxAddress, owner);
            const finalReceiverBalance = await zeroEx.token.getBalanceAsync(zrxAddress, receiver);

            const expectedFinalOwnerBalance = initOwnerBalance.minus(amountToTransfer);
            const expectedFinalReceiverBalance = amountToTransfer;
            expect(finalOwnerBalance).to.be.bignumber.equal(expectedFinalOwnerBalance);
            expect(finalReceiverBalance).to.be.bignumber.equal(expectedFinalReceiverBalance);
        });

        it('should return true on a 0 value transfer', async () => {
            const didReturnTrue = await zrx.transfer.call(spender, 0, {from: owner});
            expect(didReturnTrue).to.be.true();
        });
    });

    describe('transferFrom', () => {
        it('should return false if owner has insufficient balance', async () => {
            const ownerBalance = await zeroEx.token.getBalanceAsync(zrxAddress, owner);
            const amountToTransfer = ownerBalance.plus(1);
            let txHash = await zeroEx.token.setAllowanceAsync(zrxAddress, owner, spender, amountToTransfer);
            await zeroEx.awaitTransactionMinedAsync(txHash);
            const didReturnTrue = await zrx.transferFrom.call(owner, spender, amountToTransfer, {from: spender});
            expect(didReturnTrue).to.be.false();
            // Reset allowance
            txHash = await zeroEx.token.setAllowanceAsync(zrxAddress, owner, spender, new BigNumber(0));
            await zeroEx.awaitTransactionMinedAsync(txHash);
        });

        it('should return false if spender has insufficient allowance', async () => {
            const ownerBalance = await zeroEx.token.getBalanceAsync(zrxAddress, owner);
            const amountToTransfer = ownerBalance;

            const spenderAllowance = await zeroEx.token.getAllowanceAsync(zrxAddress, owner, spender);
            const spenderAllowanceIsInsufficient = spenderAllowance.cmp(amountToTransfer) < 0;
            expect(spenderAllowanceIsInsufficient).to.be.true();

            const didReturnTrue = await zrx.transferFrom.call(owner, spender, amountToTransfer, {from: spender});
            expect(didReturnTrue).to.be.false();
        });

        it('should return true on a 0 value transfer', async () => {
            const amountToTransfer = 0;
            const didReturnTrue = await zrx.transferFrom.call(owner, spender, amountToTransfer, {from: spender});
            expect(didReturnTrue).to.be.true();
        });

        it('should not modify spender allowance if spender allowance is 2^256 - 1', async () => {
            const initOwnerBalance = await zeroEx.token.getBalanceAsync(zrxAddress, owner);
            const amountToTransfer = initOwnerBalance;
            const initSpenderAllowance = MAX_UINT;
            let txHash = await zeroEx.token.setAllowanceAsync(zrxAddress, owner, spender, initSpenderAllowance);
            await zeroEx.awaitTransactionMinedAsync(txHash);
            txHash = await zeroEx.token.transferFromAsync(zrxAddress, owner, spender, spender, amountToTransfer);
            await zeroEx.awaitTransactionMinedAsync(txHash);

            const newSpenderAllowance = await zeroEx.token.getAllowanceAsync(zrxAddress, owner, spender);
            expect(initSpenderAllowance).to.be.bignumber.equal(newSpenderAllowance);
            // Restore balance
            txHash = await zeroEx.token.transferAsync(zrxAddress, spender, owner, amountToTransfer);
            await zeroEx.awaitTransactionMinedAsync(txHash);
        });

        it('should transfer the correct balances if spender has sufficient allowance', async () => {
            const initOwnerBalance = await zeroEx.token.getBalanceAsync(zrxAddress, owner);
            const initSpenderBalance = await zeroEx.token.getBalanceAsync(zrxAddress, spender);
            const amountToTransfer = initOwnerBalance;
            const initSpenderAllowance = initOwnerBalance;
            let txHash = await zeroEx.token.setAllowanceAsync(zrxAddress, owner, spender, initSpenderAllowance);
            await zeroEx.awaitTransactionMinedAsync(txHash);
            txHash = await zeroEx.token.transferFromAsync(zrxAddress, owner, spender, spender, amountToTransfer);
            await zeroEx.awaitTransactionMinedAsync(txHash);

            const newOwnerBalance = await zeroEx.token.getBalanceAsync(zrxAddress, owner);
            const newSpenderBalance = await zeroEx.token.getBalanceAsync(zrxAddress, spender);

            expect(newOwnerBalance).to.be.bignumber.equal(0);
            expect(newSpenderBalance).to.be.bignumber.equal(initSpenderBalance.plus(initOwnerBalance));
        });

        it('should modify allowance if spender has sufficient allowance less than 2^256 - 1', async () => {
            const initOwnerBalance = await zeroEx.token.getBalanceAsync(zrxAddress, owner);
            const amountToTransfer = initOwnerBalance;
            const initSpenderAllowance = initOwnerBalance;
            let txHash = await zeroEx.token.setAllowanceAsync(zrxAddress, owner, spender, initSpenderAllowance);
            await zeroEx.awaitTransactionMinedAsync(txHash);
            txHash = await zeroEx.token.transferFromAsync(zrxAddress, owner, spender, spender, amountToTransfer);
            await zeroEx.awaitTransactionMinedAsync(txHash);

            const newSpenderAllowance = await zeroEx.token.getAllowanceAsync(zrxAddress, owner, spender);
            expect(newSpenderAllowance).to.be.bignumber.equal(0);
        });
    });
});
