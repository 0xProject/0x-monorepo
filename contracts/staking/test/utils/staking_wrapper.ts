import { ERC20ProxyContract } from '@0x/contracts-asset-proxy';
import { artifacts as erc20Artifacts, DummyERC20TokenContract } from '@0x/contracts-erc20';
import { constants as testUtilsConstants, LogDecoder, txDefaults } from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';
import { SignatureType } from '@0x/types';
import { BigNumber, logUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { Provider, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import {
    artifacts,
    LibFeeMathTestContract,
    StakingPoolRewardVaultContract,
    StakingContract,
    StakingProxyContract,
    ZrxVaultContract,
} from '../../src';

import { ApprovalFactory } from './approval_factory';
import { constants } from './constants';
import { SignedStakingPoolApproval } from './types';

export class StakingWrapper {
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _provider: Provider;
    private readonly _logDecoder: LogDecoder;
    private readonly _ownerAddress: string;
    private readonly _erc20ProxyContract: ERC20ProxyContract;
    private readonly _zrxTokenContract: DummyERC20TokenContract;
    private readonly _accounts: string[];
    private _stakingContractIfExists?: StakingContract;
    private _stakingProxyContractIfExists?: StakingProxyContract;
    private _zrxVaultContractIfExists?: ZrxVaultContract;
    private _rewardVaultContractIfExists?: StakingPoolRewardVaultContract;
    private _LibFeeMathTestContractIfExists?: LibFeeMathTestContract;
    public static toBaseUnitAmount(amount: BigNumber | number): BigNumber {
        const decimals = 18;
        const amountAsBigNumber = typeof amount === 'number' ? new BigNumber(amount) : amount;
        const baseUnitAmount = Web3Wrapper.toBaseUnitAmount(amountAsBigNumber, decimals);
        return baseUnitAmount;
    }
    public static toFixedPoint(amount: BigNumber | number, decimals: number): BigNumber {
        const amountAsBigNumber = typeof amount === 'number' ? new BigNumber(amount) : amount;
        const scalar = Math.pow(10, decimals);
        const amountAsFixedPoint = amountAsBigNumber.times(scalar);
        return amountAsFixedPoint;
    }
    public static toFloatingPoint(amount: BigNumber | number, decimals: number): BigNumber {
        const amountAsBigNumber = typeof amount === 'number' ? new BigNumber(amount) : amount;
        const scalar = Math.pow(10, decimals);
        const amountAsFloatingPoint = amountAsBigNumber.dividedBy(scalar);
        return amountAsFloatingPoint;
    }
    public static trimFloat(amount: BigNumber | number, decimals: number): BigNumber {
        const amountAsBigNumber = typeof amount === 'number' ? new BigNumber(amount) : amount;
        const scalar = Math.pow(10, decimals);
        const amountAsFloatingPoint = amountAsBigNumber
            .multipliedBy(scalar)
            .dividedToIntegerBy(1)
            .dividedBy(scalar);
        return amountAsFloatingPoint;
    }

    constructor(
        provider: Provider,
        ownerAddres: string,
        erc20ProxyContract: ERC20ProxyContract,
        zrxTokenContract: DummyERC20TokenContract,
        accounts: string[],
    ) {
        this._web3Wrapper = new Web3Wrapper(provider);
        this._provider = provider;
        const decoderArtifacts = _.merge(artifacts, erc20Artifacts);
        this._logDecoder = new LogDecoder(this._web3Wrapper, decoderArtifacts);
        this._ownerAddress = ownerAddres;
        this._erc20ProxyContract = erc20ProxyContract;
        this._zrxTokenContract = zrxTokenContract;
        this._accounts = accounts;
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
    public getStakingPoolRewardVaultContract(): StakingPoolRewardVaultContract {
        this._validateDeployedOrThrow();
        return this._rewardVaultContractIfExists as StakingPoolRewardVaultContract;
    }
    public getLibFeeMathTestContract(): LibFeeMathTestContract {
        this._validateDeployedOrThrow();
        return this._LibFeeMathTestContractIfExists as LibFeeMathTestContract;
    }
    public async deployAndConfigureContractsAsync(): Promise<void> {
        // deploy zrx vault
        const zrxAssetData = assetDataUtils.encodeERC20AssetData(this._zrxTokenContract.address);
        this._zrxVaultContractIfExists = await ZrxVaultContract.deployFrom0xArtifactAsync(
            artifacts.ZrxVault,
            this._provider,
            txDefaults,
            this._erc20ProxyContract.address,
            this._zrxTokenContract.address,
            zrxAssetData,
        );
        // deploy reward vault
        this._rewardVaultContractIfExists = await StakingPoolRewardVaultContract.deployFrom0xArtifactAsync(
            artifacts.StakingPoolRewardVault,
            this._provider,
            txDefaults,
        );
        // configure erc20 proxy to accept calls from zrx vault
        await this._erc20ProxyContract.addAuthorizedAddress.awaitTransactionSuccessAsync(
            (this._zrxVaultContractIfExists).address,
        );
        // deploy staking contract
        this._stakingContractIfExists = await StakingContract.deployFrom0xArtifactAsync(
            artifacts.Staking,
            this._provider,
            txDefaults,
        );
        // deploy staking proxy
        this._stakingProxyContractIfExists = await StakingProxyContract.deployFrom0xArtifactAsync(
            artifacts.StakingProxy,
            this._provider,
            txDefaults,
            (this._stakingContractIfExists).address,
        );
        // set staking proxy contract in zrx vault
        await (this
            ._zrxVaultContractIfExists).setStakingContractAddrsess.awaitTransactionSuccessAsync(
            (this._stakingProxyContractIfExists).address,
        );
        // set zrx vault in staking contract
        const setZrxVaultCalldata = (this
            ._stakingContractIfExists).setZrxVault.getABIEncodedTransactionData(
            (this._zrxVaultContractIfExists).address,
        );
        const setZrxVaultTxData = {
            from: this._ownerAddress,
            to: (this._stakingProxyContractIfExists).address,
            data: setZrxVaultCalldata,
        };
        await this._web3Wrapper.awaitTransactionSuccessAsync(
            await this._web3Wrapper.sendTransactionAsync(setZrxVaultTxData),
        );
        // set staking proxy contract in reward vault
        await (this
            ._rewardVaultContractIfExists).setStakingContractAddrsess.awaitTransactionSuccessAsync(
            (this._stakingProxyContractIfExists).address,
        );
        // set reward vault in staking contract
        const setStakingPoolRewardVaultCalldata = (this
            ._stakingContractIfExists).setStakingPoolRewardVault.getABIEncodedTransactionData(
            (this._rewardVaultContractIfExists).address,
        );
        const setStakingPoolRewardVaultTxData = {
            from: this._ownerAddress,
            to: (this._stakingProxyContractIfExists).address,
            data: setStakingPoolRewardVaultCalldata,
        };
        await this._web3Wrapper.awaitTransactionSuccessAsync(
            await this._web3Wrapper.sendTransactionAsync(setStakingPoolRewardVaultTxData),
        );
        // deploy libmath test
        this._LibFeeMathTestContractIfExists = await LibFeeMathTestContract.deployFrom0xArtifactAsync(
            artifacts.LibFeeMathTest,
            this._provider,
            txDefaults,
        );
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
    public async depositAndDelegateAsync(
        owner: string,
        poolId: string,
        amount: BigNumber,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().depositAndDelegate.getABIEncodedTransactionData(poolId, amount);
        const txReceipt = await this._executeTransactionAsync(calldata, owner, new BigNumber(0), true);
        return txReceipt;
    }
    public async activateStakeAsync(owner: string, amount: BigNumber): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().activateStake.getABIEncodedTransactionData(amount);
        const txReceipt = await this._executeTransactionAsync(calldata, owner);
        return txReceipt;
    }
    public async activateAndDelegateStakeAsync(
        owner: string,
        poolId: string,
        amount: BigNumber,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().activateAndDelegateStake.getABIEncodedTransactionData(
            poolId,
            amount,
        );
        const txReceipt = await this._executeTransactionAsync(calldata, owner);
        return txReceipt;
    }
    public async deactivateAndTimelockStakeAsync(
        owner: string,
        amount: BigNumber,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().deactivateAndTimelockStake.getABIEncodedTransactionData(amount);
        const txReceipt = await this._executeTransactionAsync(calldata, owner);
        return txReceipt;
    }
    public async deactivateAndTimelockDelegatedStakeAsync(
        owner: string,
        poolId: string,
        amount: BigNumber,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().deactivateAndTimelockDelegatedStake.getABIEncodedTransactionData(
            poolId,
            amount,
        );
        const txReceipt = await this._executeTransactionAsync(calldata, owner, new BigNumber(0), true);
        return txReceipt;
    }
    public async withdrawAsync(owner: string, amount: BigNumber): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().withdraw.getABIEncodedTransactionData(amount);
        const txReceipt = await this._executeTransactionAsync(calldata, owner);
        return txReceipt;
    }
    public async forceTimelockSyncAsync(owner: string): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().forceTimelockSync.getABIEncodedTransactionData(owner);
        const txReceipt = await this._executeTransactionAsync(calldata, this._ownerAddress);
        return txReceipt;
    }
    ///// STAKE BALANCES /////
    public async getTotalStakeAsync(owner: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getTotalStake.getABIEncodedTransactionData(owner);
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getTotalStake.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getActivatedStakeAsync(owner: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getActivatedStake.getABIEncodedTransactionData(owner);
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getActivatedStake.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getDeactivatedStakeAsync(owner: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getDeactivatedStake.getABIEncodedTransactionData(owner);
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getDeactivatedStake.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getActivatableStakeAsync(owner: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getActivatableStake.getABIEncodedTransactionData(owner);
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getActivatableStake.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getWithdrawableStakeAsync(owner: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getWithdrawableStake.getABIEncodedTransactionData(owner);
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getWithdrawableStake.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getTimelockedStakeAsync(owner: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getTimelockedStake.getABIEncodedTransactionData(owner);
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getTimelockedStake.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getTimelockStartAsync(owner: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getTimelockStart.getABIEncodedTransactionData(owner);
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getTimelockStart.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getStakeDelegatedByOwnerAsync(owner: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getStakeDelegatedByOwner.getABIEncodedTransactionData(owner);
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getStakeDelegatedByOwner.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getStakeDelegatedToPoolByOwnerAsync(poolId: string, owner: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getStakeDelegatedToPoolByOwner.getABIEncodedTransactionData(
            owner,
            poolId,
        );
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getStakeDelegatedToPoolByOwner.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getStakeDelegatedToPoolAsync(poolId: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getStakeDelegatedToPool.getABIEncodedTransactionData(poolId);
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getStakeDelegatedToPool.getABIDecodedReturnData(returnData);
        return value;
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
    public async addMakerToPoolAsync(
        poolId: string,
        makerAddress: string,
        makerSignature: string,
        operatorAddress: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().addMakerToPool.getABIEncodedTransactionData(
            poolId,
            makerAddress,
            makerSignature,
        );
        const txReceipt = await this._executeTransactionAsync(calldata, operatorAddress);
        return txReceipt;
    }
    public async removeMakerFromPoolAsync(
        poolId: string,
        makerAddress: string,
        operatorAddress: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().removeMakerFromPool.getABIEncodedTransactionData(
            poolId,
            makerAddress,
        );
        const txReceipt = await this._executeTransactionAsync(calldata, operatorAddress);
        return txReceipt;
    }
    public async getPoolIdOfMakerAsync(makerAddress: string): Promise<string> {
        const calldata = this.getStakingContract().getPoolIdOfMaker.getABIEncodedTransactionData(makerAddress);
        const poolId = await this._callAsync(calldata);
        return poolId;
    }
    public async getMakersForPoolAsync(poolId: string): Promise<string[]> {
        const calldata = this.getStakingContract().getMakersForPool.getABIEncodedTransactionData(poolId);
        const returndata = await this._callAsync(calldata);
        const makerAddresses = this.getStakingContract().getMakersForPool.getABIDecodedReturnData(returndata);
        return makerAddresses;
    }
    public async isValidMakerSignatureAsync(
        poolId: string,
        makerAddress: string,
        makerSignature: string,
    ): Promise<boolean> {
        const calldata = this.getStakingContract().isValidMakerSignature.getABIEncodedTransactionData(
            poolId,
            makerAddress,
            makerSignature,
        );
        const returndata = await this._callAsync(calldata);
        const isValid = this.getStakingContract().isValidMakerSignature.getABIDecodedReturnData(returndata);
        return isValid;
    }
    public async getStakingPoolApprovalMessageHashAsync(poolId: string, makerAddress: string): Promise<string> {
        const calldata = this.getStakingContract().getStakingPoolApprovalMessageHash.getABIEncodedTransactionData(
            poolId,
            makerAddress,
        );
        const returndata = await this._callAsync(calldata);
        const messageHash = this.getStakingContract().getStakingPoolApprovalMessageHash.getABIDecodedReturnData(
            returndata,
        );
        return messageHash;
    }
    public signApprovalForStakingPool(
        poolId: string,
        makerAddress: string,
        makerPrivateKeyIfExists?: Buffer,
        verifierAddressIfExists?: string,
        chainIdIfExists?: number,
        signatureType: SignatureType = SignatureType.EthSign,
    ): SignedStakingPoolApproval {
        const makerPrivateKey =
            makerPrivateKeyIfExists !== undefined
                ? makerPrivateKeyIfExists
                : testUtilsConstants.TESTRPC_PRIVATE_KEYS[this._accounts.indexOf(makerAddress)];
        const verifierAddress =
            verifierAddressIfExists !== undefined ? verifierAddressIfExists : this.getStakingProxyContract().address;
        const chainId = chainIdIfExists !== undefined ? chainIdIfExists : constants.CHAIN_ID;
        const approvalFactory = new ApprovalFactory(makerPrivateKey, verifierAddress, chainId);
        const signedStakingPoolApproval = approvalFactory.newSignedApproval(poolId, makerAddress, signatureType);
        return signedStakingPoolApproval;
    }
    ///// EPOCHS /////
    public async goToNextEpochAsync(): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().finalizeFees.getABIEncodedTransactionData();
        const txReceipt = await this._executeTransactionAsync(calldata, undefined, new BigNumber(0), true);
        logUtils.log(
            `Finalization costed ${txReceipt.gasUsed} gas`,
        );
        console.log(JSON.stringify(txReceipt.logs, null, 4));
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
    public async getCurrentEpochEarliestEndTimeInSecondsAsync(): Promise<BigNumber> {
        const calldata = this.getStakingContract().getCurrentEpochEarliestEndTimeInSeconds.getABIEncodedTransactionData();
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getCurrentEpochEarliestEndTimeInSeconds.getABIDecodedReturnData(returnData);
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
    public async payProtocolFeeAsync(
        makerAddress: string,
        amount: BigNumber,
        exchangeAddress: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
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
    public async isValidExchangeAddressAsync(exchangeAddress: string): Promise<boolean> {
        const calldata = this.getStakingContract().isValidExchangeAddress.getABIEncodedTransactionData(exchangeAddress);
        const returnData = await this._callAsync(calldata);
        const isValid = this.getStakingContract().isValidExchangeAddress.getABIDecodedReturnData(returnData);
        return isValid;
    }
    public async addExchangeAddressAsync(exchangeAddress: string, ownerAddressIfExists?: string): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().addExchangeAddress.getABIEncodedTransactionData(exchangeAddress);
        const ownerAddress = ownerAddressIfExists !== undefined ? ownerAddressIfExists : this._ownerAddress;
        const txReceipt = await this._executeTransactionAsync(calldata, ownerAddress);
        return txReceipt;
    }
    public async removeExchangeAddressAsync(exchangeAddress: string, ownerAddressIfExists?: string): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().removeExchangeAddress.getABIEncodedTransactionData(exchangeAddress);
        const ownerAddress = ownerAddressIfExists !== undefined ? ownerAddressIfExists : this._ownerAddress;
        const txReceipt = await this._executeTransactionAsync(calldata, ownerAddress);
        return txReceipt;
    }
    ///// REWARDS /////
    public async getRewardBalanceAsync(poolId: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getRewardBalance.getABIEncodedTransactionData(poolId);
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getRewardBalance.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getRewardBalanceOfOperatorAsync(poolId: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getRewardBalanceOfOperator.getABIEncodedTransactionData(poolId);
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getRewardBalanceOfOperator.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getRewardBalanceOfPoolAsync(poolId: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getRewardBalanceOfPool.getABIEncodedTransactionData(poolId);
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getRewardBalanceOfPool.getABIDecodedReturnData(returnData);
        return value;
    }
    public async computeRewardBalanceAsync(poolId: string, owner: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().computeRewardBalance.getABIEncodedTransactionData(poolId, owner);
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().computeRewardBalance.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getShadowBalanceByPoolIdAsync(poolId: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getShadowBalanceByPoolId.getABIEncodedTransactionData(poolId);
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getShadowBalanceByPoolId.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getShadowBalanceInPoolByOwnerAsync(owner: string, poolId: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getShadowBalanceInPoolByOwner.getABIEncodedTransactionData(
            owner,
            poolId,
        );
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getShadowBalanceInPoolByOwner.getABIDecodedReturnData(returnData);
        return value;
    }
    public async withdrawOperatorRewardAsync(
        poolId: string,
        amount: BigNumber,
        operatorAddress: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().withdrawOperatorReward.getABIEncodedTransactionData(poolId, amount);
        const txReceipt = await this._executeTransactionAsync(calldata, operatorAddress);
        return txReceipt;
    }
    public async withdrawRewardAsync(
        poolId: string,
        amount: BigNumber,
        owner: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().withdrawReward.getABIEncodedTransactionData(poolId, amount);
        const txReceipt = await this._executeTransactionAsync(calldata, owner);
        return txReceipt;
    }
    public async withdrawTotalOperatorRewardAsync(
        poolId: string,
        operatorAddress: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().withdrawTotalOperatorReward.getABIEncodedTransactionData(poolId);
        const txReceipt = await this._executeTransactionAsync(calldata, operatorAddress);
        return txReceipt;
    }
    public async withdrawTotalRewardAsync(poolId: string, owner: string): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().withdrawTotalReward.getABIEncodedTransactionData(poolId);
        const txReceipt = await this._executeTransactionAsync(calldata, owner);
        return txReceipt;
    }
    ///// REWARD VAULT /////
    public async rewardVaultDepositForAsync(
        poolId: string,
        amount: BigNumber,
        stakingContractAddress: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingPoolRewardVaultContract().depositFor.getABIEncodedTransactionData(poolId);
        const txReceipt = await this._executeTransactionAsync(calldata, stakingContractAddress, amount);
        return txReceipt;
    }
    public async rewardVaultEnterCatastrophicFailureModeAsync(
        zeroExMultisigAddress: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingPoolRewardVaultContract().enterCatostrophicFailure.getABIEncodedTransactionData();
        const txReceipt = await this._executeTransactionAsync(calldata, zeroExMultisigAddress);
        return txReceipt;
    }
    public async rewardVaultBalanceOfAsync(poolId: string): Promise<BigNumber> {
        const balance = await this.getStakingPoolRewardVaultContract().balanceOf.callAsync(poolId);
        return balance;
    }
    public async rewardVaultBalanceOfOperatorAsync(poolId: string): Promise<BigNumber> {
        const balance = await this.getStakingPoolRewardVaultContract().balanceOfOperator.callAsync(poolId);
        return balance;
    }
    public async rewardVaultBalanceOfPoolAsync(poolId: string): Promise<BigNumber> {
        const balance = await this.getStakingPoolRewardVaultContract().balanceOfPool.callAsync(poolId);
        return balance;
    }
    public async rewardVaultCreatePoolAsync(
        poolId: string,
        poolOperatorShare: number,
        stakingContractAddress: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingPoolRewardVaultContract().createPool.getABIEncodedTransactionData(
            poolId,
            poolOperatorShare,
        );
        const txReceipt = await this._executeTransactionAsync(calldata, stakingContractAddress);
        return txReceipt;
    }
    ///// ZRX VAULT /////
    public async getZrxVaultBalanceAsync(holder: string): Promise<BigNumber> {
        const balance = await this.getZrxVaultContract().balanceOf.callAsync(holder);
        return balance;
    }
    public async getZrxTokenBalanceAsync(holder: string): Promise<BigNumber> {
        const balance = await this._zrxTokenContract.balanceOf.callAsync(holder);
        return balance;
    }
    public async getZrxTokenBalanceOfZrxVaultAsync(): Promise<BigNumber> {
        const balance = await this._zrxTokenContract.balanceOf.callAsync(this.getZrxVaultContract().address);
        return balance;
    }
    ///// MATH /////
    public async nthRootAsync(value: BigNumber, n: BigNumber): Promise<BigNumber> {
        // const txReceipt = await this.getLibFeeMathTestContract().nthRoot.await(value, n);
        const output = await this.getLibFeeMathTestContract().nthRoot.callAsync(value, n);
        return output;
    }
    public async nthRootFixedPointAsync(value: BigNumber, n: BigNumber): Promise<BigNumber> {
        const output = await this.getLibFeeMathTestContract().nthRootFixedPoint.callAsync(value, n);
        return output;
    }
    public async cobbDouglasAsync(
        totalRewards: BigNumber,
        ownerFees: BigNumber,
        totalFees: BigNumber,
        ownerStake: BigNumber,
        totalStake: BigNumber,
        alphaNumerator: BigNumber,
        alphaDenominator: BigNumber,
    ): Promise<BigNumber> {
        const output = await this.getLibFeeMathTestContract().cobbDouglas.callAsync(
            totalRewards,
            ownerFees,
            totalFees,
            ownerStake,
            totalStake,
            alphaNumerator,
            alphaDenominator,
        );
        return output;
    }
    public async cobbDouglasSimplifiedAsync(
        totalRewards: BigNumber,
        ownerFees: BigNumber,
        totalFees: BigNumber,
        ownerStake: BigNumber,
        totalStake: BigNumber,
        alphaDenominator: BigNumber,
    ): Promise<BigNumber> {
        await this.getLibFeeMathTestContract().cobbDouglasSimplifiedInverse.awaitTransactionSuccessAsync(
            totalRewards,
            ownerFees,
            totalFees,
            ownerStake,
            totalStake,
            alphaDenominator,
        );
        const output = await this.getLibFeeMathTestContract().cobbDouglasSimplified.callAsync(
            totalRewards,
            ownerFees,
            totalFees,
            ownerStake,
            totalStake,
            alphaDenominator,
        );
        return output;
    }
    public async cobbDouglasSimplifiedInverseAsync(
        totalRewards: BigNumber,
        ownerFees: BigNumber,
        totalFees: BigNumber,
        ownerStake: BigNumber,
        totalStake: BigNumber,
        alphaDenominator: BigNumber,
    ): Promise<BigNumber> {
        await this.getLibFeeMathTestContract().cobbDouglasSimplifiedInverse.awaitTransactionSuccessAsync(
            totalRewards,
            ownerFees,
            totalFees,
            ownerStake,
            totalStake,
            alphaDenominator,
        );
        const output = await this.getLibFeeMathTestContract().cobbDouglasSimplifiedInverse.callAsync(
            totalRewards,
            ownerFees,
            totalFees,
            ownerStake,
            totalStake,
            alphaDenominator,
        );
        return output;
    }
    private async _executeTransactionAsync(
        calldata: string,
        from?: string,
        value?: BigNumber,
        includeLogs?: boolean,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const txData = {
            from: from ? from : this._ownerAddress,
            to: this.getStakingProxyContract().address,
            data: calldata,
            gas: 3000000,
            gasPrice: 0,
            value,
        };
        const txHash = await this._web3Wrapper.sendTransactionAsync(txData);
        const txReceipt = await (includeLogs
            ? this._logDecoder.getTxWithDecodedLogsAsync(txHash)
            : this._web3Wrapper.awaitTransactionSuccessAsync(txHash));
        return txReceipt;
    }
    private async _callAsync(calldata: string, from?: string): Promise<any> {
        const txData = {
            from: from ? from : this._ownerAddress,
            to: this.getStakingProxyContract().address,
            data: calldata,
            gas: 3000000,
        };
        const returnValue = await this._web3Wrapper.callAsync(txData);
        return returnValue;
    }
    private _validateDeployedOrThrow(): void {
        if (this._stakingContractIfExists === undefined) {
            throw new Error('Staking contracts are not deployed. Call `deployStakingContracts`');
        }
    }
}
// tslint:disable-line:max-file-line-count
