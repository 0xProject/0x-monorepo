import { constants, LogDecoder, txDefaults } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import { assetDataUtils } from '@0x/order-utils';
import { LogWithDecodedArgs, Provider, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { ERC20ProxyContract } from '@0x/contracts-asset-proxy';
import * as _ from 'lodash';

import { artifacts, StakingEEventArgs, StakingContract, StakingProxyContract, ZrxVaultContract, RewardVaultContract, LibMathTestContract } from '../../src';

const expect = chai.expect;

export class StakingWrapper {
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _provider: Provider;
    private readonly _logDecoder: LogDecoder;
    private readonly _ownerAddres: string;
    private readonly _erc20ProxyContract: ERC20ProxyContract;
    private readonly _zrxTokenContract: DummyERC20TokenContract;
    private _stakingContractIfExists?: StakingContract;
    private _stakingProxyContractIfExists?: StakingProxyContract;
    private _zrxVaultContractIfExists?: ZrxVaultContract;
    private _rewardVaultContractIfExists?: RewardVaultContract;
    private _libMathTestContractIfExists?: LibMathTestContract;

    constructor(provider: Provider, ownerAddres: string, erc20ProxyContract: ERC20ProxyContract, zrxTokenContract: DummyERC20TokenContract) {
        this._web3Wrapper = new Web3Wrapper(provider);
        this._provider = provider;
        this._logDecoder = new LogDecoder(this._web3Wrapper, artifacts);
        this._ownerAddres= ownerAddres;
        this._erc20ProxyContract = erc20ProxyContract;
        this._zrxTokenContract = zrxTokenContract;
    }
    public getStakingContract(): StakingContract {
        this._validateDeployedOrThrow();
        return this._stakingContractIfExists as StakingContract;
    }
    public getStakingProxyContract(): StakingProxyContract {
        this._validateDeployedOrThrow();
        return this._stakingProxyContractIfExists as StakingProxyContract;
    }
    public getZrxVaultContract(): ZrxVaultContract {
        this._validateDeployedOrThrow();
        return this._zrxVaultContractIfExists as ZrxVaultContract;
    }
    public getRewardVaultContract(): RewardVaultContract {
        this._validateDeployedOrThrow();
        return this._rewardVaultContractIfExists as RewardVaultContract;
    }
    public getLibMathTestContract(): LibMathTestContract {
        this._validateDeployedOrThrow();
        return this._libMathTestContractIfExists as LibMathTestContract;
    }
    public async deployAndConfigureContracts(): Promise<void> {
        // deploy zrx vault
        const zrxAssetData = assetDataUtils.encodeERC20AssetData(this._zrxTokenContract.address);
        this._zrxVaultContractIfExists = await ZrxVaultContract.deployFrom0xArtifactAsync(
            artifacts.ZrxVault,
            this._provider,
            txDefaults,
            this._erc20ProxyContract.address,
            this._zrxTokenContract.address,
            zrxAssetData
        );
        // deploy reward vault
        this._rewardVaultContractIfExists = await RewardVaultContract.deployFrom0xArtifactAsync(
            artifacts.RewardVault,
            this._provider,
            txDefaults,
        );
        // configure erc20 proxy to accept calls from zrx vault
        await this._erc20ProxyContract.addAuthorizedAddress.awaitTransactionSuccessAsync((this._zrxVaultContractIfExists as ZrxVaultContract).address);
        // deploy staking contract
        this._stakingContractIfExists = await StakingContract.deployFrom0xArtifactAsync(
            artifacts.Staking,
            this._provider,
            txDefaults
        );
        // deploy staking proxy
        this._stakingProxyContractIfExists = await StakingProxyContract.deployFrom0xArtifactAsync(
            artifacts.StakingProxy,
            this._provider,
            txDefaults,
            (this._stakingContractIfExists as StakingContract).address
        );
        // set staking proxy contract in zrx vault
        await (this._zrxVaultContractIfExists as ZrxVaultContract).setStakingContractAddrsess.awaitTransactionSuccessAsync((this._stakingProxyContractIfExists as StakingProxyContract).address);
        // set zrx vault in staking contract
        const setZrxVaultCalldata = await (this._stakingContractIfExists as StakingContract).setZrxVault.getABIEncodedTransactionData((this._zrxVaultContractIfExists as ZrxVaultContract).address);
        const setZrxVaultTxData = {
            from: this._ownerAddres,
            to: (this._stakingProxyContractIfExists as StakingProxyContract).address,
            data: setZrxVaultCalldata
        }
        await this._web3Wrapper.awaitTransactionSuccessAsync(
             await this._web3Wrapper.sendTransactionAsync(setZrxVaultTxData)
        );
        // set staking proxy contract in reward vault
        await (this._rewardVaultContractIfExists as RewardVaultContract).setStakingContractAddrsess.awaitTransactionSuccessAsync((this._stakingProxyContractIfExists as StakingProxyContract).address);
        // set reward vault in staking contract
        const setRewardVaultCalldata = await (this._stakingContractIfExists as StakingContract).setRewardVault.getABIEncodedTransactionData((this._rewardVaultContractIfExists as RewardVaultContract).address);
        const setRewardVaultTxData = {
            from: this._ownerAddres,
            to: (this._stakingProxyContractIfExists as StakingProxyContract).address,
            data: setRewardVaultCalldata
        }
        await this._web3Wrapper.awaitTransactionSuccessAsync(
             await this._web3Wrapper.sendTransactionAsync(setRewardVaultTxData)
        );
        // deploy libmath test
        this._libMathTestContractIfExists = await LibMathTestContract.deployFrom0xArtifactAsync(
            artifacts.LibMathTest,
            this._provider,
            txDefaults,
        );
    }
    private async _executeTransactionAsync(calldata: string, from?: string, value?: BigNumber, includeLogs?: boolean): Promise<TransactionReceiptWithDecodedLogs> {
        const txData = {
            from: (from ? from : this._ownerAddres),
            to: this.getStakingProxyContract().address,
            data: calldata,
            gas: 3000000,
            gasPrice: 0,
            value
        }
        const txHash = await this._web3Wrapper.sendTransactionAsync(txData);
        const txReceipt = await (includeLogs ? this._logDecoder.getTxWithDecodedLogsAsync(txHash) : this._web3Wrapper.awaitTransactionSuccessAsync(txHash));
        return txReceipt;
    }
    private async _callAsync(calldata: string, from?: string): Promise<any> {
        const txData = {
            from: (from ? from : this._ownerAddres),
            to: this.getStakingProxyContract().address,
            data: calldata,
            gas: 3000000
        }
        const returnValue = await this._web3Wrapper.callAsync(txData);
        return returnValue;
    }
    public async getEthBalanceAsync(owner: string): Promise<BigNumber> {
        const balance = this._web3Wrapper.getBalanceInWeiAsync(owner);
        return balance;
    }
    ///// STAKE /////
    public async depositAsync(owner: string, amount: BigNumber): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().deposit.getABIEncodedTransactionData(amount);
        const txReceipt = await this._executeTransactionAsync(calldata, owner);
        return txReceipt;
    }
    public async depositAndStakeAsync(owner: string, amount: BigNumber): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().depositAndStake.getABIEncodedTransactionData(amount);
        const txReceipt = await this._executeTransactionAsync(calldata, owner);
        return txReceipt;
    }
    public async depositAndDelegateAsync(owner: string, poolId: string, amount: BigNumber): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().depositAndDelegate.getABIEncodedTransactionData(poolId, amount);
        const txReceipt = await this._executeTransactionAsync(calldata, owner);//, new BigNumber(0), true);
        //console.log(JSON.stringify(txReceipt, null, 4));
        return txReceipt;
    }
    public async activateStakeAsync(owner: string, amount: BigNumber): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().activateStake.getABIEncodedTransactionData(amount);
        const txReceipt = await this._executeTransactionAsync(calldata, owner);
        return txReceipt;
    }
    public async activateAndDelegateStakeAsync(owner: string, poolId: string, amount: BigNumber): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().activateAndDelegateStake.getABIEncodedTransactionData(poolId, amount);
        const txReceipt = await this._executeTransactionAsync(calldata, owner);
        return txReceipt;
    }
    public async deactivateAndTimelockStakeAsync(owner: string, amount: BigNumber): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().deactivateAndTimelockStake.getABIEncodedTransactionData(amount);
        const txReceipt = await this._executeTransactionAsync(calldata, owner);
        return txReceipt;
    }
    public async deactivateAndTimelockDelegatedStakeAsync(owner: string, poolId: string, amount: BigNumber): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().deactivateAndTimelockDelegatedStake.getABIEncodedTransactionData(poolId, amount);
        const txReceipt = await this._executeTransactionAsync(calldata, owner, new BigNumber(0), true);
        console.log(JSON.stringify(txReceipt, null, 4));
        return txReceipt;
    }
    public async withdrawAsync(owner: string, amount: BigNumber): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().withdraw.getABIEncodedTransactionData(amount);
        const txReceipt = await this._executeTransactionAsync(calldata, owner);
        return txReceipt;
    }
    public async forceTimelockSyncAsync(owner: string): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().forceTimelockSync.getABIEncodedTransactionData(owner);
        const txReceipt = await this._executeTransactionAsync(calldata, this._ownerAddres);
        return txReceipt;
    }
    ///// STAKE BALANCES /////
    public async getTotalStakeAsync(owner: string): Promise<string> {
        const calldata = this.getStakingContract().getTotalStake.getABIEncodedTransactionData(owner);
        const totalStake = await this._callAsync(calldata);
        return totalStake;
    }
    public async getActivatedStakeAsync(owner: string): Promise<string> {
        const calldata = this.getStakingContract().getActivatedStake.getABIEncodedTransactionData(owner);
        const activatedStake = await this._callAsync(calldata);
        return activatedStake;
    }
    public async getDeactivatedStakeAsync(owner: string): Promise<string> {
        const calldata = this.getStakingContract().getDeactivatedStake.getABIEncodedTransactionData(owner);
        const deactivatedStake = await this._callAsync(calldata);
        return deactivatedStake;
    }
    public async getActivatableStakeAsync(owner: string): Promise<string> {
        const calldata = this.getStakingContract().getActivatableStake.getABIEncodedTransactionData(owner);
        const activatableStake = await this._callAsync(calldata);
        return activatableStake;
    }
    public async getWithdrawableStakeAsync(owner: string): Promise<string> {
        const calldata = this.getStakingContract().getWithdrawableStake.getABIEncodedTransactionData(owner);
        const withdrawableStake = await this._callAsync(calldata);
        return withdrawableStake;
    }
    public async getTimelockedStakeAsync(owner: string): Promise<string> {
        const calldata = this.getStakingContract().getTimelockedStake.getABIEncodedTransactionData(owner);
        const timelockedStake = await this._callAsync(calldata);
        return timelockedStake;
    }
    public async getStakeDelegatedByOwnerAsync(owner: string): Promise<string> {
        const calldata = this.getStakingContract().getStakeDelegatedByOwner.getABIEncodedTransactionData(owner);
        const stakeDelegatedByOwner = await this._callAsync(calldata);
        return stakeDelegatedByOwner;
    }
    public async getStakeDelegatedToPoolByOwnerAsync(poolId: string, owner: string): Promise<string> {
        const calldata = this.getStakingContract().getStakeDelegatedToPoolByOwner.getABIEncodedTransactionData(owner, poolId);
        const stakeDelegatedToPoolByOwner = await this._callAsync(calldata);
        return stakeDelegatedToPoolByOwner;
    }
    public async getStakeDelegatedToPoolAsync(poolId: string): Promise<string> {
        const calldata = this.getStakingContract().getStakeDelegatedToPool.getABIEncodedTransactionData(poolId);
        const stakeDelegatedToPool = await this._callAsync(calldata);
        return stakeDelegatedToPool;
    }
    ///// POOLS /////
    public async getNextPoolIdAsync(): Promise<string> {
        const calldata = this.getStakingContract().getNextPoolId.getABIEncodedTransactionData();
        const nextPoolId = await this._callAsync(calldata);
        return nextPoolId;
    }
    public async createPoolAsync(operatorAddress: string, operatorShare: number): Promise<string> {
        const calldata = this.getStakingContract().createPool.getABIEncodedTransactionData(operatorShare);
        const txReceipt = await this._executeTransactionAsync(calldata, operatorAddress);
        const createPoolLog = this._logDecoder.decodeLogOrThrow(txReceipt.logs[0]);
        const poolId = (createPoolLog as any).args.poolId;
        return poolId;
    }
    public async addMakerToPoolAsync(poolId: string, makerAddress: string, makerSignature: string, operatorAddress: string): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().addMakerToPool.getABIEncodedTransactionData(poolId, makerAddress, makerSignature);
        const txReceipt = await this._executeTransactionAsync(calldata, operatorAddress);
        return txReceipt;
    }
    public async removeMakerFromPoolAsync(poolId: string, makerAddress: string, operatorAddress: string): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().removeMakerFromPool.getABIEncodedTransactionData(poolId, makerAddress);
        const txReceipt = await this._executeTransactionAsync(calldata, operatorAddress);
        return txReceipt;
    }
    public async getMakerPoolId(makerAddress: string): Promise<string> {
        const calldata = this.getStakingContract().getMakerPoolId.getABIEncodedTransactionData(makerAddress);
        const poolId = await this._callAsync(calldata);
        return poolId;
    }
    public async getMakerAddressesForPool(poolId: string): Promise<string[]> {
        const calldata = this.getStakingContract().getMakerAddressesForPool.getABIEncodedTransactionData(poolId);
        const returndata = await this._callAsync(calldata);
        const makerAddresses = this.getStakingContract().getMakerAddressesForPool.getABIDecodedReturnData(returndata);
        return makerAddresses;
    }
    ///// EPOCHS /////
    public async goToNextEpochAsync(): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().goToNextEpoch.getABIEncodedTransactionData();
        const txReceipt = await this._executeTransactionAsync(calldata, undefined, new BigNumber(0), true);
        console.log(JSON.stringify(txReceipt, null , 4));
        //console.log((txReceipt.logs[0] as LogWithDecodedArgs<StakingEEventArgs>).args);
        //console.log((txReceipt.logs[1] as LogWithDecodedArgs<StakingEEventArgs>).args);
        //console.log((txReceipt.logs[2] as LogWithDecodedArgs<StakingEEventArgs>).args);
       
       console.log(`finalization: gasUsed = ${txReceipt.gasUsed} / cumulativeGasUsed = ${txReceipt.cumulativeGasUsed}`);
        return txReceipt;
    }
    public async skipToNextEpochAsync(): Promise<TransactionReceiptWithDecodedLogs> {
        // increase timestamp of next block
        const epochPeriodInSeconds = await this.getEpochPeriodInSecondsAsync();
        await this._web3Wrapper.increaseTimeAsync(epochPeriodInSeconds.toNumber());
        // mine next block
        await this._web3Wrapper.mineBlockAsync();
        // increment epoch in contracts
        const txReceipt = await this.goToNextEpochAsync();
        // mine next block
        await this._web3Wrapper.mineBlockAsync();
        return txReceipt;
    }
    public async skipToNextTimelockPeriodAsync(): Promise<void> {
        const timelockEndEpoch = await this.getCurrentTimelockPeriodEndEpochAsync();
        const currentEpoch = await this.getCurrentEpochAsync();
        const nEpochsToJump = timelockEndEpoch.minus(currentEpoch);
        const nEpochsToJumpAsNumber = nEpochsToJump.toNumber();
        for (let i = 0; i < nEpochsToJumpAsNumber; ++i) {
            await this.skipToNextEpochAsync();
        }
    }
    public async getEpochPeriodInSecondsAsync(): Promise<BigNumber> {
        const calldata = this.getStakingContract().getEpochPeriodInSeconds.getABIEncodedTransactionData();
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getEpochPeriodInSeconds.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getTimelockPeriodInEpochsAsync(): Promise<BigNumber> {
        const calldata = this.getStakingContract().getTimelockPeriodInEpochs.getABIEncodedTransactionData();
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getTimelockPeriodInEpochs.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getCurrentEpochStartTimeInSecondsAsync(): Promise<BigNumber> {
        const calldata = this.getStakingContract().getCurrentEpochStartTimeInSeconds.getABIEncodedTransactionData();
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getCurrentEpochStartTimeInSeconds.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getCurrentTimelockPeriodStartEpochAsync(): Promise<BigNumber> {
        const calldata = this.getStakingContract().getCurrentTimelockPeriodStartEpoch.getABIEncodedTransactionData();
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getCurrentTimelockPeriodStartEpoch.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getCurrentEpochEndTimeInSecondsAsync(): Promise<BigNumber> {
        const calldata = this.getStakingContract().getCurrentEpochEndTimeInSeconds.getABIEncodedTransactionData();
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getCurrentEpochEndTimeInSeconds.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getCurrentTimelockPeriodEndEpochAsync(): Promise<BigNumber> {
        const calldata = this.getStakingContract().getCurrentTimelockPeriodEndEpoch.getABIEncodedTransactionData();
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getCurrentTimelockPeriodEndEpoch.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getCurrentEpochAsync(): Promise<BigNumber> {
        const calldata = this.getStakingContract().getCurrentEpoch.getABIEncodedTransactionData();
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getCurrentEpoch.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getCurrentTimelockPeriodAsync(): Promise<BigNumber> {
        const calldata = this.getStakingContract().getCurrentTimelockPeriod.getABIEncodedTransactionData();
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getCurrentTimelockPeriod.getABIDecodedReturnData(returnData);
        return value;
    }
    ///// PROTOCOL FEES /////
    public async payProtocolFeeAsync(makerAddress: string, amount: BigNumber, exchangeAddress: string): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().payProtocolFee.getABIEncodedTransactionData(makerAddress);
        const txReceipt = await this._executeTransactionAsync(calldata, exchangeAddress, amount);
        return txReceipt;
    }
    public async getProtocolFeesThisEpochByPoolAsync(poolId: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getProtocolFeesThisEpochByPool.getABIEncodedTransactionData(poolId);
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getProtocolFeesThisEpochByPool.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getTotalProtocolFeesThisEpochAsync(): Promise<BigNumber> {
        const calldata = this.getStakingContract().getTotalProtocolFeesThisEpoch.getABIEncodedTransactionData();
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getTotalProtocolFeesThisEpoch.getABIDecodedReturnData(returnData);
        return value;
    }
    ///// EXCHANGES /////
    public async isValidExchangeAddressAsync(exchangeAddress: string): Promise<Boolean> {
        const calldata = this.getStakingContract().isValidExchangeAddress.getABIEncodedTransactionData(exchangeAddress);
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().isValidExchangeAddress.getABIDecodedReturnData(returnData);
        return value;
    }
    public async addExchangeAddressAsync(exchangeAddress: string): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().addExchangeAddress.getABIEncodedTransactionData(exchangeAddress);
        const txReceipt = await this._executeTransactionAsync(calldata, this._ownerAddres);
        return txReceipt;
    }
    public async removeExchangeAddressAsync(exchangeAddress: string): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().removeExchangeAddress.getABIEncodedTransactionData(exchangeAddress);
        const txReceipt = await this._executeTransactionAsync(calldata, this._ownerAddres);
        return txReceipt;
    }

    /*
    ///// REWARDS /////
    public async computeOperatorRewardAsync(): Promise<BigNumber> {
        const calldata = this.getStakingContract().computeOperatorReward.getABIEncodedTransactionData();
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().computeOperatorReward.getABIDecodedReturnData(returnData);
        return value;
    }
    public async computeDelegatorRewardAsync(): Promise<BigNumber> {
        const calldata = this.getStakingContract().computeDelegatorReward.getABIEncodedTransactionData();
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().computeDelegatorReward.getABIDecodedReturnData(returnData);
        return value;
    }

    ///// SHADOW BALANCES /////
    public async getShadowBalanceByPoolIdAsync(): Promise<BigNumber> {
        const calldata = this.getStakingContract().getShadowBalanceByPoolId.getABIEncodedTransactionData();
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getShadowBalanceByPoolId.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getShadowBalanceInPoolByOwnerAsync(): Promise<BigNumber> {
        const calldata = this.getStakingContract().getShadowBalanceInPoolByOwner.getABIEncodedTransactionData();
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getShadowBalanceInPoolByOwner.getABIDecodedReturnData(returnData);
        return value;
    }
    */

    ///// BUY-INS & PAYOUTS /////



    ///// REWARD VAULT /////
    public async rewardVaultDepositForAsync(poolId: string, amount: BigNumber, stakingContractAddress: string): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getRewardVaultContract().depositFor.getABIEncodedTransactionData(poolId);
        const txReceipt = await this._executeTransactionAsync(calldata, stakingContractAddress, amount);
        return txReceipt;
    }
    /*
    public async rewardVaultWithdrawFor(poolId: string, amount: BigNumber, stakingContractAddress: string): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getRewardVaultContract().withdrawFor.getABIEncodedTransactionData(poolId, amount);
        const txReceipt = await this._executeTransactionAsync(calldata, stakingContractAddress);
        return txReceipt;
    }
    */
    /*
    public async rewardVaultWithdrawAllForAsync(poolId: string): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getRewardVaultContract().withdrawAllFrom.getABIEncodedTransactionData(poolId);
        const txReceipt = await this._executeTransactionAsync(calldata);
        return txReceipt;
    }
    */
    public async rewardVaultEnterCatastrophicFailureModeAsync(zeroExMultisigAddress: string): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getRewardVaultContract().enterCatostrophicFailure.getABIEncodedTransactionData();
        const txReceipt = await this._executeTransactionAsync(calldata, zeroExMultisigAddress);
        return txReceipt;
    }
    public async rewardVaultGetBalanceAsync(poolId: string): Promise<BigNumber> {
        const balance = await this.getRewardVaultContract().balanceOf.callAsync(poolId);
        return balance;
    }
    public async rewardVaultOperatorBalanceOfAsync(poolId: string): Promise<BigNumber> {
        const balance = await this.getRewardVaultContract().operatorBalanceOf.callAsync(poolId);
        return balance;
    }
    public async rewardVaultPoolBalanceOfAsync(poolId: string): Promise<BigNumber> {
        const balance = await this.getRewardVaultContract().poolBalanceOf.callAsync(poolId);
        return balance;
    }
    public async rewardVaultCreatePoolAsync(poolId: string, poolOperator: string, poolOperatorShare: number, stakingContractAddress: string): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getRewardVaultContract().createPool.getABIEncodedTransactionData(poolId, poolOperator, poolOperatorShare);
        const txReceipt = await this._executeTransactionAsync(calldata, stakingContractAddress);
        return txReceipt;
    }
    /*
    public async getEthBalanceOfRewardVaultAsync(): Promise<BigNumber> {
        const balance = await this.getRewardVaultContract().balanceOf.callAsync(this.getZrxVaultContract().address);
        return balance;
    }
    */
    ///// ZRX VAULT /////
    public async getZrxVaultBalance(holder: string): Promise<BigNumber> {
        const balance = await this.getZrxVaultContract().balanceOf.callAsync(holder);
        return balance;
    }
    public async getZrxTokenBalance(holder: string): Promise<BigNumber> {
        const balance = await this._zrxTokenContract.balanceOf.callAsync(holder);
        return balance;
    }
    public async getZrxTokenBalanceOfZrxVault(): Promise<BigNumber> {
        const balance = await this._zrxTokenContract.balanceOf.callAsync(this.getZrxVaultContract().address);
        return balance;
    }
    ///// MATH /////
    public async nthRoot(value: BigNumber, n: BigNumber): Promise<BigNumber> {
        //const txReceipt = await this.getLibMathTestContract().nthRoot.await(value, n);
        const output = await this.getLibMathTestContract().nthRoot.callAsync(value, n);
        return output;
    }
    public async nthRootFixedPoint(value: BigNumber, n: BigNumber): Promise<BigNumber> {
        const output = await this.getLibMathTestContract().nthRootFixedPoint.callAsync(value, n);
        return output;
    }
    public async cobbDouglasAsync(
        totalRewards: BigNumber,
        ownerFees: BigNumber,
        totalFees: BigNumber,
        ownerStake: BigNumber,
        totalStake: BigNumber,
        alphaNumerator: BigNumber,
        alphaDenominator: BigNumber
    ) {
        const output = await this.getLibMathTestContract().cobbDouglas.callAsync(
            totalRewards,
            ownerFees,
            totalFees,
            ownerStake,
            totalStake,
            alphaNumerator,
            alphaDenominator
        );
        return output;
    }
    public async cobbDouglasSimplifiedAsync(
        totalRewards: BigNumber,
        ownerFees: BigNumber,
        totalFees: BigNumber,
        ownerStake: BigNumber,
        totalStake: BigNumber,
        alphaDenominator: BigNumber
    ) {
        const txReceipt = await this.getLibMathTestContract().cobbDouglasSimplifiedInverse.awaitTransactionSuccessAsync(
            totalRewards,
            ownerFees,
            totalFees,
            ownerStake,
            totalStake,
            alphaDenominator
        );
        console.log(`Gas Used: ${txReceipt.gasUsed}`);
        const output = await this.getLibMathTestContract().cobbDouglasSimplified.callAsync(
            totalRewards,
            ownerFees,
            totalFees,
            ownerStake,
            totalStake,
            alphaDenominator
        );
        return output;
    }
    public async cobbDouglasSimplifiedInverseAsync(
        totalRewards: BigNumber,
        ownerFees: BigNumber,
        totalFees: BigNumber,
        ownerStake: BigNumber,
        totalStake: BigNumber,
        alphaDenominator: BigNumber
    ) {
        const txReceipt = await this.getLibMathTestContract().cobbDouglasSimplifiedInverse.awaitTransactionSuccessAsync(
            totalRewards,
            ownerFees,
            totalFees,
            ownerStake,
            totalStake,
            alphaDenominator
        );

        const output = await this.getLibMathTestContract().cobbDouglasSimplifiedInverse.callAsync(
            totalRewards,
            ownerFees,
            totalFees,
            ownerStake,
            totalStake,
            alphaDenominator
        );
        return output;
    }
    public toBaseUnitAmount(amount: BigNumber | number): BigNumber {
        const decimals = 18;
        const amountAsBigNumber = typeof(amount)  === 'number' ? new BigNumber(amount) : amount;
        const baseUnitAmount = Web3Wrapper.toBaseUnitAmount(amountAsBigNumber, decimals);
        return baseUnitAmount;
    }
    public toFixedPoint(amount: BigNumber | number, decimals: number): BigNumber {
        const amountAsBigNumber = typeof(amount)  === 'number' ? new BigNumber(amount) : amount;
        const scalar = Math.pow(10, decimals);
        const amountAsFixedPoint = amountAsBigNumber.times(scalar);
        return amountAsFixedPoint;
    }
    public toFloatingPoint(amount: BigNumber | number, decimals: number): BigNumber {
        const amountAsBigNumber = typeof(amount)  === 'number' ? new BigNumber(amount) : amount;
        const scalar = Math.pow(10, decimals);
        const amountAsFloatingPoint = amountAsBigNumber.dividedBy(scalar);
        return amountAsFloatingPoint;
    }
    public trimFloat(amount: BigNumber | number, decimals: number): BigNumber {
        const amountAsBigNumber = typeof(amount)  === 'number' ? new BigNumber(amount) : amount;
        const scalar = Math.pow(10, decimals);
        const amountAsFloatingPoint = ((amountAsBigNumber.multipliedBy(scalar)).dividedToIntegerBy(1)).dividedBy(scalar);
        return amountAsFloatingPoint;
    }
    private _validateDeployedOrThrow() {
        if (this._stakingContractIfExists === undefined) {
            throw new Error('Staking contracts are not deployed. Call `deployStakingContracts`');
        }
    }
}
