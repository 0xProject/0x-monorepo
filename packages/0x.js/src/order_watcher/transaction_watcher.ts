import { schemas } from '@0xproject/json-schemas';
import { BlockParamLiteral, LogWithDecodedArgs, SignedOrder, TransactionReceiptWithDecodedLogs } from '@0xproject/types';
import { AbiDecoder, intervalUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';

import { ZeroEx } from '../0x';
import { ExchangeWrapper } from '../contract_wrappers/exchange_wrapper';
import {
    DepositContractEventArgs,
    EtherTokenEvents,
    WithdrawalContractEventArgs,
} from '../contract_wrappers/generated/ether_token';
import {
    ExchangeEvents,
    LogCancelContractEventArgs,
    LogFillContractEventArgs,
} from '../contract_wrappers/generated/exchange';
import {
    ApprovalContractEventArgs,
    TokenEvents,
    TransferContractEventArgs,
} from '../contract_wrappers/generated/token';
import { TokenWrapper } from '../contract_wrappers/token_wrapper';
import { BalanceAndProxyAllowanceLazyStore } from '../stores/balance_proxy_allowance_lazy_store';
import { OrderFilledCancelledLazyStore } from '../stores/order_filled_cancelled_lazy_store';
import {
    ContractEventArgs,
    ExchangeContractErrs,
    LogEvent,
    OnTransactionSuccessCallback,
    OnTransactionFailedCallback,
    ZeroExError,
} from '../types';
import { assert } from '../utils/assert';
import { OrderStateUtils } from '../utils/order_state_utils';
import { utils } from '../utils/utils';

import { EventWatcher } from './event_watcher';
import {LogEntry} from "../../../types/lib";

interface TransactionHashes extends Array<string>{}

/**
 * This class includes all the functionality for tracking transactions submitted to
 * the blockchain. The transactionWatcher notifies the subscriber when a transaction
 * succeeds (passing along the decoded event logs), or fails (e.g. out of gas).
 */
export class TransactionWatcher {
    private _transactionHashes: TransactionHashes;
    private _eventWatcher: EventWatcher;
    private _web3Wrapper: Web3Wrapper;
    private _abiDecoder: AbiDecoder;
    constructor(
        web3Wrapper: Web3Wrapper,
        abiDecoder: AbiDecoder,
        token: TokenWrapper,
        exchange: ExchangeWrapper,
    ) {

    }
    /**
     * Add a transaction to the transactionWatcher.
     * @param   transactionHash     The transactionHash of the transaction you wish to start watching.
     */
    public addTransaction(transactionHash: string): void {
        assert.isHexString('transactionHash', transactionHash);
        this._transactionHashes.push(transactionHash)
    }
    /**
     * Removes a transaction from the transactionWatcher
     * @param   transactionHash     The transactionHash of the transaction you wish to stop watching.
     */
    public removeTransaction(orderHash: string): void {

    }
    /**
     * Starts an transactionWatcher subscription. successCallback will be called every time a watched transaction's
     * is processed successfully, along with the decoded event logs. failCallback will be called every time a
     * watched transaction fails to process (e.g. out of gas).
     * @param   successCallback     Receives a TransactionReceiptWithDecodedLogs.
     * @param   failCallback      Receives a TransactionReceipt of the transaction.
     */
    public subscribe(successCallback: OnTransactionSuccessCallback, failCallback: OnTransactionFailedCallback): void {

    }
    /**
     * Ends an transactionWatcher subscription.
     */
    public unsubscribe(): void {

    }
    private async _getTransactionsAsync(): Promise<LogEntry[]> {

    }
}
