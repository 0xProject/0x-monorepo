import { ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { artifacts as erc20Artifacts, DummyERC20TokenContract, WETH9Contract } from '@0x/contracts-erc20';
import { BlockchainTestsEnvironment, constants, filterLogsToArguments, txDefaults } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { BlockParamLiteral, ContractArtifact, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import {
    artifacts,
    IStakingEventsEpochEndedEventArgs,
    IStakingEventsStakingPoolActivatedEventArgs,
    ReadOnlyProxyContract,
    StakingProxyContract,
    TestCobbDouglasContract,
    TestStakingContract,
    TestStakingEvents,
    ZrxVaultContract,
} from '../../src';

import { constants as stakingConstants } from './constants';
import { DecodedLogs, EndOfEpochInfo, StakingParams } from './types';

export class StakingApiWrapper {
    // The address of the real Staking.sol contract
    public stakingContractAddress: string;
    // The StakingProxy.sol contract wrapped as a StakingContract to borrow API
    public stakingContract: TestStakingContract;
    // The StakingProxy.sol contract as a StakingProxyContract
    public stakingProxyContract: StakingProxyContract;
    public zrxVaultContract: ZrxVaultContract;
    public zrxTokenContract: DummyERC20TokenContract;
    public wethContract: WETH9Contract;
    public cobbDouglasContract: TestCobbDouglasContract;
    public utils = {
        // Epoch Utils
        fastForwardToNextEpochAsync: async (): Promise<void> => {
            // increase timestamp of next block by how many seconds we need to
            // get to the next epoch.
            const epochEndTime = await this.stakingContract.getCurrentEpochEarliestEndTimeInSeconds.callAsync();
            const lastBlockTime = await this._web3Wrapper.getBlockTimestampAsync('latest');
            const dt = Math.max(0, epochEndTime.minus(lastBlockTime).toNumber());
            await this._web3Wrapper.increaseTimeAsync(dt);
            // mine next block
            await this._web3Wrapper.mineBlockAsync();
        },

        skipToNextEpochAndFinalizeAsync: async (): Promise<DecodedLogs> => {
            await this.utils.fastForwardToNextEpochAsync();
            const endOfEpochInfo = await this.utils.endEpochAsync();
            const allLogs = [] as DecodedLogs;
            for (const poolId of endOfEpochInfo.activePoolIds) {
                const receipt = await this.stakingContract.finalizePool.awaitTransactionSuccessAsync(poolId);
                allLogs.splice(allLogs.length, 0, ...(receipt.logs as DecodedLogs));
            }
            return allLogs;
        },

        endEpochAsync: async (): Promise<EndOfEpochInfo> => {
            const activePoolIds = await this.utils.findActivePoolIdsAsync();
            const receipt = await this.stakingContract.endEpoch.awaitTransactionSuccessAsync();
            const [epochEndedEvent] = filterLogsToArguments<IStakingEventsEpochEndedEventArgs>(
                receipt.logs,
                TestStakingEvents.EpochEnded,
            );
            return {
                closingEpoch: epochEndedEvent.epoch,
                activePoolIds,
                rewardsAvailable: epochEndedEvent.rewardsAvailable,
                totalFeesCollected: epochEndedEvent.totalFeesCollected,
                totalWeightedStake: epochEndedEvent.totalWeightedStake,
            };
        },

        findActivePoolIdsAsync: async (epoch?: number): Promise<string[]> => {
            const _epoch = epoch !== undefined ? epoch : await this.stakingContract.currentEpoch.callAsync();
            const events = filterLogsToArguments<IStakingEventsStakingPoolActivatedEventArgs>(
                await this.stakingContract.getLogsAsync(
                    TestStakingEvents.StakingPoolActivated,
                    { fromBlock: BlockParamLiteral.Earliest, toBlock: BlockParamLiteral.Latest },
                    { epoch: new BigNumber(_epoch) },
                ),
                TestStakingEvents.StakingPoolActivated,
            );
            return events.map(e => e.poolId);
        },

        // Other Utils
        createStakingPoolAsync: async (
            operatorAddress: string,
            operatorShare: number,
            addOperatorAsMaker: boolean,
        ): Promise<string> => {
            const txReceipt = await this.stakingContract.createStakingPool.awaitTransactionSuccessAsync(
                operatorShare,
                addOperatorAsMaker,
                { from: operatorAddress },
            );
            const createStakingPoolLog = txReceipt.logs[0];
            const poolId = (createStakingPoolLog as any).args.poolId;
            return poolId;
        },

        getZrxTokenBalanceOfZrxVaultAsync: async (): Promise<BigNumber> => {
            return this.zrxTokenContract.balanceOf.callAsync(this.zrxVaultContract.address);
        },

        setParamsAsync: async (params: Partial<StakingParams>): Promise<TransactionReceiptWithDecodedLogs> => {
            const _params = {
                ...stakingConstants.DEFAULT_PARAMS,
                ...params,
            };
            return this.stakingContract.setParams.awaitTransactionSuccessAsync(
                new BigNumber(_params.epochDurationInSeconds),
                new BigNumber(_params.rewardDelegatedStakeWeight),
                new BigNumber(_params.minimumPoolStake),
                new BigNumber(_params.cobbDouglasAlphaNumerator),
                new BigNumber(_params.cobbDouglasAlphaDenominator),
            );
        },

        getAvailableRewardsBalanceAsync: async (): Promise<BigNumber> => {
            const [ethBalance, wethBalance, reservedRewards] = await Promise.all([
                this._web3Wrapper.getBalanceInWeiAsync(this.stakingProxyContract.address),
                this.wethContract.balanceOf.callAsync(this.stakingProxyContract.address),
                this.stakingContract.wethReservedForPoolRewards.callAsync(),
            ]);
            return BigNumber.sum(ethBalance, wethBalance).minus(reservedRewards);
        },

        getParamsAsync: async (): Promise<StakingParams> => {
            return (_.zipObject(
                [
                    'epochDurationInSeconds',
                    'rewardDelegatedStakeWeight',
                    'minimumPoolStake',
                    'cobbDouglasAlphaNumerator',
                    'cobbDouglasAlphaDenominator',
                    'wethProxyAddress',
                    'zrxVaultAddress',
                ],
                await this.stakingContract.getParams.callAsync(),
            ) as any) as StakingParams;
        },

        cobbDouglasAsync: async (
            totalRewards: BigNumber,
            ownerFees: BigNumber,
            totalFees: BigNumber,
            ownerStake: BigNumber,
            totalStake: BigNumber,
        ): Promise<BigNumber> => {
            const { cobbDouglasAlphaNumerator, cobbDouglasAlphaDenominator } = await this.utils.getParamsAsync();
            return this.cobbDouglasContract.cobbDouglas.callAsync(
                totalRewards,
                ownerFees,
                totalFees,
                ownerStake,
                totalStake,
                new BigNumber(cobbDouglasAlphaNumerator),
                new BigNumber(cobbDouglasAlphaDenominator),
            );
        },
    };

    private readonly _web3Wrapper: Web3Wrapper;

    constructor(
        env: BlockchainTestsEnvironment,
        ownerAddress: string,
        stakingProxyContract: StakingProxyContract,
        stakingContract: TestStakingContract,
        zrxVaultContract: ZrxVaultContract,
        zrxTokenContract: DummyERC20TokenContract,
        wethContract: WETH9Contract,
        cobbDouglasContract: TestCobbDouglasContract,
    ) {
        this._web3Wrapper = env.web3Wrapper;
        this.zrxVaultContract = zrxVaultContract;
        this.zrxTokenContract = zrxTokenContract;
        this.wethContract = wethContract;
        this.cobbDouglasContract = cobbDouglasContract;

        this.stakingContractAddress = stakingContract.address;
        this.stakingProxyContract = stakingProxyContract;
        // disguise the staking proxy as a StakingContract
        const logDecoderDependencies = _.mapValues({ ...artifacts, ...erc20Artifacts }, v => v.compilerOutput.abi);
        this.stakingContract = new TestStakingContract(
            stakingProxyContract.address,
            env.provider,
            {
                ...env.txDefaults,
                from: ownerAddress,
                to: stakingProxyContract.address,
                gas: 3e6,
                gasPrice: 0,
            },
            logDecoderDependencies,
        );
    }
}

/**
 * Deploys and configures all staking contracts and returns a StakingApiWrapper instance, which
 * holds the deployed contracts and serves as the entry point for their public functions.
 */
export async function deployAndConfigureContractsAsync(
    env: BlockchainTestsEnvironment,
    ownerAddress: string,
    erc20Wrapper: ERC20Wrapper,
    customStakingArtifact?: ContractArtifact,
): Promise<StakingApiWrapper> {
    // deploy erc20 proxy
    const erc20ProxyContract = await erc20Wrapper.deployProxyAsync();
    // deploy zrx token
    const [zrxTokenContract] = await erc20Wrapper.deployDummyTokensAsync(1, constants.DUMMY_TOKEN_DECIMALS);
    await erc20Wrapper.setBalancesAndAllowancesAsync();

    // deploy WETH
    const wethContract = await WETH9Contract.deployFrom0xArtifactAsync(
        erc20Artifacts.WETH9,
        env.provider,
        txDefaults,
        artifacts,
    );

    // deploy zrx vault
    const zrxVaultContract = await ZrxVaultContract.deployFrom0xArtifactAsync(
        artifacts.ZrxVault,
        env.provider,
        env.txDefaults,
        artifacts,
        erc20ProxyContract.address,
        zrxTokenContract.address,
    );

    await zrxVaultContract.addAuthorizedAddress.awaitTransactionSuccessAsync(ownerAddress);

    // deploy staking contract
    const stakingContract = await TestStakingContract.deployFrom0xArtifactAsync(
        customStakingArtifact !== undefined ? customStakingArtifact : artifacts.TestStaking,
        env.provider,
        env.txDefaults,
        artifacts,
        wethContract.address,
        zrxVaultContract.address,
    );

    // deploy read-only proxy
    const readOnlyProxyContract = await ReadOnlyProxyContract.deployFrom0xArtifactAsync(
        artifacts.ReadOnlyProxy,
        env.provider,
        env.txDefaults,
        artifacts,
    );

    // deploy staking proxy
    const stakingProxyContract = await StakingProxyContract.deployFrom0xArtifactAsync(
        artifacts.StakingProxy,
        env.provider,
        env.txDefaults,
        artifacts,
        stakingContract.address,
        readOnlyProxyContract.address,
    );

    await stakingProxyContract.addAuthorizedAddress.awaitTransactionSuccessAsync(ownerAddress);

    // deploy cobb douglas contract
    const cobbDouglasContract = await TestCobbDouglasContract.deployFrom0xArtifactAsync(
        artifacts.TestCobbDouglas,
        env.provider,
        txDefaults,
        artifacts,
    );

    // configure erc20 proxy to accept calls from zrx vault
    await erc20ProxyContract.addAuthorizedAddress.awaitTransactionSuccessAsync(zrxVaultContract.address);
    // set staking proxy contract in zrx vault
    await zrxVaultContract.setStakingProxy.awaitTransactionSuccessAsync(stakingProxyContract.address);
    return new StakingApiWrapper(
        env,
        ownerAddress,
        stakingProxyContract,
        stakingContract,
        zrxVaultContract,
        zrxTokenContract,
        wethContract,
        cobbDouglasContract,
    );
}
