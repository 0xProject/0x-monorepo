import { ERC20ProxyContract } from '@0x/contracts-asset-proxy';
import { artifacts as erc20Artifacts, DummyERC20TokenContract } from '@0x/contracts-erc20';
import { constants as testUtilsConstants, LogDecoder, txDefaults } from '@0x/contracts-test-utils';
import { SignatureType } from '@0x/types';
import { BigNumber, logUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { Provider, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import {
    artifacts,
    LibFeeMathTestContract,
    StakingContract,
    StakingPoolRewardVaultContract,
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
        this._zrxVaultContractIfExists = await ZrxVaultContract.deployFrom0xArtifactAsync(
            artifacts.ZrxVault,
            this._provider,
            txDefaults,
            artifacts,
            this._erc20ProxyContract.address,
            this._zrxTokenContract.address,
        );
        // deploy reward vault
        this._rewardVaultContractIfExists = await StakingPoolRewardVaultContract.deployFrom0xArtifactAsync(
            artifacts.StakingPoolRewardVault,
            this._provider,
            txDefaults,
            artifacts,
        );
        // configure erc20 proxy to accept calls from zrx vault
        await this._erc20ProxyContract.addAuthorizedAddress.awaitTransactionSuccessAsync(
            this._zrxVaultContractIfExists.address,
        );
        // deploy staking contract
        this._stakingContractIfExists = await StakingContract.deployFrom0xArtifactAsync(
            artifacts.Staking,
            this._provider,
            txDefaults,
            artifacts,
        );
        // deploy staking proxy
        this._stakingProxyContractIfExists = await StakingProxyContract.deployFrom0xArtifactAsync(
            artifacts.StakingProxy,
            this._provider,
            txDefaults,
            artifacts,
            this._stakingContractIfExists.address,
        );
        // set staking proxy contract in zrx vault
        await this._zrxVaultContractIfExists.setStakingContract.awaitTransactionSuccessAsync(
            this._stakingProxyContractIfExists.address,
        );
        // set zrx vault in staking contract
        const setZrxVaultCalldata = this._stakingContractIfExists.setZrxVault.getABIEncodedTransactionData(
            this._zrxVaultContractIfExists.address,
        );
        const setZrxVaultTxData = {
            from: this._ownerAddress,
            to: this._stakingProxyContractIfExists.address,
            data: setZrxVaultCalldata,
        };
        await this._web3Wrapper.awaitTransactionSuccessAsync(
            await this._web3Wrapper.sendTransactionAsync(setZrxVaultTxData),
        );
        // set staking proxy contract in reward vault
        await this._rewardVaultContractIfExists.setStakingContract.awaitTransactionSuccessAsync(
            this._stakingProxyContractIfExists.address,
        );
        // set reward vault in staking contract
        const setStakingPoolRewardVaultCalldata = this._stakingContractIfExists.setStakingPoolRewardVault.getABIEncodedTransactionData(
            this._rewardVaultContractIfExists.address,
        );
        const setStakingPoolRewardVaultTxData = {
            from: this._ownerAddress,
            to: this._stakingProxyContractIfExists.address,
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
            artifacts,
        );
    }
    public async getEthBalanceAsync(owner: string): Promise<BigNumber> {
        const balance = this._web3Wrapper.getBalanceInWeiAsync(owner);
        return balance;
    }
    ///// STAKE /////
    public async depositZrxAndMintDeactivatedStakeAsync(
        owner: string,
        amount: BigNumber,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().depositZrxAndMintDeactivatedStake.getABIEncodedTransactionData(
            amount,
        );
        const txReceipt = await this._executeTransactionAsync(calldata, owner);
        return txReceipt;
    }
    public async depositZrxAndMintActivatedStakeAsync(
        owner: string,
        amount: BigNumber,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().depositZrxAndMintActivatedStake.getABIEncodedTransactionData(amount);
        const txReceipt = await this._executeTransactionAsync(calldata, owner);
        return txReceipt;
    }
    public async depositZrxAndDelegateToStakingPoolAsync(
        owner: string,
        poolId: string,
        amount: BigNumber,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().depositZrxAndDelegateToStakingPool.getABIEncodedTransactionData(
            poolId,
            amount,
        );
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
    public async deactivateAndTimeLockStakeAsync(
        owner: string,
        amount: BigNumber,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().deactivateAndTimeLockStake.getABIEncodedTransactionData(amount);
        const txReceipt = await this._executeTransactionAsync(calldata, owner);
        return txReceipt;
    }
    public async deactivateAndTimeLockDelegatedStakeAsync(
        owner: string,
        poolId: string,
        amount: BigNumber,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().deactivateAndTimeLockDelegatedStake.getABIEncodedTransactionData(
            poolId,
            amount,
        );
        const txReceipt = await this._executeTransactionAsync(calldata, owner, new BigNumber(0), true);
        return txReceipt;
    }
    public async burnDeactivatedStakeAndWithdrawZrxAsync(
        owner: string,
        amount: BigNumber,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().burnDeactivatedStakeAndWithdrawZrx.getABIEncodedTransactionData(
            amount,
        );
        const txReceipt = await this._executeTransactionAsync(calldata, owner);
        return txReceipt;
    }
    public async forceTimeLockSyncAsync(owner: string): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().forceTimeLockSync.getABIEncodedTransactionData(owner);
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
    public async getTimeLockedStakeAsync(owner: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getTimeLockedStake.getABIEncodedTransactionData(owner);
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getTimeLockedStake.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getTimeLockStartAsync(owner: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getTimeLockStart.getABIEncodedTransactionData(owner);
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getTimeLockStart.getABIDecodedReturnData(returnData);
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
    public async getTotalStakeDelegatedToPoolAsync(poolId: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getTotalStakeDelegatedToPool.getABIEncodedTransactionData(poolId);
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getTotalStakeDelegatedToPool.getABIDecodedReturnData(returnData);
        return value;
    }
    ///// POOLS /////
    public async getNextStakingPoolIdAsync(): Promise<string> {
        const calldata = this.getStakingContract().getNextStakingPoolId.getABIEncodedTransactionData();
        const nextPoolId = await this._callAsync(calldata);
        return nextPoolId;
    }
    public async createStakingPoolAsync(operatorAddress: string, operatorShare: number): Promise<string> {
        const calldata = this.getStakingContract().createStakingPool.getABIEncodedTransactionData(operatorShare);
        const txReceipt = await this._executeTransactionAsync(calldata, operatorAddress);
        const createStakingPoolLog = this._logDecoder.decodeLogOrThrow(txReceipt.logs[0]);
        const poolId = (createStakingPoolLog as any).args.poolId;
        return poolId;
    }
    public async addMakerToStakingPoolAsync(
        poolId: string,
        makerAddress: string,
        makerSignature: string,
        operatorAddress: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().addMakerToStakingPool.getABIEncodedTransactionData(
            poolId,
            makerAddress,
            makerSignature,
        );
        const txReceipt = await this._executeTransactionAsync(calldata, operatorAddress);
        return txReceipt;
    }
    public async removeMakerFromStakingPoolAsync(
        poolId: string,
        makerAddress: string,
        operatorAddress: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().removeMakerFromStakingPool.getABIEncodedTransactionData(
            poolId,
            makerAddress,
        );
        const txReceipt = await this._executeTransactionAsync(calldata, operatorAddress);
        return txReceipt;
    }
    public async getStakingPoolIdOfMakerAsync(makerAddress: string): Promise<string> {
        const calldata = this.getStakingContract().getStakingPoolIdOfMaker.getABIEncodedTransactionData(makerAddress);
        const poolId = await this._callAsync(calldata);
        return poolId;
    }
    public async getMakersForStakingPoolAsync(poolId: string): Promise<string[]> {
        const calldata = this.getStakingContract().getMakersForStakingPool.getABIEncodedTransactionData(poolId);
        const returndata = await this._callAsync(calldata);
        const makerAddresses = this.getStakingContract().getMakersForStakingPool.getABIDecodedReturnData(returndata);
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
        logUtils.log(`Finalization costed ${txReceipt.gasUsed} gas`);
        return txReceipt;
    }
    public async skipToNextEpochAsync(): Promise<TransactionReceiptWithDecodedLogs> {
        // increase timestamp of next block
        const epochDurationInSeconds = await this.getEpochDurationInSecondsAsync();
        await this._web3Wrapper.increaseTimeAsync(epochDurationInSeconds.toNumber());
        // mine next block
        await this._web3Wrapper.mineBlockAsync();
        // increment epoch in contracts
        const txReceipt = await this.goToNextEpochAsync();
        // mine next block
        await this._web3Wrapper.mineBlockAsync();
        return txReceipt;
    }
    public async skipToNextTimeLockPeriodAsync(): Promise<void> {
        const timeLockEndEpoch = await this.getCurrentTimeLockPeriodEndEpochAsync();
        const currentEpoch = await this.getCurrentEpochAsync();
        const nEpochsToJump = timeLockEndEpoch.minus(currentEpoch);
        const nEpochsToJumpAsNumber = nEpochsToJump.toNumber();
        for (let i = 0; i < nEpochsToJumpAsNumber; ++i) {
            await this.skipToNextEpochAsync();
        }
    }
    public async getEpochDurationInSecondsAsync(): Promise<BigNumber> {
        const calldata = this.getStakingContract().getEpochDurationInSeconds.getABIEncodedTransactionData();
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getEpochDurationInSeconds.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getTimeLockDurationInEpochsAsync(): Promise<BigNumber> {
        const calldata = this.getStakingContract().getTimeLockDurationInEpochs.getABIEncodedTransactionData();
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getTimeLockDurationInEpochs.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getCurrentEpochStartTimeInSecondsAsync(): Promise<BigNumber> {
        const calldata = this.getStakingContract().getCurrentEpochStartTimeInSeconds.getABIEncodedTransactionData();
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getCurrentEpochStartTimeInSeconds.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getCurrentTimeLockPeriodStartEpochAsync(): Promise<BigNumber> {
        const calldata = this.getStakingContract().getCurrentTimeLockPeriodStartEpoch.getABIEncodedTransactionData();
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getCurrentTimeLockPeriodStartEpoch.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getCurrentEpochEarliestEndTimeInSecondsAsync(): Promise<BigNumber> {
        const calldata = this.getStakingContract().getCurrentEpochEarliestEndTimeInSeconds.getABIEncodedTransactionData();
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getCurrentEpochEarliestEndTimeInSeconds.getABIDecodedReturnData(
            returnData,
        );
        return value;
    }
    public async getCurrentTimeLockPeriodEndEpochAsync(): Promise<BigNumber> {
        const calldata = this.getStakingContract().getCurrentTimeLockPeriodEndEpoch.getABIEncodedTransactionData();
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getCurrentTimeLockPeriodEndEpoch.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getCurrentEpochAsync(): Promise<BigNumber> {
        const calldata = this.getStakingContract().getCurrentEpoch.getABIEncodedTransactionData();
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getCurrentEpoch.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getCurrentTimeLockPeriodAsync(): Promise<BigNumber> {
        const calldata = this.getStakingContract().getCurrentTimeLockPeriod.getABIEncodedTransactionData();
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getCurrentTimeLockPeriod.getABIDecodedReturnData(returnData);
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
    public async addExchangeAddressAsync(
        exchangeAddress: string,
        ownerAddressIfExists?: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().addExchangeAddress.getABIEncodedTransactionData(exchangeAddress);
        const ownerAddress = ownerAddressIfExists !== undefined ? ownerAddressIfExists : this._ownerAddress;
        const txReceipt = await this._executeTransactionAsync(calldata, ownerAddress);
        return txReceipt;
    }
    public async removeExchangeAddressAsync(
        exchangeAddress: string,
        ownerAddressIfExists?: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().removeExchangeAddress.getABIEncodedTransactionData(exchangeAddress);
        const ownerAddress = ownerAddressIfExists !== undefined ? ownerAddressIfExists : this._ownerAddress;
        const txReceipt = await this._executeTransactionAsync(calldata, ownerAddress);
        return txReceipt;
    }
    ///// REWARDS /////
    public async getTotalRewardBalanceOfStakingPoolAsync(poolId: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getTotalRewardBalanceOfStakingPool.getABIEncodedTransactionData(
            poolId,
        );
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getTotalRewardBalanceOfStakingPool.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getRewardBalanceOfStakingPoolOperatorAsync(poolId: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getRewardBalanceOfStakingPoolOperator.getABIEncodedTransactionData(
            poolId,
        );
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getRewardBalanceOfStakingPoolOperator.getABIDecodedReturnData(
            returnData,
        );
        return value;
    }
    public async getRewardBalanceOfStakingPoolMembersAsync(poolId: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getRewardBalanceOfStakingPoolMembers.getABIEncodedTransactionData(
            poolId,
        );
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getRewardBalanceOfStakingPoolMembers.getABIDecodedReturnData(
            returnData,
        );
        return value;
    }
    public async computeRewardBalanceOfStakingPoolMemberAsync(poolId: string, owner: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().computeRewardBalanceOfStakingPoolMember.getABIEncodedTransactionData(
            poolId,
            owner,
        );
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().computeRewardBalanceOfStakingPoolMember.getABIDecodedReturnData(
            returnData,
        );
        return value;
    }
    public async getTotalShadowBalanceOfStakingPoolAsync(poolId: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getTotalShadowBalanceOfStakingPool.getABIEncodedTransactionData(
            poolId,
        );
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getTotalShadowBalanceOfStakingPool.getABIDecodedReturnData(returnData);
        return value;
    }
    public async getShadowBalanceOfStakingPoolMemberAsync(owner: string, poolId: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getShadowBalanceOfStakingPoolMember.getABIEncodedTransactionData(
            owner,
            poolId,
        );
        const returnData = await this._callAsync(calldata);
        const value = this.getStakingContract().getShadowBalanceOfStakingPoolMember.getABIDecodedReturnData(returnData);
        return value;
    }
    public async withdrawRewardForStakingPoolOperatorAsync(
        poolId: string,
        amount: BigNumber,
        operatorAddress: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().withdrawRewardForStakingPoolOperator.getABIEncodedTransactionData(
            poolId,
            amount,
        );
        const txReceipt = await this._executeTransactionAsync(calldata, operatorAddress);
        return txReceipt;
    }
    public async withdrawRewardForStakingPoolMemberAsync(
        poolId: string,
        amount: BigNumber,
        owner: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().withdrawRewardForStakingPoolMember.getABIEncodedTransactionData(
            poolId,
            amount,
        );
        const txReceipt = await this._executeTransactionAsync(calldata, owner);
        return txReceipt;
    }
    public async withdrawTotalRewardForStakingPoolOperatorAsync(
        poolId: string,
        operatorAddress: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().withdrawTotalRewardForStakingPoolOperator.getABIEncodedTransactionData(
            poolId,
        );
        const txReceipt = await this._executeTransactionAsync(calldata, operatorAddress);
        return txReceipt;
    }
    public async withdrawTotalRewardForStakingPoolMemberAsync(
        poolId: string,
        owner: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingContract().withdrawTotalRewardForStakingPoolMember.getABIEncodedTransactionData(
            poolId,
        );
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
        const calldata = this.getStakingPoolRewardVaultContract().enterCatastrophicFailure.getABIEncodedTransactionData();
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
    public async rewardVaultBalanceOfMembersAsync(poolId: string): Promise<BigNumber> {
        const balance = await this.getStakingPoolRewardVaultContract().balanceOfMembers.callAsync(poolId);
        return balance;
    }
    public async rewardVaultRegisterPoolAsync(
        poolId: string,
        poolOperatorShare: number,
        stakingContractAddress: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const calldata = this.getStakingPoolRewardVaultContract().registerStakingPool.getABIEncodedTransactionData(
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
