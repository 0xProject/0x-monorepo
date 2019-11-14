import { chaiSetup, constants, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';

import { ZRXTokenContract } from './wrappers';

import { artifacts } from './artifacts';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('ZRXToken', () => {
    let owner: string;
    let spender: string;
    let MAX_UINT: BigNumber;
    let zrxToken: ZRXTokenContract;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = accounts[0];
        spender = accounts[1];
        zrxToken = await ZRXTokenContract.deployFrom0xArtifactAsync(
            artifacts.ZRXToken,
            provider,
            txDefaults,
            artifacts,
        );
        MAX_UINT = constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS;
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('constants', () => {
        it('should have 18 decimals', async () => {
            const decimals = new BigNumber(await zrxToken.decimals().callAsync());
            const expectedDecimals = 18;
            expect(decimals).to.be.bignumber.equal(expectedDecimals);
        });

        it('should have a total supply of 1 billion tokens', async () => {
            const totalSupply = new BigNumber(await zrxToken.totalSupply().callAsync());
            const expectedTotalSupply = 1000000000;
            expect(Web3Wrapper.toUnitAmount(totalSupply, 18)).to.be.bignumber.equal(expectedTotalSupply);
        });

        it('should be named 0x Protocol Token', async () => {
            const name = await zrxToken.name().callAsync();
            const expectedName = '0x Protocol Token';
            expect(name).to.be.equal(expectedName);
        });

        it('should have the symbol ZRX', async () => {
            const symbol = await zrxToken.symbol().callAsync();
            const expectedSymbol = 'ZRX';
            expect(symbol).to.be.equal(expectedSymbol);
        });
    });

    describe('constructor', () => {
        it('should initialize owner balance to totalSupply', async () => {
            const ownerBalance = await zrxToken.balanceOf(owner).callAsync();
            const totalSupply = new BigNumber(await zrxToken.totalSupply().callAsync());
            expect(totalSupply).to.be.bignumber.equal(ownerBalance);
        });
    });

    describe('transfer', () => {
        it('should transfer balance from sender to receiver', async () => {
            const receiver = spender;
            const initOwnerBalance = await zrxToken.balanceOf(owner).callAsync();
            const amountToTransfer = new BigNumber(1);
            await web3Wrapper.awaitTransactionSuccessAsync(
                await zrxToken.transfer(receiver, amountToTransfer).sendTransactionAsync({ from: owner }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const finalOwnerBalance = await zrxToken.balanceOf(owner).callAsync();
            const finalReceiverBalance = await zrxToken.balanceOf(receiver).callAsync();

            const expectedFinalOwnerBalance = initOwnerBalance.minus(amountToTransfer);
            const expectedFinalReceiverBalance = amountToTransfer;
            expect(finalOwnerBalance).to.be.bignumber.equal(expectedFinalOwnerBalance);
            expect(finalReceiverBalance).to.be.bignumber.equal(expectedFinalReceiverBalance);
        });

        it('should return true on a 0 value transfer', async () => {
            const didReturnTrue = await zrxToken.transfer(spender, new BigNumber(0)).callAsync({
                from: owner,
            });
            expect(didReturnTrue).to.be.true();
        });
    });

    describe('transferFrom', () => {
        it('should return false if owner has insufficient balance', async () => {
            const ownerBalance = await zrxToken.balanceOf(owner).callAsync();
            const amountToTransfer = ownerBalance.plus(1);
            await web3Wrapper.awaitTransactionSuccessAsync(
                await zrxToken.approve(spender, amountToTransfer).sendTransactionAsync({
                    from: owner,
                    gas: constants.MAX_TOKEN_APPROVE_GAS,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            const didReturnTrue = await zrxToken.transferFrom(owner, spender, amountToTransfer).callAsync({
                from: spender,
            });
            expect(didReturnTrue).to.be.false();
        });

        it('should return false if spender has insufficient allowance', async () => {
            const ownerBalance = await zrxToken.balanceOf(owner).callAsync();
            const amountToTransfer = ownerBalance;

            const spenderAllowance = await zrxToken.allowance(owner, spender).callAsync();
            const isSpenderAllowanceInsufficient = spenderAllowance.comparedTo(amountToTransfer) < 0;
            expect(isSpenderAllowanceInsufficient).to.be.true();

            const didReturnTrue = await zrxToken.transferFrom(owner, spender, amountToTransfer).callAsync({
                from: spender,
            });
            expect(didReturnTrue).to.be.false();
        });

        it('should return true on a 0 value transfer', async () => {
            const amountToTransfer = new BigNumber(0);
            const didReturnTrue = await zrxToken.transferFrom(owner, spender, amountToTransfer).callAsync({
                from: spender,
            });
            expect(didReturnTrue).to.be.true();
        });

        it('should not modify spender allowance if spender allowance is 2^256 - 1', async () => {
            const initOwnerBalance = await zrxToken.balanceOf(owner).callAsync();
            const amountToTransfer = initOwnerBalance;
            const initSpenderAllowance = MAX_UINT;
            await web3Wrapper.awaitTransactionSuccessAsync(
                await zrxToken.approve(spender, initSpenderAllowance).sendTransactionAsync({
                    from: owner,
                    gas: constants.MAX_TOKEN_APPROVE_GAS,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await zrxToken.transferFrom(owner, spender, amountToTransfer).sendTransactionAsync({
                    from: spender,
                    gas: constants.MAX_TOKEN_TRANSFERFROM_GAS,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            const newSpenderAllowance = await zrxToken.allowance(owner, spender).callAsync();
            expect(initSpenderAllowance).to.be.bignumber.equal(newSpenderAllowance);
        });

        it('should transfer the correct balances if spender has sufficient allowance', async () => {
            const initOwnerBalance = await zrxToken.balanceOf(owner).callAsync();
            const initSpenderBalance = await zrxToken.balanceOf(spender).callAsync();
            const amountToTransfer = initOwnerBalance;
            const initSpenderAllowance = initOwnerBalance;
            await web3Wrapper.awaitTransactionSuccessAsync(
                await zrxToken.approve(spender, initSpenderAllowance).sendTransactionAsync(),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await zrxToken.transferFrom(owner, spender, amountToTransfer).sendTransactionAsync({
                    from: spender,
                    gas: constants.MAX_TOKEN_TRANSFERFROM_GAS,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            const newOwnerBalance = await zrxToken.balanceOf(owner).callAsync();
            const newSpenderBalance = await zrxToken.balanceOf(spender).callAsync();

            expect(newOwnerBalance).to.be.bignumber.equal(0);
            expect(newSpenderBalance).to.be.bignumber.equal(initSpenderBalance.plus(initOwnerBalance));
        });

        it('should modify allowance if spender has sufficient allowance less than 2^256 - 1', async () => {
            const initOwnerBalance = await zrxToken.balanceOf(owner).callAsync();
            const amountToTransfer = initOwnerBalance;
            await web3Wrapper.awaitTransactionSuccessAsync(
                await zrxToken.approve(spender, amountToTransfer).sendTransactionAsync(),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await zrxToken.transferFrom(owner, spender, amountToTransfer).sendTransactionAsync({
                    from: spender,
                    gas: constants.MAX_TOKEN_TRANSFERFROM_GAS,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );

            const newSpenderAllowance = await zrxToken.allowance(owner, spender).callAsync();
            expect(newSpenderAllowance).to.be.bignumber.equal(0);
        });
    });
});
