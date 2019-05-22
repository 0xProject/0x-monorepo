import { constants, LogDecoder, txDefaults } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import { assetDataUtils } from '@0x/order-utils';
import { LogWithDecodedArgs, Provider, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import { ERC20ProxyContract } from '@0x/contracts-asset-proxy';
import * as _ from 'lodash';

import { artifacts, StakingContract, ZrxVaultContract } from '../../src';

const expect = chai.expect;

export class StakingWrapper {
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _provider: Provider;
    private readonly _logDecoder: LogDecoder;
    private readonly _ownerAddres: string;
    private readonly _erc20ProxyContract: ERC20ProxyContract;
    private readonly _zrxTokenAddress: string;
    private _stakingContractIfExists?: StakingContract;
    private _zrxVaultContractIfExists?: ZrxVaultContract;

    constructor(provider: Provider, ownerAddres: string, erc20ProxyContract: ERC20ProxyContract, zrxTokenAddress: string) {
        this._web3Wrapper = new Web3Wrapper(provider);
        this._provider = provider;
        this._logDecoder = new LogDecoder(this._web3Wrapper, artifacts);
        this._ownerAddres= ownerAddres;
        this._erc20ProxyContract = erc20ProxyContract;
        this._zrxTokenAddress = zrxTokenAddress;
    }
    public getStakingContract(): StakingContract {
        this._validateDeployedOrThrow();
        return this._stakingContractIfExists as StakingContract;
    }
    public getZrxVaultContract(): ZrxVaultContract {
        this._validateDeployedOrThrow();
        return this._zrxVaultContractIfExists as ZrxVaultContract;
    }
    public async deployAndConfigureContracts(): Promise<void> {
        // deploy zrx vault
        const zrxAssetData = assetDataUtils.encodeERC20AssetData(this._zrxTokenAddress);
        this._zrxVaultContractIfExists = await ZrxVaultContract.deployFrom0xArtifactAsync(
            artifacts.ZrxVault,
            this._provider,
            txDefaults,
            this._erc20ProxyContract.address,
            zrxAssetData
        );
        // configure erc20 proxy to accept calls from zrx vault
        await this._erc20ProxyContract.addAuthorizedAddress.awaitTransactionSuccessAsync((this._zrxVaultContractIfExists as ZrxVaultContract).address);
        // deploy staking contract
        this._stakingContractIfExists = await StakingContract.deployFrom0xArtifactAsync(
            artifacts.Staking,
            this._provider,
            txDefaults,
            (this._zrxVaultContractIfExists as ZrxVaultContract).address
        );
    }
    /*
    public async stake(holder: string, amount: BigNumber): Promise<BigNumber> {
        const stakeMinted = await this.getStakingContract().stake.callAsync(amount, {from: holder});
        await this.getStakingContract().stake.awaitTransactionSuccessAsync(amount, {from: holder});
        return stakeMinted;
    }
    public async getStakeBalance(holder: string): Promise<BigNumber> {
        const balance = await this.getStakingContract().getStakeBalance.callAsync(holder);
        return balance;
    }
    */
    public async getZrxVaultBalance(holder: string): Promise<BigNumber> {
        const balance = await this.getZrxVaultContract().balanceOf.callAsync(holder);
        return balance;
    }
    public toBaseUnitAmount(amount: BigNumber | number): BigNumber {
        const decimals = 18;
        const amountAsBigNumber = typeof(amount)  === 'number' ? new BigNumber(amount) : amount;
        return Web3Wrapper.toBaseUnitAmount(amountAsBigNumber, decimals);
    }
    private _validateDeployedOrThrow() {
        if (this._stakingContractIfExists === undefined) {
            throw new Error('Staking contract not deployed. Call `deployStakingContracts`');
        } else if (this._zrxVaultContractIfExists === undefined) {
            throw new Error('ZRX Vault contract not deployed. Call `deployStakingContracts`');
        }
    }
}
