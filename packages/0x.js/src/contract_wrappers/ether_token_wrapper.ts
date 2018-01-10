import { schemas } from '@0xproject/json-schemas';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';

import { artifacts } from '../artifacts';
import {
    BlockRange,
    EtherTokenContractEventArgs,
    EtherTokenEvents,
    EventCallback,
    IndexedFilterValues,
    LogWithDecodedArgs,
    TransactionOpts,
    ZeroExError,
} from '../types';
import { AbiDecoder } from '../utils/abi_decoder';
import { assert } from '../utils/assert';

import { ContractWrapper } from './contract_wrapper';
import { EtherTokenContract } from './generated/ether_token';
import { TokenWrapper } from './token_wrapper';

/**
 * This class includes all the functionality related to interacting with a wrapped Ether ERC20 token contract.
 * The caller can convert ETH into the equivalent number of wrapped ETH ERC20 tokens and back.
 */
export class EtherTokenWrapper extends ContractWrapper {
    private _etherTokenContractsByAddress: {
        [address: string]: EtherTokenContract;
    } = {};
    private _tokenWrapper: TokenWrapper;
    constructor(web3Wrapper: Web3Wrapper, networkId: number, abiDecoder: AbiDecoder, tokenWrapper: TokenWrapper) {
        super(web3Wrapper, networkId, abiDecoder);
        this._tokenWrapper = tokenWrapper;
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
        assert.isValidBaseUnitAmount('amountInWei', amountInWei);
        await assert.isSenderAddressAsync('depositor', depositor, this._web3Wrapper);

        const ethBalanceInWei = await this._web3Wrapper.getBalanceInWeiAsync(depositor);
        assert.assert(ethBalanceInWei.gte(amountInWei), ZeroExError.InsufficientEthBalanceForDeposit);

        const wethContract = await this._getEtherTokenContractAsync(etherTokenAddress);
        const txHash = await wethContract.deposit.sendTransactionAsync({
            from: depositor,
            value: amountInWei,
            gas: txOpts.gasLimit,
            gasPrice: txOpts.gasPrice,
        });
        return txHash;
    }
    /**
     * Withdraw ETH to the withdrawer's address from the wrapped ETH smart contract in exchange for the
     * equivalent number of wrapped ETH tokens.
     * @param   etherTokenAddress   EtherToken address you wish to withdraw from.
     * @param   amountInWei  Amount of ETH in Wei the caller wishes to withdraw.
     * @param   withdrawer   The hex encoded user Ethereum address that would like to make the withdrawl.
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
        await assert.isSenderAddressAsync('withdrawer', withdrawer, this._web3Wrapper);

        const WETHBalanceInBaseUnits = await this._tokenWrapper.getBalanceAsync(etherTokenAddress, withdrawer);
        assert.assert(WETHBalanceInBaseUnits.gte(amountInWei), ZeroExError.InsufficientWEthBalanceForWithdrawal);

        const wethContract = await this._getEtherTokenContractAsync(etherTokenAddress);
        const txHash = await wethContract.withdraw.sendTransactionAsync(amountInWei, {
            from: withdrawer,
            gas: txOpts.gasLimit,
            gasPrice: txOpts.gasPrice,
        });
        return txHash;
    }
    /**
     * Gets historical logs without creating a subscription
     * @param   etherTokenAddress   An address of the ether token that emmited the logs.
     * @param   eventName           The ether token contract event you would like to subscribe to.
     * @param   blockRange          Block range to get logs from.
     * @param   indexFilterValues   An object where the keys are indexed args returned by the event and
     *                              the value is the value you are interested in. E.g `{_owner: aUserAddressHex}`
     * @return  Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends EtherTokenContractEventArgs>(
        etherTokenAddress: string,
        eventName: EtherTokenEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.isETHAddressHex('etherTokenAddress', etherTokenAddress);
        assert.doesBelongToStringEnum('eventName', eventName, EtherTokenEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const logs = await this._getLogsAsync<ArgsType>(
            etherTokenAddress,
            eventName,
            blockRange,
            indexFilterValues,
            artifacts.EtherTokenArtifact.abi,
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
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends EtherTokenContractEventArgs>(
        etherTokenAddress: string,
        eventName: EtherTokenEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
    ): string {
        assert.isETHAddressHex('etherTokenAddress', etherTokenAddress);
        assert.doesBelongToStringEnum('eventName', eventName, EtherTokenEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const subscriptionToken = this._subscribe<ArgsType>(
            etherTokenAddress,
            eventName,
            indexFilterValues,
            artifacts.EtherTokenArtifact.abi,
            callback,
        );
        return subscriptionToken;
    }
    /**
     * Cancel a subscription
     * @param   subscriptionToken Subscription token returned by `subscribe()`
     */
    public unsubscribe(subscriptionToken: string): void {
        this._unsubscribe(subscriptionToken);
    }
    /**
     * Cancels all existing subscriptions
     */
    public unsubscribeAll(): void {
        super.unsubscribeAll();
    }
    private _invalidateContractInstance(): void {
        this.unsubscribeAll();
        this._etherTokenContractsByAddress = {};
    }
    private async _getEtherTokenContractAsync(etherTokenAddress: string): Promise<EtherTokenContract> {
        let etherTokenContract = this._etherTokenContractsByAddress[etherTokenAddress];
        if (!_.isUndefined(etherTokenContract)) {
            return etherTokenContract;
        }
        const web3ContractInstance = await this._instantiateContractIfExistsAsync(
            artifacts.EtherTokenArtifact,
            etherTokenAddress,
        );
        const contractInstance = new EtherTokenContract(web3ContractInstance, this._web3Wrapper.getContractDefaults());
        etherTokenContract = contractInstance;
        this._etherTokenContractsByAddress[etherTokenAddress] = etherTokenContract;
        return etherTokenContract;
    }
}
