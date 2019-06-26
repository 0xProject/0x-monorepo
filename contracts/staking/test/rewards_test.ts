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


import { StakerActor } from './actors/staker_actor';
import { DelegatorActor } from './actors/delegator_actor';

import { SimulationParams } from './utils/types';
import { Simulation } from './utils/Simulation';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
// tslint:disable:no-unnecessary-type-assertion
describe.only('Rewards', () => {
    // constants
    const ZRX_TOKEN_DECIMALS = new BigNumber(18);
    // tokens & addresses
    let accounts: string[];
    let owner: string;
    let exchange: string;
    let users: string[];
    let zrxTokenContract: DummyERC20TokenContract;
    let erc20ProxyContract: ERC20ProxyContract;

       let stakers: string[];
    let makers: string[];
    let delegators: string[];


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
        exchange = accounts[1];
        users = accounts.slice(2);

        stakers = accounts.slice(2, 5);
        makers = accounts.slice(4, 10);
        users = [...users, ...users]; // maybe this'll work? Not sure lol.


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
    describe('Rewards', () => {
        it('Protocol Fees', async () => {
            ///// 0 DEPLOY EXCHANGE /////
            await stakingWrapper.addExchangeAddressAsync(exchange);
            ///// 1 SETUP POOLS /////
            const poolOperators = stakers.slice(0, 3);
            const operatorShares = [39, 59, 43];
            const poolIds = await Promise.all([
                stakingWrapper.createPoolAsync(poolOperators[0], operatorShares[0]),
                stakingWrapper.createPoolAsync(poolOperators[1], operatorShares[1]),
                stakingWrapper.createPoolAsync(poolOperators[2], operatorShares[2]),
            ]);
            const makersByPoolId = [
                [
                    makers[0],
                ],
                [
                    makers[1],
                    makers[2]
                ],
                [
                    makers[3],
                    makers[4],
                    makers[5]
                ],
            ];
            const protocolFeesByMaker = [
                // pool 1 - adds up to protocolFeesByPoolId[0]
                stakingWrapper.toBaseUnitAmount(0.304958),
                // pool 2 - adds up to protocolFeesByPoolId[1]
                stakingWrapper.toBaseUnitAmount(3.2),
                stakingWrapper.toBaseUnitAmount(12.123258),
                // pool 3 - adds up to protocolFeesByPoolId[2]
                stakingWrapper.toBaseUnitAmount(23.577),
                stakingWrapper.toBaseUnitAmount(4.54522236),
                stakingWrapper.toBaseUnitAmount(0)
            ];
            const makerSignatures = [
                // pool 0
                stakingWrapper.signApprovalForStakingPool(poolIds[0], makersByPoolId[0][0]).signature,
                // pool 1
                stakingWrapper.signApprovalForStakingPool(poolIds[1], makersByPoolId[1][0]).signature,
                stakingWrapper.signApprovalForStakingPool(poolIds[1], makersByPoolId[1][1]).signature,
                // pool 2
                stakingWrapper.signApprovalForStakingPool(poolIds[2], makersByPoolId[2][0]).signature,
                stakingWrapper.signApprovalForStakingPool(poolIds[2], makersByPoolId[2][1]).signature,
                stakingWrapper.signApprovalForStakingPool(poolIds[2], makersByPoolId[2][2]).signature,
            ]
            await Promise.all([
                // pool 0
                stakingWrapper.addMakerToPoolAsync(poolIds[0], makersByPoolId[0][0], makerSignatures[0], poolOperators[0]),
                // pool 1
                stakingWrapper.addMakerToPoolAsync(poolIds[1], makersByPoolId[1][0], makerSignatures[1], poolOperators[1]),
                stakingWrapper.addMakerToPoolAsync(poolIds[1], makersByPoolId[1][1], makerSignatures[2], poolOperators[1]),
                // pool 2
                stakingWrapper.addMakerToPoolAsync(poolIds[2], makersByPoolId[2][0], makerSignatures[3], poolOperators[2]),
                stakingWrapper.addMakerToPoolAsync(poolIds[2], makersByPoolId[2][1], makerSignatures[4], poolOperators[2]),
                stakingWrapper.addMakerToPoolAsync(poolIds[2], makersByPoolId[2][2], makerSignatures[5], poolOperators[2]),
            ]);
            ///// 2 PAY FEES /////
            await Promise.all([
                // pool 0 - split into two payments
                stakingWrapper.payProtocolFeeAsync(makers[0], protocolFeesByMaker[0].div(2), exchange),
                stakingWrapper.payProtocolFeeAsync(makers[0], protocolFeesByMaker[0].div(2), exchange),
                // pool 1 - pay full amounts
                stakingWrapper.payProtocolFeeAsync(makers[1], protocolFeesByMaker[1], exchange),
                stakingWrapper.payProtocolFeeAsync(makers[2], protocolFeesByMaker[2], exchange),
                // pool 2 -- pay full amounts
                stakingWrapper.payProtocolFeeAsync(makers[3], protocolFeesByMaker[3], exchange),
                stakingWrapper.payProtocolFeeAsync(makers[4], protocolFeesByMaker[4], exchange),
                // maker 5 doesn't pay anything
            ]);
            ///// 3 VALIDATE FEES RECORDED FOR EACH POOL /////
            const recordedProtocolFeesByPool = await Promise.all([
                stakingWrapper.getProtocolFeesThisEpochByPoolAsync(poolIds[0]),
                stakingWrapper.getProtocolFeesThisEpochByPoolAsync(poolIds[1]),
                stakingWrapper.getProtocolFeesThisEpochByPoolAsync(poolIds[2]),
            ]);
            expect(recordedProtocolFeesByPool[0]).to.be.bignumber.equal(protocolFeesByMaker[0]);
            expect(recordedProtocolFeesByPool[1]).to.be.bignumber.equal(protocolFeesByMaker[1].plus(protocolFeesByMaker[2]));
            expect(recordedProtocolFeesByPool[2]).to.be.bignumber.equal(protocolFeesByMaker[3].plus(protocolFeesByMaker[4]));
            ///// 4 VALIDATE TOTAL FEES /////
            const recordedTotalProtocolFees = await stakingWrapper.getTotalProtocolFeesThisEpochAsync();
            const totalProtocolFeesAsNumber = _.sumBy(protocolFeesByMaker, (value: BigNumber) => {return value.toNumber()});
            const totalProtocolFees = new BigNumber(totalProtocolFeesAsNumber);
            expect(recordedTotalProtocolFees).to.be.bignumber.equal(totalProtocolFees);
            ///// 5 TRY TO RECORD FEE FROM ADDRESS OTHER THAN 0x EXCHANGE /////
            await expectTransactionFailedAsync(
                stakingWrapper.payProtocolFeeAsync(makers[4], protocolFeesByMaker[4], owner),
                RevertReason.OnlyCallableByExchange
            );
        });

        it('Finalization with Protocol Fees (no delegators)', async () => {
            ///// 0 DEPLOY EXCHANGE /////
            await stakingWrapper.addExchangeAddressAsync(exchange);
            ///// 1 SETUP POOLS /////
            const poolOperators = stakers.slice(0, 3);
            const operatorShares = [100, 100, 100];
            const poolIds = await Promise.all([
                stakingWrapper.createPoolAsync(poolOperators[0], operatorShares[0]),
                stakingWrapper.createPoolAsync(poolOperators[1], operatorShares[1]),
                stakingWrapper.createPoolAsync(poolOperators[2], operatorShares[2]),
            ]);
            const makersByPoolId = [
                [
                    makers[0],
                ],
                [
                    makers[1],
                    makers[2]
                ],
                [
                    makers[3],
                    makers[4],
                    makers[5]
                ],
            ];
            const protocolFeesByMaker = [
                // pool 1 - adds up to protocolFeesByPoolId[0]
                stakingWrapper.toBaseUnitAmount(0.304958),
                // pool 2 - adds up to protocolFeesByPoolId[1]
                stakingWrapper.toBaseUnitAmount(3.2),
                stakingWrapper.toBaseUnitAmount(12.123258),
                // pool 3 - adds up to protocolFeesByPoolId[2]
                stakingWrapper.toBaseUnitAmount(23.577),
                stakingWrapper.toBaseUnitAmount(4.54522236),
                stakingWrapper.toBaseUnitAmount(0)
            ];
            const makerSignatures = [
                // pool 0
                stakingWrapper.signApprovalForStakingPool(poolIds[0], makersByPoolId[0][0]).signature,
                // pool 1
                stakingWrapper.signApprovalForStakingPool(poolIds[1], makersByPoolId[1][0]).signature,
                stakingWrapper.signApprovalForStakingPool(poolIds[1], makersByPoolId[1][1]).signature,
                // pool 2
                stakingWrapper.signApprovalForStakingPool(poolIds[2], makersByPoolId[2][0]).signature,
                stakingWrapper.signApprovalForStakingPool(poolIds[2], makersByPoolId[2][1]).signature,
                stakingWrapper.signApprovalForStakingPool(poolIds[2], makersByPoolId[2][2]).signature,
            ]
            await Promise.all([
                // pool 0
                stakingWrapper.addMakerToPoolAsync(poolIds[0], makersByPoolId[0][0], makerSignatures[0], poolOperators[0]),
                // pool 1
                stakingWrapper.addMakerToPoolAsync(poolIds[1], makersByPoolId[1][0], makerSignatures[1], poolOperators[1]),
                stakingWrapper.addMakerToPoolAsync(poolIds[1], makersByPoolId[1][1], makerSignatures[2], poolOperators[1]),
                // pool 2
                stakingWrapper.addMakerToPoolAsync(poolIds[2], makersByPoolId[2][0], makerSignatures[3], poolOperators[2]),
                stakingWrapper.addMakerToPoolAsync(poolIds[2], makersByPoolId[2][1], makerSignatures[4], poolOperators[2]),
                stakingWrapper.addMakerToPoolAsync(poolIds[2], makersByPoolId[2][2], makerSignatures[5], poolOperators[2]),
            ]);
            ///// 2 PAY FEES /////
            await Promise.all([
                // pool 0 - split into two payments
                stakingWrapper.payProtocolFeeAsync(makers[0], protocolFeesByMaker[0].div(2), exchange),
                stakingWrapper.payProtocolFeeAsync(makers[0], protocolFeesByMaker[0].div(2), exchange),
                // pool 1 - pay full amounts
                stakingWrapper.payProtocolFeeAsync(makers[1], protocolFeesByMaker[1], exchange),
                stakingWrapper.payProtocolFeeAsync(makers[2], protocolFeesByMaker[2], exchange),
                // pool 2 -- pay full amounts
                stakingWrapper.payProtocolFeeAsync(makers[3], protocolFeesByMaker[3], exchange),
                stakingWrapper.payProtocolFeeAsync(makers[4], protocolFeesByMaker[4], exchange),
                // maker 5 doesn't pay anything
            ]);
            ///// 3 VALIDATE FEES RECORDED FOR EACH POOL /////
            const recordedProtocolFeesByPool = await Promise.all([
                stakingWrapper.getProtocolFeesThisEpochByPoolAsync(poolIds[0]),
                stakingWrapper.getProtocolFeesThisEpochByPoolAsync(poolIds[1]),
                stakingWrapper.getProtocolFeesThisEpochByPoolAsync(poolIds[2]),
            ]);
            expect(recordedProtocolFeesByPool[0]).to.be.bignumber.equal(protocolFeesByMaker[0]);
            expect(recordedProtocolFeesByPool[1]).to.be.bignumber.equal(protocolFeesByMaker[1].plus(protocolFeesByMaker[2]));
            expect(recordedProtocolFeesByPool[2]).to.be.bignumber.equal(protocolFeesByMaker[3].plus(protocolFeesByMaker[4]));
            ///// 4 VALIDATE TOTAL FEES /////
            const recordedTotalProtocolFees = await stakingWrapper.getTotalProtocolFeesThisEpochAsync();
            const totalProtocolFeesAsNumber = _.sumBy(protocolFeesByMaker, (value: BigNumber) => {return value.toNumber()});
            const totalProtocolFees = new BigNumber(totalProtocolFeesAsNumber);
            expect(recordedTotalProtocolFees).to.be.bignumber.equal(totalProtocolFees);
            ///// 5 STAKE /////
            const stakeByPoolOperator = [
                stakingWrapper.toBaseUnitAmount(42),
                stakingWrapper.toBaseUnitAmount(84),
                stakingWrapper.toBaseUnitAmount(97),
            ];
            await Promise.all([
                // pool 0
                stakingWrapper.depositAndStakeAsync(poolOperators[0], stakeByPoolOperator[0]),
                // pool 1
                stakingWrapper.depositAndStakeAsync(poolOperators[1], stakeByPoolOperator[1]),
                // pool 2
                stakingWrapper.depositAndStakeAsync(poolOperators[2], stakeByPoolOperator[2]),
            ]);
            
            ///// 6 FINALIZE /////
            await stakingWrapper.skipToNextEpochAsync();

            ///// 7 CHECK PROFITS /////
            // the expected payouts were computed by hand
            // @TODO - get computations more accurate
            const expectedPayoutByPoolOperator = [
                new BigNumber('4.75677'),  // 4.756772362932728793619590327361600155564384201215274334070
                new BigNumber('16.28130'), // 16.28130500394935316563988584956596823402223838026190634525
                new BigNumber('20.31028'), // 20.31028447343014834523983759032242063760612769662934308289
            ];
            const payoutByPoolOperator = await Promise.all([
                stakingWrapper.rewardVaultBalanceOfAsync(poolIds[0]),
                stakingWrapper.rewardVaultBalanceOfAsync(poolIds[1]),
                stakingWrapper.rewardVaultBalanceOfAsync(poolIds[2]),
            ]);
            const payoutAcurateToFiveDecimalsByPoolOperator = await Promise.all([
                stakingWrapper.trimFloat(stakingWrapper.toFloatingPoint(payoutByPoolOperator[0], 18), 5),
                stakingWrapper.trimFloat(stakingWrapper.toFloatingPoint(payoutByPoolOperator[1], 18), 5),
                stakingWrapper.trimFloat(stakingWrapper.toFloatingPoint(payoutByPoolOperator[2], 18), 5),
            ]);
            expect(payoutAcurateToFiveDecimalsByPoolOperator[0]).to.be.bignumber.equal(expectedPayoutByPoolOperator[0]);
            expect(payoutAcurateToFiveDecimalsByPoolOperator[1]).to.be.bignumber.equal(expectedPayoutByPoolOperator[1]);
            expect(payoutAcurateToFiveDecimalsByPoolOperator[2]).to.be.bignumber.equal(expectedPayoutByPoolOperator[2]);
            ///// 8 CHECK PROFITS VIA STAKING CONTRACT /////
            const payoutByPoolOperatorFromStakingContract = await Promise.all([
                stakingWrapper.getRewardBalanceAsync(poolIds[0]),
                stakingWrapper.getRewardBalanceAsync(poolIds[1]),
                stakingWrapper.getRewardBalanceAsync(poolIds[2]),
            ]);
            expect(payoutByPoolOperatorFromStakingContract[0]).to.be.bignumber.equal(payoutByPoolOperator[0]);
            expect(payoutByPoolOperatorFromStakingContract[1]).to.be.bignumber.equal(payoutByPoolOperator[1]);
            expect(payoutByPoolOperatorFromStakingContract[2]).to.be.bignumber.equal(payoutByPoolOperator[2]);
            ///// 9 WITHDRAW PROFITS VIA STAKING CONTRACT /////
            const initOperatorBalances = await Promise.all([
                stakingWrapper.getEthBalanceAsync(poolOperators[0]),
                stakingWrapper.getEthBalanceAsync(poolOperators[1]),
                stakingWrapper.getEthBalanceAsync(poolOperators[2]),
            ]);
            await Promise.all([
                stakingWrapper.withdrawTotalOperatorRewardAsync(poolIds[0], poolOperators[0]),
                stakingWrapper.withdrawTotalOperatorRewardAsync(poolIds[1], poolOperators[1]),
                stakingWrapper.withdrawTotalOperatorRewardAsync(poolIds[2], poolOperators[2]),
            ]);
            const finalOperatorBalances = await Promise.all([
                stakingWrapper.getEthBalanceAsync(poolOperators[0]),
                stakingWrapper.getEthBalanceAsync(poolOperators[1]),
                stakingWrapper.getEthBalanceAsync(poolOperators[2]),
            ]);
            const payoutBalancesByOperator = [
                finalOperatorBalances[0].minus(initOperatorBalances[0]),
                finalOperatorBalances[1].minus(initOperatorBalances[1]),
                finalOperatorBalances[2].minus(initOperatorBalances[2]),
            ];
            expect(payoutBalancesByOperator[0]).to.be.bignumber.equal(payoutByPoolOperator[0]);
            expect(payoutBalancesByOperator[1]).to.be.bignumber.equal(payoutByPoolOperator[1]);
            expect(payoutBalancesByOperator[2]).to.be.bignumber.equal(payoutByPoolOperator[2]);
        });

        it('Finalization with Protocol Fees and Delegation', async () => {
            ///// 0 DEPLOY EXCHANGE /////
            await stakingWrapper.addExchangeAddressAsync(exchange);
            ///// 1 SETUP POOLS /////
            const poolOperators = makers.slice(0, 3);
            const operatorShares = [39, 59, 43];
            const poolIds = await Promise.all([
                stakingWrapper.createPoolAsync(poolOperators[0], operatorShares[0]),
                stakingWrapper.createPoolAsync(poolOperators[1], operatorShares[1]),
                stakingWrapper.createPoolAsync(poolOperators[2], operatorShares[2]),
            ]);
            const makersByPoolId = [
                [
                    makers[0],
                ],
                [
                    makers[1],
                    makers[2]
                ],
                [
                    makers[3],
                    makers[4],
                    makers[5]
                ],
            ];
            const protocolFeesByMaker = [
                // pool 1 - adds up to protocolFeesByPoolId[0]
                stakingWrapper.toBaseUnitAmount(0.304958),
                // pool 2 - adds up to protocolFeesByPoolId[1]
                stakingWrapper.toBaseUnitAmount(3.2),
                stakingWrapper.toBaseUnitAmount(12.123258),
                // pool 3 - adds up to protocolFeesByPoolId[2]
                stakingWrapper.toBaseUnitAmount(23.577),
                stakingWrapper.toBaseUnitAmount(4.54522236),
                stakingWrapper.toBaseUnitAmount(0)
            ];
            const makerSignatures = [
                // pool 0
                stakingWrapper.signApprovalForStakingPool(poolIds[0], makersByPoolId[0][0]).signature,
                // pool 1
                stakingWrapper.signApprovalForStakingPool(poolIds[1], makersByPoolId[1][0]).signature,
                stakingWrapper.signApprovalForStakingPool(poolIds[1], makersByPoolId[1][1]).signature,
                // pool 2
                stakingWrapper.signApprovalForStakingPool(poolIds[2], makersByPoolId[2][0]).signature,
                stakingWrapper.signApprovalForStakingPool(poolIds[2], makersByPoolId[2][1]).signature,
                stakingWrapper.signApprovalForStakingPool(poolIds[2], makersByPoolId[2][2]).signature,
            ]
            await Promise.all([
                // pool 0
                stakingWrapper.addMakerToPoolAsync(poolIds[0], makersByPoolId[0][0], makerSignatures[0], poolOperators[0]),
                // pool 1
                stakingWrapper.addMakerToPoolAsync(poolIds[1], makersByPoolId[1][0], makerSignatures[1], poolOperators[1]),
                stakingWrapper.addMakerToPoolAsync(poolIds[1], makersByPoolId[1][1], makerSignatures[2], poolOperators[1]),
                // pool 2
                stakingWrapper.addMakerToPoolAsync(poolIds[2], makersByPoolId[2][0], makerSignatures[3], poolOperators[2]),
                stakingWrapper.addMakerToPoolAsync(poolIds[2], makersByPoolId[2][1], makerSignatures[4], poolOperators[2]),
                stakingWrapper.addMakerToPoolAsync(poolIds[2], makersByPoolId[2][2], makerSignatures[5], poolOperators[2]),
            ]);
            ///// 2 PAY FEES /////
            await Promise.all([
                // pool 0 - split into two payments
                stakingWrapper.payProtocolFeeAsync(makers[0], protocolFeesByMaker[0].div(2), exchange),
                stakingWrapper.payProtocolFeeAsync(makers[0], protocolFeesByMaker[0].div(2), exchange),
                // pool 1 - pay full amounts
                stakingWrapper.payProtocolFeeAsync(makers[1], protocolFeesByMaker[1], exchange),
                stakingWrapper.payProtocolFeeAsync(makers[2], protocolFeesByMaker[2], exchange),
                // pool 2 -- pay full amounts
                stakingWrapper.payProtocolFeeAsync(makers[3], protocolFeesByMaker[3], exchange),
                stakingWrapper.payProtocolFeeAsync(makers[4], protocolFeesByMaker[4], exchange),
                // maker 5 doesn't pay anything
            ]);
            ///// 3 VALIDATE FEES RECORDED FOR EACH POOL /////
            const recordedProtocolFeesByPool = await Promise.all([
                stakingWrapper.getProtocolFeesThisEpochByPoolAsync(poolIds[0]),
                stakingWrapper.getProtocolFeesThisEpochByPoolAsync(poolIds[1]),
                stakingWrapper.getProtocolFeesThisEpochByPoolAsync(poolIds[2]),
            ]);
            expect(recordedProtocolFeesByPool[0]).to.be.bignumber.equal(protocolFeesByMaker[0]);
            expect(recordedProtocolFeesByPool[1]).to.be.bignumber.equal(protocolFeesByMaker[1].plus(protocolFeesByMaker[2]));
            expect(recordedProtocolFeesByPool[2]).to.be.bignumber.equal(protocolFeesByMaker[3].plus(protocolFeesByMaker[4]));
            ///// 4 VALIDATE TOTAL FEES /////
            const recordedTotalProtocolFees = await stakingWrapper.getTotalProtocolFeesThisEpochAsync();
            const totalProtocolFeesAsNumber = _.sumBy(protocolFeesByMaker, (value: BigNumber) => {return value.toNumber()});
            const totalProtocolFees = new BigNumber(totalProtocolFeesAsNumber);
            expect(recordedTotalProtocolFees).to.be.bignumber.equal(totalProtocolFees);
            ///// 5 STAKE /////
            const stakeByPoolOperator = [
                stakingWrapper.toBaseUnitAmount(42),
                stakingWrapper.toBaseUnitAmount(84),
                stakingWrapper.toBaseUnitAmount(97),
            ];
            const totalStakeByPoolOperator = stakeByPoolOperator[0].plus(stakeByPoolOperator[1]).plus(stakeByPoolOperator[2]);
            await Promise.all([
                // pool 0
                stakingWrapper.depositAndStakeAsync(poolOperators[0], stakeByPoolOperator[0]),
                // pool 1
                stakingWrapper.depositAndStakeAsync(poolOperators[1], stakeByPoolOperator[1]),
                // pool 2
                stakingWrapper.depositAndStakeAsync(poolOperators[2], stakeByPoolOperator[2]),
            ])

            ///// 6 Add some delegators to pool 2 /////
            const delegators = stakers.slice(0, 3);
            const stakeByDelegator = [
                stakingWrapper.toBaseUnitAmount(17),
                stakingWrapper.toBaseUnitAmount(75),
                stakingWrapper.toBaseUnitAmount(90),
            ];
            const totalStakeByDelegators = stakeByDelegator[0].plus(stakeByDelegator[1]).plus(stakeByDelegator[2]);
            await Promise.all([
                stakingWrapper.depositAndDelegateAsync(delegators[0], poolIds[2], stakeByDelegator[0]),
                stakingWrapper.depositAndDelegateAsync(delegators[1], poolIds[2], stakeByDelegator[1]),
                stakingWrapper.depositAndDelegateAsync(delegators[2], poolIds[2], stakeByDelegator[2]),
            ]);
            
            ///// 6 FINALIZE /////
            await stakingWrapper.skipToNextEpochAsync();

            ///// 7 CHECK PROFITS /////
            // the expected payouts were computed by hand
            // @TODO - get computations more accurate
            /*
                Pool | Total Fees  | Total Stake | Total Delegated Stake | Total Stake (Scaled) 
                0    |  0.304958   | 42          | 0                     | 42
                1    | 15.323258   | 84          | 0                     | 84
                3    | 28.12222236 | 97          | 182                   | 260.8
                ...
                Cumulative Fees = 43.75043836
                Cumulative Stake = 405
                Total Rewards = 43.75043836
            */

            const expectedPayoutByPoolOperator = [
                new BigNumber('2.89303'),   // 2.8930364057678784829875695710382241749912199174798475
                new BigNumber('9.90218'),   // 9.9021783083174087034787071054543342142019746753770943 
                new BigNumber('28.16463'),  // 28.164631904035798614670299155719067954180760345463798
            ];

            const payoutByPoolOperator = await Promise.all([
                stakingWrapper.rewardVaultBalanceOfAsync(poolIds[0]),
                stakingWrapper.rewardVaultBalanceOfAsync(poolIds[1]),
                stakingWrapper.rewardVaultBalanceOfAsync(poolIds[2]),
            ]);

            const payoutAcurateToFiveDecimalsByPoolOperator = await Promise.all([
                stakingWrapper.trimFloat(stakingWrapper.toFloatingPoint(payoutByPoolOperator[0], 18), 5),
                stakingWrapper.trimFloat(stakingWrapper.toFloatingPoint(payoutByPoolOperator[1], 18), 5),
                stakingWrapper.trimFloat(stakingWrapper.toFloatingPoint(payoutByPoolOperator[2], 18), 5),
            ]);
            expect(payoutAcurateToFiveDecimalsByPoolOperator[0]).to.be.bignumber.equal(expectedPayoutByPoolOperator[0]);
            expect(payoutAcurateToFiveDecimalsByPoolOperator[1]).to.be.bignumber.equal(expectedPayoutByPoolOperator[1]);
            expect(payoutAcurateToFiveDecimalsByPoolOperator[2]).to.be.bignumber.equal(expectedPayoutByPoolOperator[2]);

            ///// 8 CHECK PROFITS VIA STAKING CONTRACT /////
            const payoutByPoolOperatorFromStakingContract = await Promise.all([
                stakingWrapper.getRewardBalanceAsync(poolIds[0]),
                stakingWrapper.getRewardBalanceAsync(poolIds[1]),
                stakingWrapper.getRewardBalanceAsync(poolIds[2]),
            ]);
            expect(payoutByPoolOperatorFromStakingContract[0]).to.be.bignumber.equal(payoutByPoolOperator[0]);
            expect(payoutByPoolOperatorFromStakingContract[1]).to.be.bignumber.equal(payoutByPoolOperator[1]);
            expect(payoutByPoolOperatorFromStakingContract[2]).to.be.bignumber.equal(payoutByPoolOperator[2]);


            ///// 8 CHECK DELEGATOR PROFITS /////
            const poolPayoutById = await Promise.all([
                stakingWrapper.getRewardBalanceOfPoolAsync(poolIds[0]),
                stakingWrapper.getRewardBalanceOfPoolAsync(poolIds[1]),
                stakingWrapper.getRewardBalanceOfPoolAsync(poolIds[2]),
            ]);
            const expectedRewardByDelegator = [
                poolPayoutById[2].times(stakeByDelegator[0]).dividedToIntegerBy(totalStakeByDelegators),
                poolPayoutById[2].times(stakeByDelegator[1]).dividedToIntegerBy(totalStakeByDelegators),
                poolPayoutById[2].times(stakeByDelegator[2]).dividedToIntegerBy(totalStakeByDelegators),
            ];
            
            const rewardBalanceByDelegator = await Promise.all([
                stakingWrapper.computeRewardBalanceAsync(poolIds[2], delegators[0]),
                stakingWrapper.computeRewardBalanceAsync(poolIds[2], delegators[1]),
                stakingWrapper.computeRewardBalanceAsync(poolIds[2], delegators[2]),
            ]);
            expect(rewardBalanceByDelegator[0]).to.to.bignumber.equal(expectedRewardByDelegator[0]);
            expect(rewardBalanceByDelegator[1]).to.to.bignumber.equal(expectedRewardByDelegator[1]);
            expect(rewardBalanceByDelegator[2]).to.to.bignumber.equal(expectedRewardByDelegator[2]);

            ///// 8 CHECK DELEGATOR BY UNDELEGATING /////
            const ethBalancesByDelegatorInit = await Promise.all([
                stakingWrapper.getEthBalanceAsync(delegators[0]),
                stakingWrapper.getEthBalanceAsync(delegators[1]),
                stakingWrapper.getEthBalanceAsync(delegators[2]),
            ]);
            await Promise.all([
                stakingWrapper.deactivateAndTimelockDelegatedStakeAsync(delegators[0], poolIds[2], stakeByDelegator[0]),
                stakingWrapper.deactivateAndTimelockDelegatedStakeAsync(delegators[1], poolIds[2], stakeByDelegator[1]),
                stakingWrapper.deactivateAndTimelockDelegatedStakeAsync(delegators[2], poolIds[2], stakeByDelegator[2]),
            ]);
            const ethBalancesByDelegatorFinal = await Promise.all([
                stakingWrapper.getEthBalanceAsync(delegators[0]),
                stakingWrapper.getEthBalanceAsync(delegators[1]),
                stakingWrapper.getEthBalanceAsync(delegators[2]),
            ]);
            const rewardByDelegator = [
                ethBalancesByDelegatorFinal[0].minus(ethBalancesByDelegatorInit[0]),
                ethBalancesByDelegatorFinal[1].minus(ethBalancesByDelegatorInit[1]),
                ethBalancesByDelegatorFinal[2].minus(ethBalancesByDelegatorInit[2]),
            ];
            expect(rewardByDelegator[0]).to.be.bignumber.equal(expectedRewardByDelegator[0]);
            expect(rewardByDelegator[1]).to.be.bignumber.equal(expectedRewardByDelegator[1]);
            // note that these may be slightly off due to rounding down on each entry
            // there is a carry over between calls, which we account for here.
            // if the last person to leave rounded down, then there is some trace amount left in the pool.
            // carry-over here is 00000000000000000002 
            expect(rewardByDelegator[2]).to.be.bignumber.equal(expectedRewardByDelegator[2].plus('00000000000000000002', 10));  

            ///// 9 CHECK OPERATOR PROFITS VIA STAKING CONTRACT /////
            const operatorPayoutByPoolOperatorFromStakingContract = await Promise.all([
                stakingWrapper.getRewardBalanceOfOperatorAsync(poolIds[0]),
                stakingWrapper.getRewardBalanceOfOperatorAsync(poolIds[1]),
                stakingWrapper.getRewardBalanceOfOperatorAsync(poolIds[2]),
            ]);
            const expectedOperatorPayoutByPoolOperatorFromStakingContract = [
                payoutByPoolOperator[0].times(operatorShares[0]).plus(99).dividedToIntegerBy(100),
                payoutByPoolOperator[1].times(operatorShares[1]).plus(99).dividedToIntegerBy(100),
                payoutByPoolOperator[2].times(operatorShares[2]).plus(99).dividedToIntegerBy(100)
            ];
            expect(operatorPayoutByPoolOperatorFromStakingContract[0]).to.be.bignumber.equal(expectedOperatorPayoutByPoolOperatorFromStakingContract[0]);
            expect(operatorPayoutByPoolOperatorFromStakingContract[1]).to.be.bignumber.equal(expectedOperatorPayoutByPoolOperatorFromStakingContract[1]);
            expect(operatorPayoutByPoolOperatorFromStakingContract[2]).to.be.bignumber.equal(expectedOperatorPayoutByPoolOperatorFromStakingContract[2]);
            
            ///// 10 WITHDRAW PROFITS VIA STAKING CONTRACT /////
            const initOperatorBalances = await Promise.all([
                stakingWrapper.getEthBalanceAsync(poolOperators[0]),
                stakingWrapper.getEthBalanceAsync(poolOperators[1]),
                stakingWrapper.getEthBalanceAsync(poolOperators[2]),
            ]);
            await Promise.all([
                stakingWrapper.withdrawTotalOperatorRewardAsync(poolIds[0], poolOperators[0]),
                stakingWrapper.withdrawTotalOperatorRewardAsync(poolIds[1], poolOperators[1]),
                stakingWrapper.withdrawTotalOperatorRewardAsync(poolIds[2], poolOperators[2]),
            ]);
            const finalOperatorBalances = await Promise.all([
                stakingWrapper.getEthBalanceAsync(poolOperators[0]),
                stakingWrapper.getEthBalanceAsync(poolOperators[1]),
                stakingWrapper.getEthBalanceAsync(poolOperators[2]),
            ]);
            const payoutBalancesByOperator = [
                finalOperatorBalances[0].minus(initOperatorBalances[0]),
                finalOperatorBalances[1].minus(initOperatorBalances[1]),
                finalOperatorBalances[2].minus(initOperatorBalances[2]),
            ];
            expect(payoutBalancesByOperator[0]).to.be.bignumber.equal(expectedOperatorPayoutByPoolOperatorFromStakingContract[0]);
            expect(payoutBalancesByOperator[1]).to.be.bignumber.equal(expectedOperatorPayoutByPoolOperatorFromStakingContract[1]);
            expect(payoutBalancesByOperator[2]).to.be.bignumber.equal(expectedOperatorPayoutByPoolOperatorFromStakingContract[2]);
        });

        it('Finalization with Protocol Fees and Delegation with shadow ETH', async () => {
            ///// 0 DEPLOY EXCHANGE /////
            await stakingWrapper.addExchangeAddressAsync(exchange);
            ///// 1 SETUP POOLS /////
            const poolOperators = makers.slice(0, 3);
            const operatorShares = [39, 59, 43];
            const poolIds = await Promise.all([
                stakingWrapper.createPoolAsync(poolOperators[0], operatorShares[0]),
                stakingWrapper.createPoolAsync(poolOperators[1], operatorShares[1]),
                stakingWrapper.createPoolAsync(poolOperators[2], operatorShares[2]),
            ]);
            const makersByPoolId = [
                [
                    makers[0],
                ],
                [
                    makers[1],
                    makers[2]
                ],
                [
                    makers[3],
                    makers[4],
                    makers[5]
                ],
            ];
            const protocolFeesByMaker = [
                // pool 1 - adds up to protocolFeesByPoolId[0]
                stakingWrapper.toBaseUnitAmount(0.304958),
                // pool 2 - adds up to protocolFeesByPoolId[1]
                stakingWrapper.toBaseUnitAmount(3.2),
                stakingWrapper.toBaseUnitAmount(12.123258),
                // pool 3 - adds up to protocolFeesByPoolId[2]
                stakingWrapper.toBaseUnitAmount(23.577),
                stakingWrapper.toBaseUnitAmount(4.54522236),
                stakingWrapper.toBaseUnitAmount(0)
            ];
            const makerSignatures = [
                // pool 0
                stakingWrapper.signApprovalForStakingPool(poolIds[0], makersByPoolId[0][0]).signature,
                // pool 1
                stakingWrapper.signApprovalForStakingPool(poolIds[1], makersByPoolId[1][0]).signature,
                stakingWrapper.signApprovalForStakingPool(poolIds[1], makersByPoolId[1][1]).signature,
                // pool 2
                stakingWrapper.signApprovalForStakingPool(poolIds[2], makersByPoolId[2][0]).signature,
                stakingWrapper.signApprovalForStakingPool(poolIds[2], makersByPoolId[2][1]).signature,
                stakingWrapper.signApprovalForStakingPool(poolIds[2], makersByPoolId[2][2]).signature,
            ]
            await Promise.all([
                // pool 0
                stakingWrapper.addMakerToPoolAsync(poolIds[0], makersByPoolId[0][0], makerSignatures[0], poolOperators[0]),
                // pool 1
                stakingWrapper.addMakerToPoolAsync(poolIds[1], makersByPoolId[1][0], makerSignatures[1], poolOperators[1]),
                stakingWrapper.addMakerToPoolAsync(poolIds[1], makersByPoolId[1][1], makerSignatures[2], poolOperators[1]),
                // pool 2
                stakingWrapper.addMakerToPoolAsync(poolIds[2], makersByPoolId[2][0], makerSignatures[3], poolOperators[2]),
                stakingWrapper.addMakerToPoolAsync(poolIds[2], makersByPoolId[2][1], makerSignatures[4], poolOperators[2]),
                stakingWrapper.addMakerToPoolAsync(poolIds[2], makersByPoolId[2][2], makerSignatures[5], poolOperators[2]),
            ]);
            ///// 2 PAY FEES /////
            await Promise.all([
                // pool 0 - split into two payments
                stakingWrapper.payProtocolFeeAsync(makers[0], protocolFeesByMaker[0].div(2), exchange),
                stakingWrapper.payProtocolFeeAsync(makers[0], protocolFeesByMaker[0].div(2), exchange),
                // pool 1 - pay full amounts
                stakingWrapper.payProtocolFeeAsync(makers[1], protocolFeesByMaker[1], exchange),
                stakingWrapper.payProtocolFeeAsync(makers[2], protocolFeesByMaker[2], exchange),
                // pool 2 -- pay full amounts
                stakingWrapper.payProtocolFeeAsync(makers[3], protocolFeesByMaker[3], exchange),
                stakingWrapper.payProtocolFeeAsync(makers[4], protocolFeesByMaker[4], exchange),
                // maker 5 doesn't pay anything
            ]);
            ///// 3 VALIDATE FEES RECORDED FOR EACH POOL /////
            const recordedProtocolFeesByPool = await Promise.all([
                stakingWrapper.getProtocolFeesThisEpochByPoolAsync(poolIds[0]),
                stakingWrapper.getProtocolFeesThisEpochByPoolAsync(poolIds[1]),
                stakingWrapper.getProtocolFeesThisEpochByPoolAsync(poolIds[2]),
            ]);
            expect(recordedProtocolFeesByPool[0]).to.be.bignumber.equal(protocolFeesByMaker[0]);
            expect(recordedProtocolFeesByPool[1]).to.be.bignumber.equal(protocolFeesByMaker[1].plus(protocolFeesByMaker[2]));
            expect(recordedProtocolFeesByPool[2]).to.be.bignumber.equal(protocolFeesByMaker[3].plus(protocolFeesByMaker[4]));
            ///// 4 VALIDATE TOTAL FEES /////
            const recordedTotalProtocolFees = await stakingWrapper.getTotalProtocolFeesThisEpochAsync();
            const totalProtocolFeesAsNumber = _.sumBy(protocolFeesByMaker, (value: BigNumber) => {return value.toNumber()});
            const totalProtocolFees = new BigNumber(totalProtocolFeesAsNumber);
            expect(recordedTotalProtocolFees).to.be.bignumber.equal(totalProtocolFees);
            ///// 5 STAKE /////
            const stakeByPoolOperator = [
                stakingWrapper.toBaseUnitAmount(42),
                stakingWrapper.toBaseUnitAmount(84),
                stakingWrapper.toBaseUnitAmount(97),
            ];
            const totalStakeByPoolOperator = stakeByPoolOperator[0].plus(stakeByPoolOperator[1]).plus(stakeByPoolOperator[2]);
            await Promise.all([
                // pool 0
                stakingWrapper.depositAndStakeAsync(poolOperators[0], stakeByPoolOperator[0]),
                // pool 1
                stakingWrapper.depositAndStakeAsync(poolOperators[1], stakeByPoolOperator[1]),
                // pool 2
                stakingWrapper.depositAndStakeAsync(poolOperators[2], stakeByPoolOperator[2]),
            ]);

            ///// 6 FINALIZE /////
            await stakingWrapper.skipToNextEpochAsync();
            
            ///// 7 ADD DELEGATORS (Requires Shadow ETH) /////
            const delegators = stakers.slice(0, 3);
            const stakeByDelegator = [
                stakingWrapper.toBaseUnitAmount(17),
                stakingWrapper.toBaseUnitAmount(75),
                stakingWrapper.toBaseUnitAmount(90),
            ];
            const totalStakeByDelegators = stakeByDelegator[0].plus(stakeByDelegator[1]).plus(stakeByDelegator[2]);
            await Promise.all([
                stakingWrapper.depositAndDelegateAsync(delegators[0], poolIds[2], stakeByDelegator[0]),
                stakingWrapper.depositAndDelegateAsync(delegators[1], poolIds[2], stakeByDelegator[1]),
                stakingWrapper.depositAndDelegateAsync(delegators[2], poolIds[2], stakeByDelegator[2]),
            ]);

            ///// 7 FINALIZE AGAIN /////
            await stakingWrapper.skipToNextEpochAsync();
        
            ///// 7 CHECK PROFITS /////
            // the expected payouts were computed by hand
            // @TODO - get computations more accurate
            /*
                Pool | Total Fees  | Total Stake | Total Delegated Stake | Total Stake (Scaled) 
                0    |  0.304958   | 42          | 0                     | 42
                1    | 15.323258   | 84          | 0                     | 84
                3    | 28.12222236 | 97          | 182                   | 260.8
                ...
                Cumulative Fees = 43.75043836
                Cumulative Stake = 405
                Total Rewards = 43.75043836
            */

            const expectedPayoutByPoolOperator = [
                new BigNumber('4.75677'),  // 4.756772362932728793619590327361600155564384201215274334070
                new BigNumber('16.28130'), // 16.28130500394935316563988584956596823402223838026190634525
                new BigNumber('20.31028'), // 20.31028447343014834523983759032242063760612769662934308289
            ];

            const payoutByPoolOperator = await Promise.all([
                stakingWrapper.rewardVaultBalanceOfAsync(poolIds[0]),
                stakingWrapper.rewardVaultBalanceOfAsync(poolIds[1]),
                stakingWrapper.rewardVaultBalanceOfAsync(poolIds[2]),
            ]);

            const payoutAcurateToFiveDecimalsByPoolOperator = await Promise.all([
                stakingWrapper.trimFloat(stakingWrapper.toFloatingPoint(payoutByPoolOperator[0], 18), 5),
                stakingWrapper.trimFloat(stakingWrapper.toFloatingPoint(payoutByPoolOperator[1], 18), 5),
                stakingWrapper.trimFloat(stakingWrapper.toFloatingPoint(payoutByPoolOperator[2], 18), 5),
            ]);
            expect(payoutAcurateToFiveDecimalsByPoolOperator[0]).to.be.bignumber.equal(expectedPayoutByPoolOperator[0]);
            expect(payoutAcurateToFiveDecimalsByPoolOperator[1]).to.be.bignumber.equal(expectedPayoutByPoolOperator[1]);
            expect(payoutAcurateToFiveDecimalsByPoolOperator[2]).to.be.bignumber.equal(expectedPayoutByPoolOperator[2]);

            ///// 10 CHECK DELEGATOR PAYOUT BY UNDELEGATING /////
            const poolPayoutById = await Promise.all([
                stakingWrapper.rewardVaultBalanceOfPoolAsync(poolIds[0]),
                stakingWrapper.rewardVaultBalanceOfPoolAsync(poolIds[1]),
                stakingWrapper.rewardVaultBalanceOfPoolAsync(poolIds[2]),
            ]);
            const ethBalancesByDelegatorInit = await Promise.all([
                stakingWrapper.getEthBalanceAsync(delegators[0]),
                stakingWrapper.getEthBalanceAsync(delegators[1]),
                stakingWrapper.getEthBalanceAsync(delegators[2]),
            ]);
            await Promise.all([
                stakingWrapper.deactivateAndTimelockDelegatedStakeAsync(delegators[0], poolIds[2], stakeByDelegator[0]),
                stakingWrapper.deactivateAndTimelockDelegatedStakeAsync(delegators[1], poolIds[2], stakeByDelegator[1]),
                stakingWrapper.deactivateAndTimelockDelegatedStakeAsync(delegators[2], poolIds[2], stakeByDelegator[2]),
            ]);
            const ethBalancesByDelegatorFinal = await Promise.all([
                stakingWrapper.getEthBalanceAsync(delegators[0]),
                stakingWrapper.getEthBalanceAsync(delegators[1]),
                stakingWrapper.getEthBalanceAsync(delegators[2]),
            ]);
            const rewardByDelegator = [
                ethBalancesByDelegatorFinal[0].minus(ethBalancesByDelegatorInit[0]),
                ethBalancesByDelegatorFinal[1].minus(ethBalancesByDelegatorInit[1]),
                ethBalancesByDelegatorFinal[2].minus(ethBalancesByDelegatorInit[2]),
            ];

            // In this case, there was already a pot of ETH in the delegator pool that nobody had claimed.
            // The first delegator got to claim it all. This is due to the necessary conservation of payouts.
            // When a new delegator arrives, their new stake should not affect existing delegator payouts.
            // In this case, there was unclaimed $$ in the delegator pool - which is claimed by the first delegator.
            const expectedRewardByDelegator = [
                poolPayoutById[2],
                new BigNumber(0),
                new BigNumber(0),
            ];
            expect(rewardByDelegator[0]).to.be.bignumber.equal(expectedRewardByDelegator[0]);
            expect(rewardByDelegator[1]).to.be.bignumber.equal(expectedRewardByDelegator[1]);
            expect(rewardByDelegator[2]).to.be.bignumber.equal(expectedRewardByDelegator[2]);        
        });

        it.only('SIM - Finalization with Protocol Fees and Delegation with shadow ETH (withdraw w/o undelegating)', async () => {
             // @TODO - get computations more accurate
            /*
                Pool | Total Fees  | Total Stake | Total Delegated Stake | Total Stake (Scaled) 
                0    |  0.304958   | 42          | 0                     | 42
                1    | 15.323258   | 84          | 0                     | 84
                3    | 28.12222236 | 97          | 182                   | 260.8
                ...
                Cumulative Fees = 43.75043836
                Cumulative Stake = 405
                Total Rewards = 43.75043836

                // In this case, there was already a pot of ETH in the delegator pool that nobody had claimed.
                // The first delegator got to claim it all. This is due to the necessary conservation of payouts.
                // When a new delegator arrives, their new stake should not affect existing delegator payouts.
                // In this case, there was unclaimed $$ in the delegator pool - which is claimed by the first delegator.
            */
            const simulationParams = {
                users,
                numberOfPools: 3,
                poolOperatorShares: [39, 59, 43],
                stakeByPoolOperator: [
                    stakingWrapper.toBaseUnitAmount(42),
                    stakingWrapper.toBaseUnitAmount(84),
                    stakingWrapper.toBaseUnitAmount(97),
                ],
                numberOfMakers: 6,
                numberOfMakersPerPool: [1, 2, 3],
                protocolFeesByMaker: [
                    // pool 1
                    stakingWrapper.toBaseUnitAmount(0.304958),
                    // pool 2
                    stakingWrapper.toBaseUnitAmount(3.2),
                    stakingWrapper.toBaseUnitAmount(12.123258),
                    // pool 3
                    stakingWrapper.toBaseUnitAmount(23.577),
                    stakingWrapper.toBaseUnitAmount(4.54522236),
                    stakingWrapper.toBaseUnitAmount(0)
                ],
                numberOfDelegators: 3,
                numberOfDelegatorsPerPool: [0, 0, 3],
                stakeByDelegator: [
                    stakingWrapper.toBaseUnitAmount(17),
                    stakingWrapper.toBaseUnitAmount(75),
                    stakingWrapper.toBaseUnitAmount(90),
                ],
                delegateInNextEpoch: true,  // forces shadow eth
                undelegateAtEnd: true,      // profits are withdrawn as result of undelegating
                expectedFeesByPool: [
                    stakingWrapper.toBaseUnitAmount(0.304958),
                    stakingWrapper.toBaseUnitAmount(15.323258),
                    stakingWrapper.toBaseUnitAmount(28.12222236),
                ],
                expectedPayoutByPool: [
                    new BigNumber('4.75677'),   // 4.756772362932728793619590327361600155564384201215274334070
                    new BigNumber('16.28130'),  // 16.28130500394935316563988584956596823402223838026190634525
                    new BigNumber('20.31028'),  // 20.31028447343014834523983759032242063760612769662934308289
                ],
                expectedPayoutByPoolOperator: [
                    new BigNumber('1.85514'),   // 0.39 * 4.75677
                    new BigNumber('9.60597'),   // 0.59 * 16.28130
                    new BigNumber('8.73342')    // 0.43 * 20.31028
                ],
                expectedMembersPayoutByPool: [
                    new BigNumber('2.90163'),   // (1 - 0.39) * 4.75677
                    new BigNumber('6.67533'),   // (1 - 0.59) * 16.28130
                    new BigNumber('11.57686'),  // (1 - 0.43) * 20.31028
                ],
                expectedPayoutByDelegator: [
                    new BigNumber('11.57686'),  // (1 - 0.43) * 20.31028
                    new BigNumber(0),
                    new BigNumber(0),
                ],
                exchangeAddress: exchange,
                
            };
            const simulator = new Simulation(stakingWrapper, simulationParams);
            await simulator.runAsync();
        });

        it.skip('Finalization with Protocol Fees and Delegation with shadow ETH (withdraw w/o undelegating)', async () => {
           
            ///// 1 SETUP POOLS /////
           
            ///// 2 PAY FEES /////

            ///// 3 VALIDATE FEES RECORDED FOR EACH POOL /////

            ///// 4 VALIDATE TOTAL FEES /////
            
            ///// 5 STAKE /////

            ///// 6 FINALIZE /////
            
            ///// 7 ADD DELEGATORS (Requires Shadow ETH) /////

            ///// 7 FINALIZE AGAIN /////
        
            ///// 7 CHECK PROFITS /////
            // the expected payouts were computed by hand
  /*
            
            ///// 10 CHECK DELEGATOR PAYOUT BY WITHDRAWING /////
            {
                const poolPayoutById = await Promise.all([
                    stakingWrapper.rewardVaultBalanceOfPoolAsync(poolIds[0]),
                    stakingWrapper.rewardVaultBalanceOfPoolAsync(poolIds[1]),
                    stakingWrapper.rewardVaultBalanceOfPoolAsync(poolIds[2]),
                ]);
                const ethBalancesByDelegatorInit = await Promise.all([
                    stakingWrapper.getEthBalanceAsync(delegators[0]),
                    stakingWrapper.getEthBalanceAsync(delegators[1]),
                    stakingWrapper.getEthBalanceAsync(delegators[2]),
                ]);
                await Promise.all([
                    stakingWrapper.withdrawTotalRewardAsync(poolIds[2], delegators[0]),
                    stakingWrapper.withdrawTotalRewardAsync(poolIds[2], delegators[1]),
                    stakingWrapper.withdrawTotalRewardAsync(poolIds[2], delegators[2]),
                ]);
                const ethBalancesByDelegatorFinal = await Promise.all([
                    stakingWrapper.getEthBalanceAsync(delegators[0]),
                    stakingWrapper.getEthBalanceAsync(delegators[1]),
                    stakingWrapper.getEthBalanceAsync(delegators[2]),
                ]);
                const rewardByDelegator = [
                    ethBalancesByDelegatorFinal[0].minus(ethBalancesByDelegatorInit[0]),
                    ethBalancesByDelegatorFinal[1].minus(ethBalancesByDelegatorInit[1]),
                    ethBalancesByDelegatorFinal[2].minus(ethBalancesByDelegatorInit[2]),
                ];

                // In this case, there was already a pot of ETH in the delegator pool that nobody had claimed.
                // The first delegator got to claim it all. This is due to the necessary conservation of payouts.
                // When a new delegator arrives, their new stake should not affect existing delegator payouts.
                // In this case, there was unclaimed $$ in the delegator pool - which is claimed by the first delegator.
                const expectedRewardByDelegator = [
                    poolPayoutById[2],
                    new BigNumber(0),
                    new BigNumber(0),
                ];
                expect(rewardByDelegator[0]).to.be.bignumber.equal(expectedRewardByDelegator[0]);
                expect(rewardByDelegator[1]).to.be.bignumber.equal(expectedRewardByDelegator[1]);
                expect(rewardByDelegator[2]).to.be.bignumber.equal(expectedRewardByDelegator[2]); 
            }
            
            {
                ///// 10 CHECK DELEGATOR PAYOUT BY UNDELEGATING /////
                const poolPayoutById = await Promise.all([
                    stakingWrapper.rewardVaultBalanceOfPoolAsync(poolIds[0]),
                    stakingWrapper.rewardVaultBalanceOfPoolAsync(poolIds[1]),
                    stakingWrapper.rewardVaultBalanceOfPoolAsync(poolIds[2]),
                ]);
                const ethBalancesByDelegatorInit = await Promise.all([
                    stakingWrapper.getEthBalanceAsync(delegators[0]),
                    stakingWrapper.getEthBalanceAsync(delegators[1]),
                    stakingWrapper.getEthBalanceAsync(delegators[2]),
                ]);
                await Promise.all([
                    stakingWrapper.deactivateAndTimelockDelegatedStakeAsync(delegators[0], poolIds[2], stakeByDelegator[0]),
                    stakingWrapper.deactivateAndTimelockDelegatedStakeAsync(delegators[1], poolIds[2], stakeByDelegator[1]),
                    stakingWrapper.deactivateAndTimelockDelegatedStakeAsync(delegators[2], poolIds[2], stakeByDelegator[2]),
                ]);
                const ethBalancesByDelegatorFinal = await Promise.all([
                    stakingWrapper.getEthBalanceAsync(delegators[0]),
                    stakingWrapper.getEthBalanceAsync(delegators[1]),
                    stakingWrapper.getEthBalanceAsync(delegators[2]),
                ]);
                const rewardByDelegator = [
                    ethBalancesByDelegatorFinal[0].minus(ethBalancesByDelegatorInit[0]),
                    ethBalancesByDelegatorFinal[1].minus(ethBalancesByDelegatorInit[1]),
                    ethBalancesByDelegatorFinal[2].minus(ethBalancesByDelegatorInit[2]),
                ];

                // In this case, there was already a pot of ETH in the delegator pool that nobody had claimed.
                // The first delegator got to claim it all. This is due to the necessary conservation of payouts.
                // When a new delegator arrives, their new stake should not affect existing delegator payouts.
                // In this case, there was unclaimed $$ in the delegator pool - which is claimed by the first delegator.
                const expectedRewardByDelegator = [
                    new BigNumber(0),
                    new BigNumber(0),
                    new BigNumber(0),
                ];
                expect(rewardByDelegator[0]).to.be.bignumber.equal(expectedRewardByDelegator[0]);
                expect(rewardByDelegator[1]).to.be.bignumber.equal(expectedRewardByDelegator[1]);
                expect(rewardByDelegator[2]).to.be.bignumber.equal(expectedRewardByDelegator[2]);
            }
            */
        });

        it('Finalization with Protocol Fees and Delegation with shadow ETH (withdraw w/o undelegating)', async () => {
            ///// 0 DEPLOY EXCHANGE /////
            await stakingWrapper.addExchangeAddressAsync(exchange);
            ///// 1 SETUP POOLS /////
            const poolOperators = makers.slice(0, 3);
            const operatorShares = [39, 59, 43];
            const poolIds = await Promise.all([
                stakingWrapper.createPoolAsync(poolOperators[0], operatorShares[0]),
                stakingWrapper.createPoolAsync(poolOperators[1], operatorShares[1]),
                stakingWrapper.createPoolAsync(poolOperators[2], operatorShares[2]),
            ]);
            const makersByPoolId = [
                [
                    makers[0],
                ],
                [
                    makers[1],
                    makers[2]
                ],
                [
                    makers[3],
                    makers[4],
                    makers[5]
                ],
            ];
            const protocolFeesByMaker = [
                // pool 1 - adds up to protocolFeesByPoolId[0]
                stakingWrapper.toBaseUnitAmount(0.304958),
                // pool 2 - adds up to protocolFeesByPoolId[1]
                stakingWrapper.toBaseUnitAmount(3.2),
                stakingWrapper.toBaseUnitAmount(12.123258),
                // pool 3 - adds up to protocolFeesByPoolId[2]
                stakingWrapper.toBaseUnitAmount(23.577),
                stakingWrapper.toBaseUnitAmount(4.54522236),
                stakingWrapper.toBaseUnitAmount(0)
            ];
            const makerSignatures = [
                // pool 0
                stakingWrapper.signApprovalForStakingPool(poolIds[0], makersByPoolId[0][0]).signature,
                // pool 1
                stakingWrapper.signApprovalForStakingPool(poolIds[1], makersByPoolId[1][0]).signature,
                stakingWrapper.signApprovalForStakingPool(poolIds[1], makersByPoolId[1][1]).signature,
                // pool 2
                stakingWrapper.signApprovalForStakingPool(poolIds[2], makersByPoolId[2][0]).signature,
                stakingWrapper.signApprovalForStakingPool(poolIds[2], makersByPoolId[2][1]).signature,
                stakingWrapper.signApprovalForStakingPool(poolIds[2], makersByPoolId[2][2]).signature,
            ]
            await Promise.all([
                // pool 0
                stakingWrapper.addMakerToPoolAsync(poolIds[0], makersByPoolId[0][0], makerSignatures[0], poolOperators[0]),
                // pool 1
                stakingWrapper.addMakerToPoolAsync(poolIds[1], makersByPoolId[1][0], makerSignatures[1], poolOperators[1]),
                stakingWrapper.addMakerToPoolAsync(poolIds[1], makersByPoolId[1][1], makerSignatures[2], poolOperators[1]),
                // pool 2
                stakingWrapper.addMakerToPoolAsync(poolIds[2], makersByPoolId[2][0], makerSignatures[3], poolOperators[2]),
                stakingWrapper.addMakerToPoolAsync(poolIds[2], makersByPoolId[2][1], makerSignatures[4], poolOperators[2]),
                stakingWrapper.addMakerToPoolAsync(poolIds[2], makersByPoolId[2][2], makerSignatures[5], poolOperators[2]),
            ]);
            ///// 2 PAY FEES /////
            await Promise.all([
                // pool 0 - split into two payments
                stakingWrapper.payProtocolFeeAsync(makers[0], protocolFeesByMaker[0].div(2), exchange),
                stakingWrapper.payProtocolFeeAsync(makers[0], protocolFeesByMaker[0].div(2), exchange),
                // pool 1 - pay full amounts
                stakingWrapper.payProtocolFeeAsync(makers[1], protocolFeesByMaker[1], exchange),
                stakingWrapper.payProtocolFeeAsync(makers[2], protocolFeesByMaker[2], exchange),
                // pool 2 -- pay full amounts
                stakingWrapper.payProtocolFeeAsync(makers[3], protocolFeesByMaker[3], exchange),
                stakingWrapper.payProtocolFeeAsync(makers[4], protocolFeesByMaker[4], exchange),
                // maker 5 doesn't pay anything
            ]);
            ///// 3 VALIDATE FEES RECORDED FOR EACH POOL /////
            const recordedProtocolFeesByPool = await Promise.all([
                stakingWrapper.getProtocolFeesThisEpochByPoolAsync(poolIds[0]),
                stakingWrapper.getProtocolFeesThisEpochByPoolAsync(poolIds[1]),
                stakingWrapper.getProtocolFeesThisEpochByPoolAsync(poolIds[2]),
            ]);
            expect(recordedProtocolFeesByPool[0]).to.be.bignumber.equal(protocolFeesByMaker[0]);
            expect(recordedProtocolFeesByPool[1]).to.be.bignumber.equal(protocolFeesByMaker[1].plus(protocolFeesByMaker[2]));
            expect(recordedProtocolFeesByPool[2]).to.be.bignumber.equal(protocolFeesByMaker[3].plus(protocolFeesByMaker[4]));
            ///// 4 VALIDATE TOTAL FEES /////
            const recordedTotalProtocolFees = await stakingWrapper.getTotalProtocolFeesThisEpochAsync();
            const totalProtocolFeesAsNumber = _.sumBy(protocolFeesByMaker, (value: BigNumber) => {return value.toNumber()});
            const totalProtocolFees = new BigNumber(totalProtocolFeesAsNumber);
            expect(recordedTotalProtocolFees).to.be.bignumber.equal(totalProtocolFees);
            ///// 5 STAKE /////
            const stakeByPoolOperator = [
                stakingWrapper.toBaseUnitAmount(42),
                stakingWrapper.toBaseUnitAmount(84),
                stakingWrapper.toBaseUnitAmount(97),
            ];
            const totalStakeByPoolOperator = stakeByPoolOperator[0].plus(stakeByPoolOperator[1]).plus(stakeByPoolOperator[2]);
            await Promise.all([
                // pool 0
                stakingWrapper.depositAndStakeAsync(poolOperators[0], stakeByPoolOperator[0]),
                // pool 1
                stakingWrapper.depositAndStakeAsync(poolOperators[1], stakeByPoolOperator[1]),
                // pool 2
                stakingWrapper.depositAndStakeAsync(poolOperators[2], stakeByPoolOperator[2]),
            ]);

            ///// 6 FINALIZE /////
            await stakingWrapper.skipToNextEpochAsync();
            
            ///// 7 ADD DELEGATORS (Requires Shadow ETH) /////
            const delegators = stakers.slice(0, 3);
            const stakeByDelegator = [
                stakingWrapper.toBaseUnitAmount(17),
                stakingWrapper.toBaseUnitAmount(75),
                stakingWrapper.toBaseUnitAmount(90),
            ];
            const totalStakeByDelegators = stakeByDelegator[0].plus(stakeByDelegator[1]).plus(stakeByDelegator[2]);
            await Promise.all([
                stakingWrapper.depositAndDelegateAsync(delegators[0], poolIds[2], stakeByDelegator[0]),
                stakingWrapper.depositAndDelegateAsync(delegators[1], poolIds[2], stakeByDelegator[1]),
                stakingWrapper.depositAndDelegateAsync(delegators[2], poolIds[2], stakeByDelegator[2]),
            ]);

            ///// 7 FINALIZE AGAIN /////
            await stakingWrapper.skipToNextEpochAsync();
        
            ///// 7 CHECK PROFITS /////
            // the expected payouts were computed by hand
            // @TODO - get computations more accurate
            /*
                Pool | Total Fees  | Total Stake | Total Delegated Stake | Total Stake (Scaled) 
                0    |  0.304958   | 42          | 0                     | 42
                1    | 15.323258   | 84          | 0                     | 84
                3    | 28.12222236 | 97          | 182                   | 260.8
                ...
                Cumulative Fees = 43.75043836
                Cumulative Stake = 405
                Total Rewards = 43.75043836
            */

            const expectedPayoutByPoolOperator = [
                new BigNumber('4.75677'),  // 4.756772362932728793619590327361600155564384201215274334070
                new BigNumber('16.28130'), // 16.28130500394935316563988584956596823402223838026190634525
                new BigNumber('20.31028'), // 20.31028447343014834523983759032242063760612769662934308289
            ];

            const payoutByPoolOperator = await Promise.all([
                stakingWrapper.rewardVaultBalanceOfAsync(poolIds[0]),
                stakingWrapper.rewardVaultBalanceOfAsync(poolIds[1]),
                stakingWrapper.rewardVaultBalanceOfAsync(poolIds[2]),
            ]);

            const payoutAcurateToFiveDecimalsByPoolOperator = await Promise.all([
                stakingWrapper.trimFloat(stakingWrapper.toFloatingPoint(payoutByPoolOperator[0], 18), 5),
                stakingWrapper.trimFloat(stakingWrapper.toFloatingPoint(payoutByPoolOperator[1], 18), 5),
                stakingWrapper.trimFloat(stakingWrapper.toFloatingPoint(payoutByPoolOperator[2], 18), 5),
            ]);
            expect(payoutAcurateToFiveDecimalsByPoolOperator[0]).to.be.bignumber.equal(expectedPayoutByPoolOperator[0]);
            expect(payoutAcurateToFiveDecimalsByPoolOperator[1]).to.be.bignumber.equal(expectedPayoutByPoolOperator[1]);
            expect(payoutAcurateToFiveDecimalsByPoolOperator[2]).to.be.bignumber.equal(expectedPayoutByPoolOperator[2]);

            
            ///// 10 CHECK DELEGATOR PAYOUT BY WITHDRAWING /////
            {
                const poolPayoutById = await Promise.all([
                    stakingWrapper.rewardVaultBalanceOfPoolAsync(poolIds[0]),
                    stakingWrapper.rewardVaultBalanceOfPoolAsync(poolIds[1]),
                    stakingWrapper.rewardVaultBalanceOfPoolAsync(poolIds[2]),
                ]);
                const ethBalancesByDelegatorInit = await Promise.all([
                    stakingWrapper.getEthBalanceAsync(delegators[0]),
                    stakingWrapper.getEthBalanceAsync(delegators[1]),
                    stakingWrapper.getEthBalanceAsync(delegators[2]),
                ]);
                await Promise.all([
                    stakingWrapper.withdrawTotalRewardAsync(poolIds[2], delegators[0]),
                    stakingWrapper.withdrawTotalRewardAsync(poolIds[2], delegators[1]),
                    stakingWrapper.withdrawTotalRewardAsync(poolIds[2], delegators[2]),
                ]);
                const ethBalancesByDelegatorFinal = await Promise.all([
                    stakingWrapper.getEthBalanceAsync(delegators[0]),
                    stakingWrapper.getEthBalanceAsync(delegators[1]),
                    stakingWrapper.getEthBalanceAsync(delegators[2]),
                ]);
                const rewardByDelegator = [
                    ethBalancesByDelegatorFinal[0].minus(ethBalancesByDelegatorInit[0]),
                    ethBalancesByDelegatorFinal[1].minus(ethBalancesByDelegatorInit[1]),
                    ethBalancesByDelegatorFinal[2].minus(ethBalancesByDelegatorInit[2]),
                ];

                // In this case, there was already a pot of ETH in the delegator pool that nobody had claimed.
                // The first delegator got to claim it all. This is due to the necessary conservation of payouts.
                // When a new delegator arrives, their new stake should not affect existing delegator payouts.
                // In this case, there was unclaimed $$ in the delegator pool - which is claimed by the first delegator.
                const expectedRewardByDelegator = [
                    poolPayoutById[2],
                    new BigNumber(0),
                    new BigNumber(0),
                ];
                expect(rewardByDelegator[0]).to.be.bignumber.equal(expectedRewardByDelegator[0]);
                expect(rewardByDelegator[1]).to.be.bignumber.equal(expectedRewardByDelegator[1]);
                expect(rewardByDelegator[2]).to.be.bignumber.equal(expectedRewardByDelegator[2]); 
            }
            
            {
                ///// 10 CHECK DELEGATOR PAYOUT BY UNDELEGATING /////
                const poolPayoutById = await Promise.all([
                    stakingWrapper.rewardVaultBalanceOfPoolAsync(poolIds[0]),
                    stakingWrapper.rewardVaultBalanceOfPoolAsync(poolIds[1]),
                    stakingWrapper.rewardVaultBalanceOfPoolAsync(poolIds[2]),
                ]);
                const ethBalancesByDelegatorInit = await Promise.all([
                    stakingWrapper.getEthBalanceAsync(delegators[0]),
                    stakingWrapper.getEthBalanceAsync(delegators[1]),
                    stakingWrapper.getEthBalanceAsync(delegators[2]),
                ]);
                await Promise.all([
                    stakingWrapper.deactivateAndTimelockDelegatedStakeAsync(delegators[0], poolIds[2], stakeByDelegator[0]),
                    stakingWrapper.deactivateAndTimelockDelegatedStakeAsync(delegators[1], poolIds[2], stakeByDelegator[1]),
                    stakingWrapper.deactivateAndTimelockDelegatedStakeAsync(delegators[2], poolIds[2], stakeByDelegator[2]),
                ]);
                const ethBalancesByDelegatorFinal = await Promise.all([
                    stakingWrapper.getEthBalanceAsync(delegators[0]),
                    stakingWrapper.getEthBalanceAsync(delegators[1]),
                    stakingWrapper.getEthBalanceAsync(delegators[2]),
                ]);
                const rewardByDelegator = [
                    ethBalancesByDelegatorFinal[0].minus(ethBalancesByDelegatorInit[0]),
                    ethBalancesByDelegatorFinal[1].minus(ethBalancesByDelegatorInit[1]),
                    ethBalancesByDelegatorFinal[2].minus(ethBalancesByDelegatorInit[2]),
                ];

                // In this case, there was already a pot of ETH in the delegator pool that nobody had claimed.
                // The first delegator got to claim it all. This is due to the necessary conservation of payouts.
                // When a new delegator arrives, their new stake should not affect existing delegator payouts.
                // In this case, there was unclaimed $$ in the delegator pool - which is claimed by the first delegator.
                const expectedRewardByDelegator = [
                    new BigNumber(0),
                    new BigNumber(0),
                    new BigNumber(0),
                ];
                expect(rewardByDelegator[0]).to.be.bignumber.equal(expectedRewardByDelegator[0]);
                expect(rewardByDelegator[1]).to.be.bignumber.equal(expectedRewardByDelegator[1]);
                expect(rewardByDelegator[2]).to.be.bignumber.equal(expectedRewardByDelegator[2]);
            }
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
