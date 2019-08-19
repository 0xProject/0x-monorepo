import { constants, LogDecoder, txDefaults } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import { assetDataUtils } from '@0x/order-utils';
import { LogWithDecodedArgs, Provider, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { ERC20ProxyContract } from '@0x/contracts-asset-proxy';
import * as _ from 'lodash';

import { artifacts, StakingContract, StakingProxyContract, ZrxVaultContract, LibMathTestContract } from '../../src';

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
        // deploy libmath test
        this._libMathTestContractIfExists = await LibMathTestContract.deployFrom0xArtifactAsync(
            artifacts.LibMathTest,
            this._provider,
            txDefaults,
        );
    }
    private async _executeTransactionAsync(calldata: string, from?: string): Promise<TransactionReceiptWithDecodedLogs> {
        const txData = {
            from: (from ? from : this._ownerAddres),
            to: this.getStakingProxyContract().address,
            data: calldata,
            gas: 3000000
        }
        const txReceipt = await this._web3Wrapper.awaitTransactionSuccessAsync(
            await this._web3Wrapper.sendTransactionAsync(txData)
        );
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
    public async stake(holder: string, amount: BigNumber): Promise<BigNumber> {
        const calldata = this.getStakingContract().stake.getABIEncodedTransactionData(amount);
        const txReceipt = await this._executeTransactionAsync(calldata, holder);
        const stakeMintedLog = this._logDecoder.decodeLogOrThrow(txReceipt.logs[1]);
        const stakeMinted = (stakeMintedLog as any).args.amount;
        return stakeMinted;
    }
    public async unstake(holder: string, amount: BigNumber): Promise<BigNumber> {
        const calldata = this.getStakingContract().unstake.getABIEncodedTransactionData(amount);
        const txReceipt = await this._executeTransactionAsync(calldata, holder);
        const stakeBurnedLog = this._logDecoder.decodeLogOrThrow(txReceipt.logs[1]);
        const stakeBurned = (stakeBurnedLog as any).args.amount;
        return stakeBurned;
    }
    public async getStakeBalance(holder: string): Promise<BigNumber> {
        const calldata = this.getStakingContract().getStakeBalance.getABIEncodedTransactionData(holder); 
        const balance = await this._callAsync(calldata, holder);
        return balance;
    }
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
    /*
    public async addMakerToPoolAsync(poolId: string, makerAddress: string, makerSignature: string): Promise<void> {

    }
    public async removeMakerFromPoolAsync(poolId: string, makerAddress: string): Promise<void> {

    }
    public async getMakerPoolId(makerAddress: string): Promise<string> {

    }
    public async getMakersForPool(poolId: string): Promise<string[]> {

    }
    */
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
    public async nthRoot(value: BigNumber, n: BigNumber): Promise<BigNumber> {
        const output = await this.getLibMathTestContract().nthRoot.callAsync(value, n);
        return output;
    }
    public async nthRootFixedPoint(value: BigNumber, n: BigNumber, decimals: BigNumber): Promise<BigNumber> {
        const output = await this.getLibMathTestContract().nthRootFixedPoint.callAsync(value, n, decimals);
        return output;
    }
    public async cobbDouglas(
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
    public async cobbDouglasSimplified(
        totalRewards: BigNumber,
        ownerFees: BigNumber,
        totalFees: BigNumber,
        ownerStake: BigNumber,
        totalStake: BigNumber,
        alphaDenominator: BigNumber
    ) {
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
    public async cobbDouglasSimplifiedInverse(
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
