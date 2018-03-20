import { RawLogEntry, TransactionReceipt, TxData } from '@0xproject/types';
import { BigNumber, promisify } from '@0xproject/utils';
import * as _ from 'lodash';
import * as Web3 from 'web3';

/**
 * A wrapper around the Web3.js 0.x library that provides a consistent, clean promise-based interface.
 */
export class Web3Wrapper {
    /**
     * Flag to check if this instance is of type Web3Wrapper
     */
    public isZeroExWeb3Wrapper = true;
    private _web3: Web3;
    private _defaults: Partial<TxData>;
    private _jsonRpcRequestId: number;
    /**
     * Instantiates a new Web3Wrapper.
     * @param   provider    The Web3 provider instance you would like the Web3Wrapper to use for interacting with
     *                      the backing Ethereum node.
     * @param   defaults    Override TxData defaults sent with RPC requests to the backing Ethereum node.
     * @return  An instance of the Web3Wrapper class.
     */
    constructor(provider: Web3.Provider, defaults?: Partial<TxData>) {
        if (_.isUndefined((provider as any).sendAsync)) {
            // Web3@1.0 provider doesn't support synchronous http requests,
            // so it only has an async `send` method, instead of a `send` and `sendAsync` in web3@0.x.x`
            // We re-assign the send method so that Web3@1.0 providers work with @0xproject/web3-wrapper
            (provider as any).sendAsync = (provider as any).send;
        }
        this._web3 = new Web3();
        this._web3.setProvider(provider);
        this._defaults = defaults || {};
        this._jsonRpcRequestId = 0;
    }
    /**
     * Get the contract defaults set to the Web3Wrapper instance
     * @return  TxData defaults (e.g gas, gasPrice, nonce, etc...)
     */
    public getContractDefaults(): Partial<TxData> {
        return this._defaults;
    }
    /**
     * Retrieve the Web3 provider
     * @return  Web3 provider instance
     */
    public getProvider(): Web3.Provider {
        return this._web3.currentProvider;
    }
    /**
     * Update the used Web3 provider
     * @param provider The new Web3 provider to be set
     */
    public setProvider(provider: Web3.Provider) {
        this._web3.setProvider(provider);
    }
    /**
     * Check if an address is a valid Ethereum address
     * @param address Address to check
     * @returns Whether the address is a valid Ethereum address
     */
    public isAddress(address: string): boolean {
        return this._web3.isAddress(address);
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
        const nodeVersion = await promisify<string>(this._web3.version.getNode)();
        return nodeVersion;
    }
    /**
     * Fetches the networkId of the backing Ethereum node
     * @returns The network id
     */
    public async getNetworkIdAsync(): Promise<number> {
        const networkIdStr = await promisify<string>(this._web3.version.getNetwork)();
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
     * Convert an Ether amount from ETH to Wei
     * @param ethAmount Amount of Ether to convert to wei
     * @returns Amount in wei
     */
    public toWei(ethAmount: BigNumber): BigNumber {
        const balanceWei = this._web3.toWei(ethAmount, 'ether');
        return balanceWei;
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
        const codeIsEmpty = /^0x0{0,40}$/i.test(code);
        return !codeIsEmpty;
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
    public async getBlockAsync(blockParam: string | Web3.BlockParam): Promise<Web3.BlockWithoutTransactionData> {
        const block = await promisify<Web3.BlockWithoutTransactionData>(this._web3.eth.getBlock)(blockParam);
        return block;
    }
    /**
     * Fetch a block's timestamp
     * @param blockParam The block you wish to fetch (blockHash, blockNumber or blockLiteral)
     * @returns The block's timestamp
     */
    public async getBlockTimestampAsync(blockParam: string | Web3.BlockParam): Promise<number> {
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
    public async getLogsAsync(filter: Web3.FilterObject): Promise<Web3.LogEntry[]> {
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
    public getContractFromAbi(abi: Web3.ContractAbi): Web3.Contract<any> {
        const web3Contract = this._web3.eth.contract(abi);
        return web3Contract;
    }
    /**
     * Calculate the estimated gas cost for a given transaction
     * @param txData Transaction data
     * @returns Estimated gas cost
     */
    public async estimateGasAsync(txData: Partial<Web3.TxData>): Promise<number> {
        const gas = await promisify<number>(this._web3.eth.estimateGas)(txData);
        return gas;
    }
    /**
     * Call a smart contract method at a given block height
     * @param callData Call data
     * @param defaultBlock Block height at which to make the call. Defaults to `latest`
     * @returns The raw call result
     */
    public async callAsync(callData: Web3.CallData, defaultBlock?: Web3.BlockParam): Promise<string> {
        const rawCallResult = await promisify<string>(this._web3.eth.call)(callData, defaultBlock);
        return rawCallResult;
    }
    /**
     * Send a transaction
     * @param txData Transaction data
     * @returns Transaction hash
     */
    public async sendTransactionAsync(txData: Web3.TxData): Promise<string> {
        const txHash = await promisify<string>(this._web3.eth.sendTransaction)(txData);
        return txHash;
    }
    private async _sendRawPayloadAsync<A>(payload: Partial<Web3.JSONRPCRequestPayload>): Promise<A> {
        const sendAsync = this._web3.currentProvider.sendAsync.bind(this._web3.currentProvider);
        const response = await promisify<Web3.JSONRPCResponsePayload>(sendAsync)(payload);
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
    private _formatLog(rawLog: RawLogEntry): Web3.LogEntry {
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
