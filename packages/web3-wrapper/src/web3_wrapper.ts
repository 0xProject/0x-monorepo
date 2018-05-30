import {
    BlockParam,
    BlockWithoutTransactionData,
    CallData,
    ContractAbi,
    FilterObject,
    JSONRPCRequestPayload,
    JSONRPCResponsePayload,
    LogEntry,
    Provider,
    RawLogEntry,
    TransactionReceipt,
    TransactionReceiptWithDecodedLogs,
    TxData,
} from 'ethereum-types';
import { AbiDecoder, addressUtils, BigNumber, intervalUtils, promisify } from '@0xproject/utils';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { Web3WrapperErrors } from './types';

const BASE_TEN = 10;

/**
 * A wrapper around the Web3.js 0.x library that provides a consistent, clean promise-based interface.
 */
export class Web3Wrapper {
    /**
     * Flag to check if this instance is of type Web3Wrapper
     */
    public isZeroExWeb3Wrapper = true;
    public abiDecoder: AbiDecoder;
    private _web3: Web3;
    private _txDefaults: Partial<TxData>;
    private _jsonRpcRequestId: number;
    /**
     * Check if an address is a valid Ethereum address
     * @param address Address to check
     * @returns Whether the address is a valid Ethereum address
     */
    public static isAddress(address: string): boolean {
        return addressUtils.isAddress(address);
    }
    /**
     * A unit amount is defined as the amount of a token above the specified decimal places (integer part).
     * E.g: If a currency has 18 decimal places, 1e18 or one quintillion of the currency is equivalent
     * to 1 unit.
     * @param   amount      The amount in baseUnits that you would like converted to units.
     * @param   decimals    The number of decimal places the unit amount has.
     * @return  The amount in units.
     */
    public static toUnitAmount(amount: BigNumber, decimals: number): BigNumber {
        const aUnit = new BigNumber(BASE_TEN).pow(decimals);
        const unit = amount.div(aUnit);
        return unit;
    }
    /**
     * A baseUnit is defined as the smallest denomination of a token. An amount expressed in baseUnits
     * is the amount expressed in the smallest denomination.
     * E.g: 1 unit of a token with 18 decimal places is expressed in baseUnits as 1000000000000000000
     * @param   amount      The amount of units that you would like converted to baseUnits.
     * @param   decimals    The number of decimal places the unit amount has.
     * @return  The amount in baseUnits.
     */
    public static toBaseUnitAmount(amount: BigNumber, decimals: number): BigNumber {
        const unit = new BigNumber(BASE_TEN).pow(decimals);
        const baseUnitAmount = amount.times(unit);
        const hasDecimals = baseUnitAmount.decimalPlaces() !== 0;
        if (hasDecimals) {
            throw new Error(`Invalid unit amount: ${amount.toString()} - Too many decimal places`);
        }
        return baseUnitAmount;
    }
    /**
     * Convert an Ether amount from ETH to Wei
     * @param ethAmount Amount of Ether to convert to wei
     * @returns Amount in wei
     */
    public static toWei(ethAmount: BigNumber): BigNumber {
        const ETH_DECIMALS = 18;
        const balanceWei = Web3Wrapper.toBaseUnitAmount(ethAmount, ETH_DECIMALS);
        return balanceWei;
    }
    /**
     * Instantiates a new Web3Wrapper.
     * @param   provider    The Web3 provider instance you would like the Web3Wrapper to use for interacting with
     *                      the backing Ethereum node.
     * @param   txDefaults  Override TxData defaults sent with RPC requests to the backing Ethereum node.
     * @return  An instance of the Web3Wrapper class.
     */
    constructor(provider: Provider, txDefaults?: Partial<TxData>) {
        if (_.isUndefined((provider as any).sendAsync)) {
            // Web3@1.0 provider doesn't support synchronous http requests,
            // so it only has an async `send` method, instead of a `send` and `sendAsync` in web3@0.x.x`
            // We re-assign the send method so that Web3@1.0 providers work with @0xproject/web3-wrapper
            (provider as any).sendAsync = (provider as any).send;
        }
        this.abiDecoder = new AbiDecoder([]);
        this._web3 = new Web3();
        this._web3.setProvider(provider);
        this._txDefaults = txDefaults || {};
        this._jsonRpcRequestId = 0;
    }
    /**
     * Get the contract defaults set to the Web3Wrapper instance
     * @return  TxData defaults (e.g gas, gasPrice, nonce, etc...)
     */
    public getContractDefaults(): Partial<TxData> {
        return this._txDefaults;
    }
    /**
     * Retrieve the Web3 provider
     * @return  Web3 provider instance
     */
    public getProvider(): Provider {
        return this._web3.currentProvider;
    }
    /**
     * Update the used Web3 provider
     * @param provider The new Web3 provider to be set
     */
    public setProvider(provider: Provider): void {
        this._web3.setProvider(provider);
    }
    /**
     * Check whether an address is available through the backing provider. This can be
     * useful if you want to know whether a user can sign messages or transactions from
     * a given Ethereum address.
     * @param senderAddress Address to check availability for
     * @returns Whether the address is available through the provider.
     */
    public async isSenderAddressAvailableAsync(senderAddress: string): Promise<boolean> {
        const addresses = await this.getAvailableAddressesAsync();
        const normalizedAddress = senderAddress.toLowerCase();
        return _.includes(addresses, normalizedAddress);
    }
    /**
     * Fetch the backing Ethereum node's version string (e.g `MetaMask/v4.2.0`)
     * @returns Ethereum node's version string
     */
    public async getNodeVersionAsync(): Promise<string> {
        const nodeVersion = await this._sendRawPayloadAsync<string>({ method: 'web3_clientVersion' });
        return nodeVersion;
    }
    /**
     * Fetches the networkId of the backing Ethereum node
     * @returns The network id
     */
    public async getNetworkIdAsync(): Promise<number> {
        const networkIdStr = await this._sendRawPayloadAsync<string>({ method: 'net_version' });
        const networkId = _.parseInt(networkIdStr);
        return networkId;
    }
    /**
     * Retrieves the transaction receipt for a given transaction hash
     * @param txHash Transaction hash
     * @returns The transaction receipt, including it's status (0: failed, 1: succeeded or undefined: not found)
     */
    public async getTransactionReceiptAsync(txHash: string): Promise<TransactionReceipt> {
        const transactionReceipt = await promisify<TransactionReceipt>(this._web3.eth.getTransactionReceipt)(txHash);
        if (!_.isNull(transactionReceipt)) {
            transactionReceipt.status = this._normalizeTxReceiptStatus(transactionReceipt.status);
        }
        return transactionReceipt;
    }
    /**
     * Retrieves an accounts Ether balance in wei
     * @param owner Account whose balance you wish to check
     * @returns Balance in wei
     */
    public async getBalanceInWeiAsync(owner: string): Promise<BigNumber> {
        let balanceInWei = await promisify<BigNumber>(this._web3.eth.getBalance)(owner);
        // Rewrap in a new BigNumber
        balanceInWei = new BigNumber(balanceInWei);
        return balanceInWei;
    }
    /**
     * Check if a contract exists at a given address
     * @param address Address to which to check
     * @returns Whether or not contract code was found at the supplied address
     */
    public async doesContractExistAtAddressAsync(address: string): Promise<boolean> {
        const code = await promisify<string>(this._web3.eth.getCode)(address);
        // Regex matches 0x0, 0x00, 0x in order to accommodate poorly implemented clients
        const isCodeEmpty = /^0x0{0,40}$/i.test(code);
        return !isCodeEmpty;
    }
    /**
     * Sign a message with a specific address's private key (`eth_sign`)
     * @param address Address of signer
     * @param message Message to sign
     * @returns Signature string (might be VRS or RSV depending on the Signer)
     */
    public async signMessageAsync(address: string, message: string): Promise<string> {
        const signData = await promisify<string>(this._web3.eth.sign)(address, message);
        return signData;
    }
    /**
     * Fetches the latest block number
     * @returns Block number
     */
    public async getBlockNumberAsync(): Promise<number> {
        const blockNumber = await promisify<number>(this._web3.eth.getBlockNumber)();
        return blockNumber;
    }
    /**
     * Fetch a specific Ethereum block
     * @param blockParam The block you wish to fetch (blockHash, blockNumber or blockLiteral)
     * @returns The requested block without transaction data
     */
    public async getBlockAsync(blockParam: string | BlockParam): Promise<BlockWithoutTransactionData> {
        const block = await promisify<BlockWithoutTransactionData>(this._web3.eth.getBlock)(blockParam);
        return block;
    }
    /**
     * Fetch a block's timestamp
     * @param blockParam The block you wish to fetch (blockHash, blockNumber or blockLiteral)
     * @returns The block's timestamp
     */
    public async getBlockTimestampAsync(blockParam: string | BlockParam): Promise<number> {
        const { timestamp } = await this.getBlockAsync(blockParam);
        return timestamp;
    }
    /**
     * Retrieve the user addresses available through the backing provider
     * @returns Available user addresses
     */
    public async getAvailableAddressesAsync(): Promise<string[]> {
        const addresses = await promisify<string[]>(this._web3.eth.getAccounts)();
        const normalizedAddresses = _.map(addresses, address => address.toLowerCase());
        return normalizedAddresses;
    }
    /**
     * Take a snapshot of the blockchain state on a TestRPC/Ganache local node
     * @returns The snapshot id. This can be used to revert to this snapshot
     */
    public async takeSnapshotAsync(): Promise<number> {
        const snapshotId = Number(await this._sendRawPayloadAsync<string>({ method: 'evm_snapshot', params: [] }));
        return snapshotId;
    }
    /**
     * Revert the blockchain state to a previous snapshot state on TestRPC/Ganache local node
     * @param snapshotId snapshot id to revert to
     * @returns Whether the revert was successful
     */
    public async revertSnapshotAsync(snapshotId: number): Promise<boolean> {
        const didRevert = await this._sendRawPayloadAsync<boolean>({ method: 'evm_revert', params: [snapshotId] });
        return didRevert;
    }
    /**
     * Mine a block on a TestRPC/Ganache local node
     */
    public async mineBlockAsync(): Promise<void> {
        await this._sendRawPayloadAsync<string>({ method: 'evm_mine', params: [] });
    }
    /**
     * Increase the next blocks timestamp on TestRPC/Ganache local node
     * @param timeDelta Amount of time to add in seconds
     */
    public async increaseTimeAsync(timeDelta: number): Promise<void> {
        await this._sendRawPayloadAsync<string>({ method: 'evm_increaseTime', params: [timeDelta] });
    }
    /**
     * Retrieve smart contract logs for a given filter
     * @param filter Parameters by which to filter which logs to retrieve
     * @returns The corresponding log entries
     */
    public async getLogsAsync(filter: FilterObject): Promise<LogEntry[]> {
        let fromBlock = filter.fromBlock;
        if (_.isNumber(fromBlock)) {
            fromBlock = this._web3.toHex(fromBlock);
        }
        let toBlock = filter.toBlock;
        if (_.isNumber(toBlock)) {
            toBlock = this._web3.toHex(toBlock);
        }
        const serializedFilter = {
            ...filter,
            fromBlock,
            toBlock,
        };
        const payload = {
            jsonrpc: '2.0',
            id: this._jsonRpcRequestId++,
            method: 'eth_getLogs',
            params: [serializedFilter],
        };
        const rawLogs = await this._sendRawPayloadAsync<RawLogEntry[]>(payload);
        const formattedLogs = _.map(rawLogs, this._formatLog.bind(this));
        return formattedLogs;
    }
    /**
     * Get a Web3 contract factory instance for a given ABI
     * @param abi Smart contract ABI
     * @returns Web3 contract factory which can create Web3 Contract instances from the supplied ABI
     */
    public getContractFromAbi(abi: ContractAbi): Web3.Contract<any> {
        const web3Contract = this._web3.eth.contract(abi);
        return web3Contract;
    }
    /**
     * Calculate the estimated gas cost for a given transaction
     * @param txData Transaction data
     * @returns Estimated gas cost
     */
    public async estimateGasAsync(txData: Partial<TxData>): Promise<number> {
        const gas = await promisify<number>(this._web3.eth.estimateGas)(txData);
        return gas;
    }
    /**
     * Call a smart contract method at a given block height
     * @param callData Call data
     * @param defaultBlock Block height at which to make the call. Defaults to `latest`
     * @returns The raw call result
     */
    public async callAsync(callData: CallData, defaultBlock?: BlockParam): Promise<string> {
        const rawCallResult = await promisify<string>(this._web3.eth.call)(callData, defaultBlock);
        return rawCallResult;
    }
    /**
     * Send a transaction
     * @param txData Transaction data
     * @returns Transaction hash
     */
    public async sendTransactionAsync(txData: TxData): Promise<string> {
        const txHash = await promisify<string>(this._web3.eth.sendTransaction)(txData);
        return txHash;
    }
    /**
     * Waits for a transaction to be mined and returns the transaction receipt.
     * Note that just because a transaction was mined does not mean it was
     * successful. You need to check the status code of the transaction receipt
     * to find out if it was successful, or use the helper method
     * awaitTransactionSuccessAsync.
     * @param   txHash            Transaction hash
     * @param   pollingIntervalMs How often (in ms) should we check if the transaction is mined.
     * @param   timeoutMs         How long (in ms) to poll for transaction mined until aborting.
     * @return  Transaction receipt with decoded log args.
     */
    public async awaitTransactionMinedAsync(
        txHash: string,
        pollingIntervalMs: number = 1000,
        timeoutMs?: number,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        let wasTimeoutExceeded = false;
        if (timeoutMs) {
            setTimeout(() => (wasTimeoutExceeded = true), timeoutMs);
        }

        const txReceiptPromise = new Promise(
            (resolve: (receipt: TransactionReceiptWithDecodedLogs) => void, reject) => {
                const intervalId = intervalUtils.setAsyncExcludingInterval(
                    async () => {
                        if (wasTimeoutExceeded) {
                            intervalUtils.clearAsyncExcludingInterval(intervalId);
                            return reject(Web3WrapperErrors.TransactionMiningTimeout);
                        }

                        const transactionReceipt = await this.getTransactionReceiptAsync(txHash);
                        if (!_.isNull(transactionReceipt)) {
                            intervalUtils.clearAsyncExcludingInterval(intervalId);
                            const logsWithDecodedArgs = _.map(
                                transactionReceipt.logs,
                                this.abiDecoder.tryToDecodeLogOrNoop.bind(this.abiDecoder),
                            );
                            const transactionReceiptWithDecodedLogArgs: TransactionReceiptWithDecodedLogs = {
                                ...transactionReceipt,
                                logs: logsWithDecodedArgs,
                            };
                            resolve(transactionReceiptWithDecodedLogArgs);
                        }
                    },
                    pollingIntervalMs,
                    (err: Error) => {
                        intervalUtils.clearAsyncExcludingInterval(intervalId);
                        reject(err);
                    },
                );
            },
        );
        const txReceipt = await txReceiptPromise;
        return txReceipt;
    }
    /**
     * Waits for a transaction to be mined and returns the transaction receipt.
     * Unlike awaitTransactionMinedAsync, it will throw if the receipt has a
     * status that is not equal to 1. A status of 0 or null indicates that the
     * transaction was mined, but failed. See:
     * https://github.com/ethereum/wiki/wiki/JavaScript-API#web3ethgettransactionreceipt
     * @param   txHash            Transaction hash
     * @param   pollingIntervalMs How often (in ms) should we check if the transaction is mined.
     * @param   timeoutMs         How long (in ms) to poll for transaction mined until aborting.
     * @return  Transaction receipt with decoded log args.
     */
    public async awaitTransactionSuccessAsync(
        txHash: string,
        pollingIntervalMs: number = 1000,
        timeoutMs?: number,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const receipt = await this.awaitTransactionMinedAsync(txHash, pollingIntervalMs, timeoutMs);
        if (receipt.status !== 1) {
            throw new Error(`Transaction failed: ${txHash}`);
        }
        return receipt;
    }
    private async _sendRawPayloadAsync<A>(payload: Partial<JSONRPCRequestPayload>): Promise<A> {
        const sendAsync = this._web3.currentProvider.sendAsync.bind(this._web3.currentProvider);
        const response = await promisify<JSONRPCResponsePayload>(sendAsync)(payload);
        const result = response.result;
        return result;
    }
    private _normalizeTxReceiptStatus(status: undefined | null | string | 0 | 1): null | 0 | 1 {
        // Transaction status might have four values
        // undefined - Testrpc and other old clients
        // null - New clients on old transactions
        // number - Parity
        // hex - Geth
        if (_.isString(status)) {
            return this._web3.toDecimal(status) as 0 | 1;
        } else if (_.isUndefined(status)) {
            return null;
        } else {
            return status;
        }
    }
    private _formatLog(rawLog: RawLogEntry): LogEntry {
        const formattedLog = {
            ...rawLog,
            logIndex: this._hexToDecimal(rawLog.logIndex),
            blockNumber: this._hexToDecimal(rawLog.blockNumber),
            transactionIndex: this._hexToDecimal(rawLog.transactionIndex),
        };
        return formattedLog;
    }
    private _hexToDecimal(hex: string | null): number | null {
        if (_.isNull(hex)) {
            return null;
        }
        const decimal = this._web3.toDecimal(hex);
        return decimal;
    }
}
