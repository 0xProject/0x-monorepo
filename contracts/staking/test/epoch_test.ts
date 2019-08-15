import { ERC20ProxyContract, ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { chaiSetup, provider, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';

import { constants as stakingConstants } from './utils/constants';
import { StakingWrapper } from './utils/staking_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
// tslint:disable:no-unnecessary-type-assertion
describe('Epochs', () => {
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
        await stakingWrapper.deployAndConfigureContractsAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('Epochs & Timelocks', () => {
        it('basic epochs & timelock periods', async () => {
            ///// 0/3 Validate Assumptions /////
            expect(await stakingWrapper.getEpochDurationInSecondsAsync()).to.be.bignumber.equal(
                stakingConstants.EPOCH_DURATION_IN_SECONDS,
            );
            expect(await stakingWrapper.getTimelockDurationInEpochsAsync()).to.be.bignumber.equal(
                stakingConstants.TIMELOCK_DURATION_IN_EPOCHS,
            );

            ///// 1/3 Validate Initial Epoch & Timelock Period /////
            {
                // epoch
                const currentEpoch = await stakingWrapper.getCurrentEpochAsync();
                expect(currentEpoch).to.be.bignumber.equal(stakingConstants.INITIAL_EPOCH);
                // timelock period
                const currentTimelockPeriod = await stakingWrapper.getCurrentTimelockPeriodAsync();
                expect(currentTimelockPeriod).to.be.bignumber.equal(stakingConstants.INITIAL_TIMELOCK_PERIOD);
            }
            ///// 2/3 Increment Epoch (Timelock Should Not Increment) /////
            await stakingWrapper.skipToNextEpochAsync();
            {
                // epoch
                const currentEpoch = await stakingWrapper.getCurrentEpochAsync();
                expect(currentEpoch).to.be.bignumber.equal(stakingConstants.INITIAL_EPOCH.plus(1));
                // timelock period
                const currentTimelockPeriod = await stakingWrapper.getCurrentTimelockPeriodAsync();
                expect(currentTimelockPeriod).to.be.bignumber.equal(stakingConstants.INITIAL_TIMELOCK_PERIOD);
            }
            ///// 3/3 Increment Epoch (Timelock Should Increment) /////
            await stakingWrapper.skipToNextTimelockPeriodAsync();
            {
                // timelock period
                const currentTimelockPeriod = await stakingWrapper.getCurrentTimelockPeriodAsync();
                expect(currentTimelockPeriod).to.be.bignumber.equal(stakingConstants.INITIAL_TIMELOCK_PERIOD.plus(1));
            }
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
