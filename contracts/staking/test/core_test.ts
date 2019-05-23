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

import { StakingWrapper } from './utils/staking_wrapper';

import { ERC20Wrapper, ERC20ProxyContract } from '@0x/contracts-asset-proxy';

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
        stakers = accounts.slice(1);
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
        it('staking/unstaking', async () => {
            ///// 1/3 SETUP TEST PARAMETERS /////
            const amountToStake = stakingWrapper.toBaseUnitAmount(10);
            const amountToUnstake = stakingWrapper.toBaseUnitAmount(5);
            // check zrx token balances before minting stake
            const zrxTokenBalanceOfVaultBeforeStaking = await stakingWrapper.getZrxTokenBalanceOfZrxVault();
            expect(zrxTokenBalanceOfVaultBeforeStaking).to.be.bignumber.equal(new BigNumber(0));
            const zrxTokenBalanceOfStakerBeforeStaking = await stakingWrapper.getZrxTokenBalance(stakers[0]);
            expect(zrxTokenBalanceOfStakerBeforeStaking).to.be.bignumber.gte(amountToStake);
            ///// 2/3 STAKE ZRX /////
            {
                // mint stake
                const stakeMinted = await stakingWrapper.stake(stakers[0], amountToStake);
                expect(stakeMinted).to.be.bignumber.equal(amountToStake);
                // check stake balance after minting
                const stakeBalance = await stakingWrapper.getStakeBalance(stakers[0]);
                expect(stakeBalance).to.be.bignumber.equal(amountToStake);
                // check zrx vault balance
                const vaultBalance = await stakingWrapper.getZrxVaultBalance(stakers[0]);
                expect(vaultBalance).to.be.bignumber.equal(amountToStake);
                // check zrx token balances
                const zrxTokenBalanceOfVaultAfterStaking = await stakingWrapper.getZrxTokenBalanceOfZrxVault();
                expect(zrxTokenBalanceOfVaultAfterStaking).to.be.bignumber.equal(amountToStake);
                const zrxTokenBalanceOfStakerAfterStaking = await stakingWrapper.getZrxTokenBalance(stakers[0]);
                expect(zrxTokenBalanceOfStakerAfterStaking).to.be.bignumber.equal(zrxTokenBalanceOfStakerBeforeStaking.minus(amountToStake));
            }
            ///// 3/3 UNSTAKE ZRX /////
            {
                // unstake
                const stakeBurned = await stakingWrapper.unstake(stakers[0], amountToUnstake);
                expect(stakeBurned).to.be.bignumber.equal(amountToUnstake);
                // check stake balance after burning
                const stakeBalance = await stakingWrapper.getStakeBalance(stakers[0]);
                expect(stakeBalance).to.be.bignumber.equal(amountToStake.minus(amountToUnstake));
                // check zrx vault balance
                const vaultBalance = await stakingWrapper.getZrxVaultBalance(stakers[0]);
                expect(vaultBalance).to.be.bignumber.equal(amountToStake.minus(amountToUnstake));
                // check zrx token balances
                const zrxTokenBalanceOfVaultAfterStaking = await stakingWrapper.getZrxTokenBalanceOfZrxVault();
                expect(zrxTokenBalanceOfVaultAfterStaking).to.be.bignumber.equal(amountToStake.minus(amountToUnstake));
                const zrxTokenBalanceOfStakerAfterStaking = await stakingWrapper.getZrxTokenBalance(stakers[0]);
                expect(zrxTokenBalanceOfStakerAfterStaking).to.be.bignumber.equal(zrxTokenBalanceOfStakerBeforeStaking.minus(amountToStake).plus(amountToUnstake));
            }
        });

        it('nth root', async () => {
            const base = new BigNumber(1419857);
            const n = new BigNumber(5);
            const root = await stakingWrapper.nthRoot(base, n);
            expect(root).to.be.bignumber.equal(17);
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
