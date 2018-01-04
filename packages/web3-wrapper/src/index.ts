import { TransactionReceipt, TxData } from '@0xproject/types';
import { BigNumber, promisify } from '@0xproject/utils';
import * as _ from 'lodash';
import * as Web3 from 'web3';

interface RawLogEntry {
    logIndex: string | null;
    transactionIndex: string | null;
    transactionHash: string;
    blockHash: string | null;
    blockNumber: string | null;
    address: string;
    data: string;
    topics: string[];
}

export class Web3Wrapper {
    private _web3: Web3;
    private _defaults: Partial<TxData>;
    private _jsonRpcRequestId: number;
    constructor(provider: Web3.Provider, defaults?: Partial<TxData>) {
        if (_.isUndefined((provider as any).sendAsync)) {
            // Web3@1.0 provider doesn't support synchronous http requests,
            // so it only has an async `send` method, instead of a `send` and `sendAsync` in web3@0.x.x`
            // We re-assign the send method so that Web3@1.0 providers work with 0x.js
            (provider as any).sendAsync = (provider as any).send;
        }
        this._web3 = new Web3();
        this._web3.setProvider(provider);
        this._defaults = defaults || {};
        this._jsonRpcRequestId = 0;
    }
    public getContractDefaults(): Partial<TxData> {
        return this._defaults;
    }
    public setProvider(provider: Web3.Provider) {
        this._web3.setProvider(provider);
    }
    public isAddress(address: string): boolean {
        return this._web3.isAddress(address);
    }
    public async isSenderAddressAvailableAsync(senderAddress: string): Promise<boolean> {
        const addresses = await this.getAvailableAddressesAsync();
        return _.includes(addresses, senderAddress);
    }
    public async getNodeVersionAsync(): Promise<string> {
        const nodeVersion = await promisify<string>(this._web3.version.getNode)();
        return nodeVersion;
    }
    public async getNetworkIdAsync(): Promise<number> {
        const networkIdStr = await promisify<string>(this._web3.version.getNetwork)();
        const networkId = _.parseInt(networkIdStr);
        return networkId;
    }
    public async getTransactionReceiptAsync(txHash: string): Promise<TransactionReceipt> {
        const transactionReceipt = await promisify<TransactionReceipt>(this._web3.eth.getTransactionReceipt)(txHash);
        if (!_.isNull(transactionReceipt)) {
            transactionReceipt.status = this._normalizeTxReceiptStatus(transactionReceipt.status);
        }
        return transactionReceipt;
    }
    public getCurrentProvider(): Web3.Provider {
        return this._web3.currentProvider;
    }
    public toWei(ethAmount: BigNumber): BigNumber {
        const balanceWei = this._web3.toWei(ethAmount, 'ether');
        return balanceWei;
    }
    public async getBalanceInWeiAsync(owner: string): Promise<BigNumber> {
        let balanceInWei = await promisify<BigNumber>(this._web3.eth.getBalance)(owner);
        // Rewrap in a new BigNumber
        balanceInWei = new BigNumber(balanceInWei);
        return balanceInWei;
    }
    public async doesContractExistAtAddressAsync(address: string): Promise<boolean> {
        const code = await promisify<string>(this._web3.eth.getCode)(address);
        // Regex matches 0x0, 0x00, 0x in order to accommodate poorly implemented clients
        const codeIsEmpty = /^0x0{0,40}$/i.test(code);
        return !codeIsEmpty;
    }
    public async signTransactionAsync(address: string, message: string): Promise<string> {
        const signData = await promisify<string>(this._web3.eth.sign)(address, message);
        return signData;
    }
    public async getBlockNumberAsync(): Promise<number> {
        const blockNumber = await promisify<number>(this._web3.eth.getBlockNumber)();
        return blockNumber;
    }
    public async getBlockAsync(blockParam: string | Web3.BlockParam): Promise<Web3.BlockWithoutTransactionData> {
        const block = await promisify<Web3.BlockWithoutTransactionData>(this._web3.eth.getBlock)(blockParam);
        return block;
    }
    public async getBlockTimestampAsync(blockParam: string | Web3.BlockParam): Promise<number> {
        const { timestamp } = await this.getBlockAsync(blockParam);
        return timestamp;
    }
    public async getAvailableAddressesAsync(): Promise<string[]> {
        const addresses = await promisify<string[]>(this._web3.eth.getAccounts)();
        return addresses;
    }
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
    public getContractFromAbi(abi: Web3.ContractAbi): Web3.Contract<any> {
        const web3Contract = this._web3.eth.contract(abi);
        return web3Contract;
    }
    public getContractInstance(abi: Web3.ContractAbi, address: string): Web3.ContractInstance {
        const web3ContractInstance = this.getContractFromAbi(abi).at(address);
        return web3ContractInstance;
    }
    public async estimateGasAsync(data: string): Promise<number> {
        const gas = await promisify<number>(this._web3.eth.estimateGas)({ data });
        return gas;
    }
    private async _sendRawPayloadAsync<A>(payload: Web3.JSONRPCRequestPayload): Promise<A> {
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
