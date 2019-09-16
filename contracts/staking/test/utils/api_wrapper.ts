import { ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { artifacts as erc20Artifacts, DummyERC20TokenContract } from '@0x/contracts-erc20';
import { BlockchainTestsEnvironment, constants } from '@0x/contracts-test-utils';
import { BigNumber, logUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { ContractArtifact, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import {
    artifacts,
    EthVaultContract,
    ReadOnlyProxyContract,
    StakingContract,
    StakingPoolRewardVaultContract,
    StakingProxyContract,
    ZrxVaultContract,
} from '../../src';

import { constants as stakingConstants } from './constants';
import { StakingParams } from './types';

export class StakingApiWrapper {
    public stakingContractAddress: string; // The address of the real Staking.sol contract
    public stakingContract: StakingContract; // The StakingProxy.sol contract wrapped as a StakingContract to borrow API
    public stakingProxyContract: StakingProxyContract; // The StakingProxy.sol contract as a StakingProxyContract
    public zrxVaultContract: ZrxVaultContract;
    public ethVaultContract: EthVaultContract;
    public rewardVaultContract: StakingPoolRewardVaultContract;
    public zrxTokenContract: DummyERC20TokenContract;
    public utils = {
        // Epoch Utils
        fastForwardToNextEpochAsync: async (): Promise<void> => {
            // increase timestamp of next block
            const { epochDurationInSeconds } = await this.utils.getParamsAsync();
            await this._web3Wrapper.increaseTimeAsync(epochDurationInSeconds.toNumber());
            // mine next block
            await this._web3Wrapper.mineBlockAsync();
        },

        skipToNextEpochAsync: async (): Promise<TransactionReceiptWithDecodedLogs> => {
            await this.utils.fastForwardToNextEpochAsync();
            // increment epoch in contracts
            const txReceipt = await this.stakingContract.finalizeFees.awaitTransactionSuccessAsync();
            logUtils.log(`Finalization costed ${txReceipt.gasUsed} gas`);
            // mine next block
            await this._web3Wrapper.mineBlockAsync();
            return txReceipt;
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
                _params.epochDurationInSeconds,
                _params.rewardDelegatedStakeWeight,
                _params.minimumPoolStake,
                _params.maximumMakersInPool,
                _params.cobbDouglasAlphaNumerator,
                _params.cobbDouglasAlphaDenominator,
                _params.wethProxyAddress,
                _params.ethVaultAddress,
                _params.rewardVaultAddress,
                _params.zrxVaultAddress,
            );
        },

        getParamsAsync: async (): Promise<StakingParams> => {
            return (_.zipObject(
                [
                    'epochDurationInSeconds',
                    'rewardDelegatedStakeWeight',
                    'minimumPoolStake',
                    'maximumMakersInPool',
                    'cobbDouglasAlphaNumerator',
                    'cobbDouglasAlphaDenominator',
                    'wethProxyAddress',
                    'ethVaultAddress',
                    'rewardVaultAddress',
                    'zrxVaultAddress',
                ],
                await this.stakingContract.getParams.callAsync(),
            ) as any) as StakingParams;
        },
    };

    private readonly _web3Wrapper: Web3Wrapper;

    constructor(
        env: BlockchainTestsEnvironment,
        ownerAddress: string,
        stakingProxyContract: StakingProxyContract,
        stakingContract: StakingContract,
        zrxVaultContract: ZrxVaultContract,
        ethVaultContract: EthVaultContract,
        rewardVaultContract: StakingPoolRewardVaultContract,
        zrxTokenContract: DummyERC20TokenContract,
    ) {
        this._web3Wrapper = env.web3Wrapper;
        this.zrxVaultContract = zrxVaultContract;
        this.ethVaultContract = ethVaultContract;
        this.rewardVaultContract = rewardVaultContract;
        this.zrxTokenContract = zrxTokenContract;

        this.stakingContractAddress = stakingContract.address;
        this.stakingProxyContract = stakingProxyContract;
        // disguise the staking proxy as a StakingContract
        const logDecoderDependencies = _.mapValues({ ...artifacts, ...erc20Artifacts }, v => v.compilerOutput.abi);
        this.stakingContract = new StakingContract(
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

    // deploy staking contract
    const stakingContract = await StakingContract.deployFrom0xArtifactAsync(
        customStakingArtifact !== undefined ? customStakingArtifact : artifacts.Staking,
        env.provider,
        env.txDefaults,
        artifacts,
    );
    // deploy read-only proxy
    const readOnlyProxyContract = await ReadOnlyProxyContract.deployFrom0xArtifactAsync(
        artifacts.ReadOnlyProxy,
        env.provider,
        env.txDefaults,
        artifacts,
    );
    // deploy eth vault
    const ethVaultContract = await EthVaultContract.deployFrom0xArtifactAsync(
        artifacts.EthVault,
        env.provider,
        env.txDefaults,
        artifacts,
    );
    // deploy reward vault
    const rewardVaultContract = await StakingPoolRewardVaultContract.deployFrom0xArtifactAsync(
        artifacts.StakingPoolRewardVault,
        env.provider,
        env.txDefaults,
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
    // deploy staking proxy
    const stakingProxyContract = await StakingProxyContract.deployFrom0xArtifactAsync(
        artifacts.StakingProxy,
        env.provider,
        env.txDefaults,
        artifacts,
        stakingContract.address,
        readOnlyProxyContract.address,
        erc20ProxyContract.address,
        ethVaultContract.address,
        rewardVaultContract.address,
        zrxVaultContract.address,
    );

    // configure erc20 proxy to accept calls from zrx vault
    await erc20ProxyContract.addAuthorizedAddress.awaitTransactionSuccessAsync(zrxVaultContract.address);
    // set staking proxy contract in zrx vault
    await zrxVaultContract.setStakingProxy.awaitTransactionSuccessAsync(stakingProxyContract.address);
    // set staking proxy contract in reward vault
    await rewardVaultContract.setStakingProxy.awaitTransactionSuccessAsync(stakingProxyContract.address);
    return new StakingApiWrapper(
        env,
        ownerAddress,
        stakingProxyContract,
        stakingContract,
        zrxVaultContract,
        ethVaultContract,
        rewardVaultContract,
        zrxTokenContract,
    );
}
