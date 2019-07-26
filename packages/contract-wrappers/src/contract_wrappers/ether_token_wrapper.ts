import { WETH9Contract, WETH9EventArgs, WETH9Events } from '@0x/abi-gen-wrappers';
import { SubscriptionManager } from '@0x/base-contract';
import { WETH9 } from '@0x/contract-artifacts';
import { schemas } from '@0x/json-schemas';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { ContractAbi, LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { BlockRange, ContractWrappersError, EventCallback, IndexedFilterValues, TransactionOpts } from '../types';
import { assert } from '../utils/assert';
import { utils } from '../utils/utils';

import { ERC20TokenWrapper } from './erc20_token_wrapper';

/**
 * This class includes all the functionality related to interacting with a wrapped Ether ERC20 token contract.
 * The caller can convert ETH into the equivalent number of wrapped ETH ERC20 tokens and back.
 */
export class EtherTokenWrapper {
    public abi: ContractAbi = WETH9.compilerOutput.abi;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _subscriptionManager: SubscriptionManager<WETH9EventArgs, WETH9Events>;
    private readonly _blockPollingIntervalMs?: number;
    private readonly _etherTokenContractsByAddress: {
        [address: string]: WETH9Contract;
    } = {};
    private readonly _erc20TokenWrapper: ERC20TokenWrapper;
    /**
     * Instantiate EtherTokenWrapper.
     * @param web3Wrapper Web3Wrapper instance to use
     * @param erc20TokenWrapper The ERC20TokenWrapper instance to use
     */
    constructor(web3Wrapper: Web3Wrapper, erc20TokenWrapper: ERC20TokenWrapper, blockPollingIntervalMs?: number) {
        this._web3Wrapper = web3Wrapper;
        this._erc20TokenWrapper = erc20TokenWrapper;
        this._blockPollingIntervalMs = blockPollingIntervalMs;
        this._subscriptionManager = new SubscriptionManager<WETH9EventArgs, WETH9Events>(
            WETH9Contract.ABI(),
            web3Wrapper,
        );
    }
    /**
     * Deposit ETH into the Wrapped ETH smart contract and issues the equivalent number of wrapped ETH tokens
     * to the depositor address. These wrapped ETH tokens can be used in 0x trades and are redeemable for 1-to-1
     * for ETH.
     * @param   etherTokenAddress   EtherToken address you wish to deposit into.
     * @param   amountInWei         Amount of ETH in Wei the caller wishes to deposit.
     * @param   depositor           The hex encoded user Ethereum address that would like to make the deposit.
     * @param   txOpts              Transaction parameters.
     * @return Transaction hash.
     */
    public async depositAsync(
        etherTokenAddress: string,
        amountInWei: BigNumber,
        depositor: string,
        txOpts: TransactionOpts = {},
    ): Promise<string> {
        assert.isETHAddressHex('etherTokenAddress', etherTokenAddress);
        assert.isValidBaseUnitAmount('amountInWei', amountInWei);
        await assert.isSenderAddressAsync('depositor', depositor, this._web3Wrapper);
        const normalizedEtherTokenAddress = etherTokenAddress.toLowerCase();
        const normalizedDepositorAddress = depositor.toLowerCase();

        const ethBalanceInWei = await this._web3Wrapper.getBalanceInWeiAsync(normalizedDepositorAddress);
        assert.assert(ethBalanceInWei.gte(amountInWei), ContractWrappersError.InsufficientEthBalanceForDeposit);

        const wethContract = await this._getEtherTokenContractAsync(normalizedEtherTokenAddress);
        const txHash = await wethContract.deposit.sendTransactionAsync(
            utils.removeUndefinedProperties({
                from: normalizedDepositorAddress,
                value: amountInWei,
                gas: txOpts.gasLimit,
                gasPrice: txOpts.gasPrice,
                nonce: txOpts.nonce,
            }),
        );
        return txHash;
    }
    /**
     * Withdraw ETH to the withdrawer's address from the wrapped ETH smart contract in exchange for the
     * equivalent number of wrapped ETH tokens.
     * @param   etherTokenAddress   EtherToken address you wish to withdraw from.
     * @param   amountInWei  Amount of ETH in Wei the caller wishes to withdraw.
     * @param   withdrawer   The hex encoded user Ethereum address that would like to make the withdrawal.
     * @param   txOpts       Transaction parameters.
     * @return Transaction hash.
     */
    public async withdrawAsync(
        etherTokenAddress: string,
        amountInWei: BigNumber,
        withdrawer: string,
        txOpts: TransactionOpts = {},
    ): Promise<string> {
        assert.isValidBaseUnitAmount('amountInWei', amountInWei);
        assert.isETHAddressHex('etherTokenAddress', etherTokenAddress);
        await assert.isSenderAddressAsync('withdrawer', withdrawer, this._web3Wrapper);
        const normalizedEtherTokenAddress = etherTokenAddress.toLowerCase();
        const normalizedWithdrawerAddress = withdrawer.toLowerCase();

        const WETHBalanceInBaseUnits = await this._erc20TokenWrapper.getBalanceAsync(
            normalizedEtherTokenAddress,
            normalizedWithdrawerAddress,
        );
        assert.assert(
            WETHBalanceInBaseUnits.gte(amountInWei),
            ContractWrappersError.InsufficientWEthBalanceForWithdrawal,
        );

        const wethContract = await this._getEtherTokenContractAsync(normalizedEtherTokenAddress);
        const txHash = await wethContract.withdraw.sendTransactionAsync(
            amountInWei,
            utils.removeUndefinedProperties({
                from: normalizedWithdrawerAddress,
                gas: txOpts.gasLimit,
                gasPrice: txOpts.gasPrice,
                nonce: txOpts.nonce,
            }),
        );
        return txHash;
    }
    /**
     * Gets historical logs without creating a subscription
     * @param   etherTokenAddress   An address of the ether token that emitted the logs.
     * @param   eventName           The ether token contract event you would like to subscribe to.
     * @param   blockRange          Block range to get logs from.
     * @param   indexFilterValues   An object where the keys are indexed args returned by the event and
     *                              the value is the value you are interested in. E.g `{_owner: aUserAddressHex}`
     * @return  Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends WETH9EventArgs>(
        etherTokenAddress: string,
        eventName: WETH9Events,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.isETHAddressHex('etherTokenAddress', etherTokenAddress);
        const normalizedEtherTokenAddress = etherTokenAddress.toLowerCase();
        assert.doesBelongToStringEnum('eventName', eventName, WETH9Events);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const logs = await this._subscriptionManager.getLogsAsync<ArgsType>(
            normalizedEtherTokenAddress,
            eventName,
            blockRange,
            indexFilterValues,
            WETH9.compilerOutput.abi,
        );
        return logs;
    }
    /**
     * Subscribe to an event type emitted by the Token contract.
     * @param   etherTokenAddress   The hex encoded address where the ether token is deployed.
     * @param   eventName           The ether token contract event you would like to subscribe to.
     * @param   indexFilterValues   An object where the keys are indexed args returned by the event and
     *                              the value is the value you are interested in. E.g `{_owner: aUserAddressHex}`
     * @param   callback            Callback that gets called when a log is added/removed
     * @param   isVerbose           Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends WETH9EventArgs>(
        etherTokenAddress: string,
        eventName: WETH9Events,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
        isVerbose: boolean = false,
    ): string {
        assert.isETHAddressHex('etherTokenAddress', etherTokenAddress);
        const normalizedEtherTokenAddress = etherTokenAddress.toLowerCase();
        assert.doesBelongToStringEnum('eventName', eventName, WETH9Events);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const subscriptionToken = this._subscriptionManager.subscribe<ArgsType>(
            normalizedEtherTokenAddress,
            eventName,
            indexFilterValues,
            WETH9.compilerOutput.abi,
            callback,
            isVerbose,
            this._blockPollingIntervalMs,
        );
        return subscriptionToken;
    }
    /**
     * Cancel a subscription
     * @param   subscriptionToken Subscription token returned by `subscribe()`
     */
    public unsubscribe(subscriptionToken: string): void {
        assert.isValidSubscriptionToken('subscriptionToken', subscriptionToken);
        this._subscriptionManager.unsubscribe(subscriptionToken);
    }
    /**
     * Cancels all existing subscriptions
     */
    public unsubscribeAll(): void {
        this._subscriptionManager.unsubscribeAll();
    }
    private async _getEtherTokenContractAsync(etherTokenAddress: string): Promise<WETH9Contract> {
        let etherTokenContract = this._etherTokenContractsByAddress[etherTokenAddress];
        if (etherTokenContract !== undefined) {
            return etherTokenContract;
        }
        const contractInstance = new WETH9Contract(
            etherTokenAddress,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        etherTokenContract = contractInstance;
        this._etherTokenContractsByAddress[etherTokenAddress] = etherTokenContract;
        return etherTokenContract;
    }
}
