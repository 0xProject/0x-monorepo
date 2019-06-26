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
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
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
    let accounts: string[];
    let owner: string;
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
        accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = accounts[0];
        // deploy erc20 proxy
        erc20Wrapper = new ERC20Wrapper(provider, accounts, owner);
        erc20ProxyContract = await erc20Wrapper.deployProxyAsync();
        // deploy zrx token
        [zrxTokenContract] = await erc20Wrapper.deployDummyTokensAsync(1, ZRX_TOKEN_DECIMALS);
        await erc20Wrapper.setBalancesAndAllowancesAsync();
        // deploy staking contracts
        stakingWrapper = new StakingWrapper(provider, owner, erc20ProxyContract, zrxTokenContract, accounts);
        await stakingWrapper.deployAndConfigureContracts();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('end-to-end tests', () => {

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
            const decimals = 18;
            const base = stakingWrapper.toFixedPoint(4.234, decimals);
            const n = new BigNumber(2);
            const root = await stakingWrapper.nthRootFixedPoint(base, n);
            const rootAsFloatingPoint = stakingWrapper.toFloatingPoint(root, decimals);
            const expectedResult = new BigNumber(2.057668584);
            expect(rootAsFloatingPoint).to.be.bignumber.equal(expectedResult);
        });

        it('nth root #3 with fixed point (integer nth root would fail here)', async () => {
            const decimals = 18;
            const base = stakingWrapper.toFixedPoint(5429503678976, decimals);
            console.log(base);
            const n = new BigNumber(9);
            const root = await stakingWrapper.nthRootFixedPoint(base, n);
            const rootAsFloatingPoint = stakingWrapper.toFloatingPoint(root, decimals);
            const expectedResult = new BigNumber(26);
            expect(rootAsFloatingPoint).to.be.bignumber.equal(expectedResult);
        });

        it.skip('nth root #4 with fixed point (integer nth root would fail here) (max number of decimals - currently does not retain)', async () => {
            const decimals = 18;
            const base = stakingWrapper.toFixedPoint(new BigNumber('5429503678976.295036789761543678', 10), decimals);
            console.log(base);
            const n = new BigNumber(9);
            const root = await stakingWrapper.nthRootFixedPoint(base, n);
            console.log(`root - ${root}`);
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
            const ownerReward = await stakingWrapper.cobbDouglasAsync(
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
            const ownerReward = await stakingWrapper.cobbDouglasSimplifiedAsync(
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
            const ownerReward = await stakingWrapper.cobbDouglasSimplifiedInverseAsync(
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
    });
});
// tslint:enable:no-unnecessary-type-assertion
