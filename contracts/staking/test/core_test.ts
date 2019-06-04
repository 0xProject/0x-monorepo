import {
    chaiSetup,
    constants,
    expectTransactionFailedAsync,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { constants as stakingConstants } from './utils/constants';

import { StakingWrapper } from './utils/staking_wrapper';

import { ERC20Wrapper, ERC20ProxyContract } from '@0x/contracts-asset-proxy';
import { StakingContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
// tslint:disable:no-unnecessary-type-assertion
describe('Staking Core', () => {
    // constants
    const ZRX_TOKEN_DECIMALS = new BigNumber(18);
    // tokens & addresses
    let owner: string;
    let stakers: string[];
    let makers: string[];
    let delegators: string[];
    let zrxTokenContract: DummyERC20TokenContract;
    let erc20ProxyContract: ERC20ProxyContract;
    // wrappers
    let stakingWrapper: StakingWrapper;
    let erc20Wrapper: ERC20Wrapper;
    // tests
    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        // create accounts
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = accounts[0];
        stakers = accounts.slice(1, 5);
        makers = accounts.slice(6, 10);
        // deploy erc20 proxy
        erc20Wrapper = new ERC20Wrapper(provider, stakers, owner);
        erc20ProxyContract = await erc20Wrapper.deployProxyAsync();
        // deploy zrx token
        [zrxTokenContract] = await erc20Wrapper.deployDummyTokensAsync(1, ZRX_TOKEN_DECIMALS);
        await erc20Wrapper.setBalancesAndAllowancesAsync();
        // deploy staking contracts
        stakingWrapper = new StakingWrapper(provider, owner, erc20ProxyContract, zrxTokenContract);
        await stakingWrapper.deployAndConfigureContracts();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('end-to-end tests', () => {
        it.skip('staking/unstaking', async () => {
            ///// 1/3 SETUP TEST PARAMETERS /////
            const amountToStake = stakingWrapper.toBaseUnitAmount(10);
            const amountToUnstake = stakingWrapper.toBaseUnitAmount(5);
            const owner = stakers[0];
            // check zrx token balances before minting stake
            const zrxTokenBalanceOfVaultBeforeStaking = await stakingWrapper.getZrxTokenBalanceOfZrxVault();
            expect(zrxTokenBalanceOfVaultBeforeStaking).to.be.bignumber.equal(new BigNumber(0));
            const zrxTokenBalanceOfStakerBeforeStaking = await stakingWrapper.getZrxTokenBalance(owner);
            expect(zrxTokenBalanceOfStakerBeforeStaking).to.be.bignumber.gte(amountToStake);
            ///// 2/3 STAKE ZRX /////
            {
                // mint stake
                const stakeMinted = await stakingWrapper.depositAndStakeAsync(owner, amountToStake);
                expect(stakeMinted).to.be.bignumber.equal(amountToStake);
                // check stake balance after minting
                const stakeBalance = await stakingWrapper.getTotalStakeAsync(owner);
                expect(stakeBalance).to.be.bignumber.equal(amountToStake);
                // check zrx vault balance
                const vaultBalance = await stakingWrapper.getZrxVaultBalance(owner);
                expect(vaultBalance).to.be.bignumber.equal(amountToStake);
                // check zrx token balances
                const zrxTokenBalanceOfVaultAfterStaking = await stakingWrapper.getZrxTokenBalanceOfZrxVault();
                expect(zrxTokenBalanceOfVaultAfterStaking).to.be.bignumber.equal(amountToStake);
                const zrxTokenBalanceOfStakerAfterStaking = await stakingWrapper.getZrxTokenBalance(owner);
                expect(zrxTokenBalanceOfStakerAfterStaking).to.be.bignumber.equal(zrxTokenBalanceOfStakerBeforeStaking.minus(amountToStake));
            }
            ///// 3/3 UNSTAKE ZRX /////
            {
                // unstake
                const stakeBurned = await stakingWrapper.deactivateAndTimelockStakeAsync(owner, amountToUnstake);
                expect(stakeBurned).to.be.bignumber.equal(amountToUnstake);
                // check stake balance after burning
                const stakeBalance = await stakingWrapper.getActivatedStakeAsync(owner);
                expect(stakeBalance).to.be.bignumber.equal(amountToStake.minus(amountToUnstake));
                // check zrx vault balance
                const vaultBalance = await stakingWrapper.getZrxVaultBalance(owner);
                expect(vaultBalance).to.be.bignumber.equal(amountToStake.minus(amountToUnstake));
                // check zrx token balances
                const zrxTokenBalanceOfVaultAfterStaking = await stakingWrapper.getZrxTokenBalanceOfZrxVault();
                expect(zrxTokenBalanceOfVaultAfterStaking).to.be.bignumber.equal(amountToStake.minus(amountToUnstake));
                const zrxTokenBalanceOfStakerAfterStaking = await stakingWrapper.getZrxTokenBalance(owner);
                expect(zrxTokenBalanceOfStakerAfterStaking).to.be.bignumber.equal(zrxTokenBalanceOfStakerBeforeStaking.minus(amountToStake).plus(amountToUnstake));
            }
        });

        it('nth root', async () => {
            const base = new BigNumber(1419857);
            const n = new BigNumber(5);
            const root = await stakingWrapper.nthRoot(base, n);
            expect(root).to.be.bignumber.equal(17);
        });

        it('nth root #2', async () => {
            const base = new BigNumber(3375);
            const n = new BigNumber(3);
            const root = await stakingWrapper.nthRoot(base, n);
            expect(root).to.be.bignumber.equal(15);
        });

        it('nth root #3 with fixed point', async () => {
            const decimals = 6;
            const base = stakingWrapper.toFixedPoint(4.234, decimals);
            const n = new BigNumber(2);
            const decimalsAsBn = new BigNumber(decimals);
            const root = await stakingWrapper.nthRootFixedPoint(base, n, decimalsAsBn);
            const rootAsFloatingPoint = stakingWrapper.toFloatingPoint(root, decimals);
            const expectedResult = new BigNumber(2.057);
            expect(rootAsFloatingPoint).to.be.bignumber.equal(expectedResult);
        });

        it('nth root #3 with fixed point (integer nth root would fail here)', async () => {
            const decimals = 18;
            const base = stakingWrapper.toFixedPoint(5429503678976, decimals);
            const n = new BigNumber(9);
            const decimalsAsBn = new BigNumber(decimals);
            const root = await stakingWrapper.nthRootFixedPoint(base, n, decimalsAsBn);
            const rootAsFloatingPoint = stakingWrapper.toFloatingPoint(root, decimals);
            const expectedResult = new BigNumber(26);
            expect(rootAsFloatingPoint).to.be.bignumber.equal(expectedResult);
        });

        it('cobb douglas - approximate', async() => {
            const totalRewards = stakingWrapper.toBaseUnitAmount(57.154398);
            const ownerFees = stakingWrapper.toBaseUnitAmount(5.64375);
            const totalFees = stakingWrapper.toBaseUnitAmount(29.00679);
            const ownerStake = stakingWrapper.toBaseUnitAmount(56);
            const totalStake = stakingWrapper.toBaseUnitAmount(10906);
            const alphaNumerator = new BigNumber(3);
            const alphaDenominator = new BigNumber(7);
            // create expected output
            // https://www.wolframalpha.com/input/?i=57.154398+*+(5.64375%2F29.00679)+%5E+(3%2F7)+*+(56+%2F+10906)+%5E+(1+-+3%2F7)
            const expectedOwnerReward = new BigNumber(1.3934);
            // run computation
            const ownerReward = await stakingWrapper.cobbDouglas(
                totalRewards,
                ownerFees,
                totalFees,
                ownerStake,
                totalStake,
                alphaNumerator,
                alphaDenominator
            );
            const ownerRewardFloatingPoint = stakingWrapper.trimFloat(stakingWrapper.toFloatingPoint(ownerReward, 18), 4);
            // validation
            expect(ownerRewardFloatingPoint).to.be.bignumber.equal(expectedOwnerReward);
        });

        it('cobb douglas - simplified (alpha = 1/x)', async() => {
            // setup test parameters
            const totalRewards = stakingWrapper.toBaseUnitAmount(57.154398);
            const ownerFees = stakingWrapper.toBaseUnitAmount(5.64375);
            const totalFees = stakingWrapper.toBaseUnitAmount(29.00679);
            const ownerStake = stakingWrapper.toBaseUnitAmount(56);
            const totalStake = stakingWrapper.toBaseUnitAmount(10906);
            const alphaDenominator = new BigNumber(3);
            // create expected output
            // https://www.wolframalpha.com/input/?i=57.154398+*+(5.64375%2F29.00679)+%5E+(1%2F3)+*+(56+%2F+10906)+%5E+(1+-+1%2F3)
            const expectedOwnerReward = new BigNumber(0.98572107681878);
            // run computation
            const ownerReward = await stakingWrapper.cobbDouglasSimplified(
                totalRewards,
                ownerFees,
                totalFees,
                ownerStake,
                totalStake,
                alphaDenominator
            );
            const ownerRewardFloatingPoint = stakingWrapper.trimFloat(stakingWrapper.toFloatingPoint(ownerReward, 18), 14);
            // validation
            expect(ownerRewardFloatingPoint).to.be.bignumber.equal(expectedOwnerReward);
        });

        it('cobb douglas - simplified inverse (1 - alpha = 1/x)', async() => {
            const totalRewards = stakingWrapper.toBaseUnitAmount(57.154398);
            const ownerFees = stakingWrapper.toBaseUnitAmount(5.64375);
            const totalFees = stakingWrapper.toBaseUnitAmount(29.00679);
            const ownerStake = stakingWrapper.toBaseUnitAmount(56);
            const totalStake = stakingWrapper.toBaseUnitAmount(10906);
            const inverseAlphaDenominator = new BigNumber(3);
            // create expected output
            // https://www.wolframalpha.com/input/?i=57.154398+*+(5.64375%2F29.00679)+%5E+(2%2F3)+*+(56+%2F+10906)+%5E+(1+-+2%2F3)
            const expectedOwnerReward = new BigNumber(3.310822494188);
            // run computation
            const ownerReward = await stakingWrapper.cobbDouglasSimplifiedInverse(
                totalRewards,
                ownerFees,
                totalFees,
                ownerStake,
                totalStake,
                inverseAlphaDenominator
            );
            const ownerRewardFloatingPoint = stakingWrapper.trimFloat(stakingWrapper.toFloatingPoint(ownerReward, 18), 12);
            // validation
            expect(ownerRewardFloatingPoint).to.be.bignumber.equal(expectedOwnerReward);
        });

        it('pool management', async() => {
            // create first pool
            const operatorAddress = stakers[0];
            const operatorShare = 39;
            const poolId = await stakingWrapper.createPoolAsync(operatorAddress, operatorShare);
            expect(poolId).to.be.equal(stakingConstants.INITIAL_POOL_ID);
            // check that the next pool id was incremented
            const expectedNextPoolId = "0x0000000000000000000000000000000200000000000000000000000000000000";
            const nextPoolId = await stakingWrapper.getNextPoolIdAsync();
            expect(nextPoolId).to.be.equal(expectedNextPoolId);
            // add maker to pool
            const makerAddress = makers[0];
            const makerSignature = "0x";
            await stakingWrapper.addMakerToPoolAsync(poolId, makerAddress, makerSignature, operatorAddress);
            // check the pool id of the maker
            const poolIdOfMaker = await stakingWrapper.getMakerPoolId(makerAddress);
            expect(poolIdOfMaker).to.be.equal(poolId);
            // check the list of makers for the pool
            const makerAddressesForPool = await stakingWrapper.getMakerAddressesForPool(poolId);
            expect(makerAddressesForPool).to.be.deep.equal([makerAddress]);
            // try to add the same maker address again
            await expectTransactionFailedAsync(
                stakingWrapper.addMakerToPoolAsync(poolId, makerAddress, makerSignature, operatorAddress),
                RevertReason.MakerAddressAlreadyRegistered
            );
            // try to add a new maker address from an address other than the pool operator
            const notOperatorAddress = owner;
            const anotherMakerAddress = makers[1];
            const anotherMakerSignature = "0x";
            await expectTransactionFailedAsync(
                stakingWrapper.addMakerToPoolAsync(poolId, anotherMakerAddress, anotherMakerSignature, notOperatorAddress),
                RevertReason.OnlyCallableByPoolOperator
            );
            // try to remove the maker address from an address other than the operator
            await expectTransactionFailedAsync(
                stakingWrapper.removeMakerFromPoolAsync(poolId, makerAddress, notOperatorAddress),
                RevertReason.OnlyCallableByPoolOperator
            );
            // remove maker from pool
            await stakingWrapper.removeMakerFromPoolAsync(poolId, makerAddress, operatorAddress);
            // check the pool id of the maker
            const poolIdOfMakerAfterRemoving = await stakingWrapper.getMakerPoolId(makerAddress);
            expect(poolIdOfMakerAfterRemoving).to.be.equal(stakingConstants.NIL_POOL_ID);
            // check the list of makers for the pool
            const makerAddressesForPoolAfterRemoving = await stakingWrapper.getMakerAddressesForPool(poolId);
            expect(makerAddressesForPoolAfterRemoving).to.be.deep.equal([]);
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
