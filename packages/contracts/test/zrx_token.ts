import { ContractWrappers } from '@0xproject/contract-wrappers';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import 'make-promises-safe';
import * as Web3 from 'web3';

import { ZRXTokenContract } from '../src/contract_wrappers/generated/zrx_token';
import { artifacts } from '../src/utils/artifacts';
import { chaiSetup } from '../src/utils/chai_setup';
import { constants } from '../src/utils/constants';
import { provider, txDefaults, web3Wrapper } from '../src/utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('ZRXToken', () => {
    let owner: string;
    let spender: string;
    let contractWrappers: ContractWrappers;

    let MAX_UINT: BigNumber;

    let zrxToken: ZRXTokenContract;
    let zrxAddress: string;

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
        contractWrappers = new ContractWrappers(provider, {
            networkId: constants.TESTRPC_NETWORK_ID,
        });
        zrxToken = await ZRXTokenContract.deployFrom0xArtifactAsync(artifacts.ZRX, provider, txDefaults);
        zrxAddress = zrxToken.address;
        MAX_UINT = contractWrappers.token.UNLIMITED_ALLOWANCE_IN_BASE_UNITS;
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('constants', () => {
        it('should have 18 decimals', async () => {
            const decimals = new BigNumber(await zrxToken.decimals.callAsync());
            const expectedDecimals = 18;
            expect(decimals).to.be.bignumber.equal(expectedDecimals);
        });

        it('should have a total supply of 1 billion tokens', async () => {
            const totalSupply = new BigNumber(await zrxToken.totalSupply.callAsync());
            const expectedTotalSupply = 1000000000;
            expect(Web3Wrapper.toUnitAmount(totalSupply, 18)).to.be.bignumber.equal(expectedTotalSupply);
        });

        it('should be named 0x Protocol Token', async () => {
            const name = await zrxToken.name.callAsync();
            const expectedName = '0x Protocol Token';
            expect(name).to.be.equal(expectedName);
        });

        it('should have the symbol ZRX', async () => {
            const symbol = await zrxToken.symbol.callAsync();
            const expectedSymbol = 'ZRX';
            expect(symbol).to.be.equal(expectedSymbol);
        });
    });

    describe('constructor', () => {
        it('should initialize owner balance to totalSupply', async () => {
            const ownerBalance = await contractWrappers.token.getBalanceAsync(zrxAddress, owner);
            const totalSupply = new BigNumber(await zrxToken.totalSupply.callAsync());
            expect(totalSupply).to.be.bignumber.equal(ownerBalance);
        });
    });

    describe('transfer', () => {
        it('should transfer balance from sender to receiver', async () => {
            const receiver = spender;
            const initOwnerBalance = await contractWrappers.token.getBalanceAsync(zrxAddress, owner);
            const amountToTransfer = new BigNumber(1);
            await contractWrappers.token.transferAsync(zrxAddress, owner, receiver, amountToTransfer);
            const finalOwnerBalance = await contractWrappers.token.getBalanceAsync(zrxAddress, owner);
            const finalReceiverBalance = await contractWrappers.token.getBalanceAsync(zrxAddress, receiver);

            const expectedFinalOwnerBalance = initOwnerBalance.minus(amountToTransfer);
            const expectedFinalReceiverBalance = amountToTransfer;
            expect(finalOwnerBalance).to.be.bignumber.equal(expectedFinalOwnerBalance);
            expect(finalReceiverBalance).to.be.bignumber.equal(expectedFinalReceiverBalance);
        });

        it('should return true on a 0 value transfer', async () => {
            const didReturnTrue = await zrxToken.transfer.callAsync(spender, new BigNumber(0), {
                from: owner,
            });
            expect(didReturnTrue).to.be.true();
        });
    });

    describe('transferFrom', () => {
        it('should return false if owner has insufficient balance', async () => {
            const ownerBalance = await contractWrappers.token.getBalanceAsync(zrxAddress, owner);
            const amountToTransfer = ownerBalance.plus(1);
            await contractWrappers.token.setAllowanceAsync(zrxAddress, owner, spender, amountToTransfer, {
                gasLimit: constants.MAX_TOKEN_APPROVE_GAS,
            });
            const didReturnTrue = await zrxToken.transferFrom.callAsync(owner, spender, amountToTransfer, {
                from: spender,
            });
            expect(didReturnTrue).to.be.false();
        });

        it('should return false if spender has insufficient allowance', async () => {
            const ownerBalance = await contractWrappers.token.getBalanceAsync(zrxAddress, owner);
            const amountToTransfer = ownerBalance;

            const spenderAllowance = await contractWrappers.token.getAllowanceAsync(zrxAddress, owner, spender);
            const isSpenderAllowanceInsufficient = spenderAllowance.cmp(amountToTransfer) < 0;
            expect(isSpenderAllowanceInsufficient).to.be.true();

            const didReturnTrue = await zrxToken.transferFrom.callAsync(owner, spender, amountToTransfer, {
                from: spender,
            });
            expect(didReturnTrue).to.be.false();
        });

        it('should return true on a 0 value transfer', async () => {
            const amountToTransfer = new BigNumber(0);
            const didReturnTrue = await zrxToken.transferFrom.callAsync(owner, spender, amountToTransfer, {
                from: spender,
            });
            expect(didReturnTrue).to.be.true();
        });

        it('should not modify spender allowance if spender allowance is 2^256 - 1', async () => {
            const initOwnerBalance = await contractWrappers.token.getBalanceAsync(zrxAddress, owner);
            const amountToTransfer = initOwnerBalance;
            const initSpenderAllowance = MAX_UINT;
            await contractWrappers.token.setAllowanceAsync(zrxAddress, owner, spender, initSpenderAllowance, {
                gasLimit: constants.MAX_TOKEN_APPROVE_GAS,
            });
            await contractWrappers.token.transferFromAsync(zrxAddress, owner, spender, spender, amountToTransfer, {
                gasLimit: constants.MAX_TOKEN_TRANSFERFROM_GAS,
            });

            const newSpenderAllowance = await contractWrappers.token.getAllowanceAsync(zrxAddress, owner, spender);
            expect(initSpenderAllowance).to.be.bignumber.equal(newSpenderAllowance);
        });

        it('should transfer the correct balances if spender has sufficient allowance', async () => {
            const initOwnerBalance = await contractWrappers.token.getBalanceAsync(zrxAddress, owner);
            const initSpenderBalance = await contractWrappers.token.getBalanceAsync(zrxAddress, spender);
            const amountToTransfer = initOwnerBalance;
            const initSpenderAllowance = initOwnerBalance;
            await contractWrappers.token.setAllowanceAsync(zrxAddress, owner, spender, initSpenderAllowance);
            await contractWrappers.token.transferFromAsync(zrxAddress, owner, spender, spender, amountToTransfer, {
                gasLimit: constants.MAX_TOKEN_TRANSFERFROM_GAS,
            });

            const newOwnerBalance = await contractWrappers.token.getBalanceAsync(zrxAddress, owner);
            const newSpenderBalance = await contractWrappers.token.getBalanceAsync(zrxAddress, spender);

            expect(newOwnerBalance).to.be.bignumber.equal(0);
            expect(newSpenderBalance).to.be.bignumber.equal(initSpenderBalance.plus(initOwnerBalance));
        });

        it('should modify allowance if spender has sufficient allowance less than 2^256 - 1', async () => {
            const initOwnerBalance = await contractWrappers.token.getBalanceAsync(zrxAddress, owner);
            const amountToTransfer = initOwnerBalance;
            await contractWrappers.token.setAllowanceAsync(zrxAddress, owner, spender, amountToTransfer);
            await contractWrappers.token.transferFromAsync(zrxAddress, owner, spender, spender, amountToTransfer, {
                gasLimit: constants.MAX_TOKEN_TRANSFERFROM_GAS,
            });

            const newSpenderAllowance = await contractWrappers.token.getAllowanceAsync(zrxAddress, owner, spender);
            expect(newSpenderAllowance).to.be.bignumber.equal(0);
        });
    });
});
