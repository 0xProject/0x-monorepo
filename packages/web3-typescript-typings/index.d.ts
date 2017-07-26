declare module 'web3' {

    import * as BigNumber from 'bignumber.js';

    type MixedData = string|number|object|Array<any>|BigNumber.BigNumber;

    class Web3 {
        public static providers: typeof providers;

        public constructor(provider?: Web3.Provider);

        public eth: Web3.EthApi;
        public personal: Web3.PersonalApi | undefined;
        public version: Web3.VersionApi;
        public net: Web3.NetApi;

        public isConnected(): boolean;
        public setProvider(provider: Web3.Provider): void;
        public currentProvider: Web3.Provider;
        public reset(keepIsSyncing: boolean): void;
        public sha3(data: string, options?: Web3.Sha3Options): string;
        public toHex(data: MixedData): string;
        public toAscii(hex: string): string;
        public fromAscii(ascii: string, padding?: number): string;
        public toDecimal(hex: string): number;
        public fromDecimal(number: number|string): string;
        public fromWei(number: number|string, unit: Web3.Unit): string;
        public fromWei(number: BigNumber.BigNumber, unit: Web3.Unit): BigNumber.BigNumber;
        public toWei(amount: number|string, unit: Web3.Unit): string;
        public toWei(amount: BigNumber.BigNumber, unit: Web3.Unit): BigNumber.BigNumber;
        public toBigNumber(number: number|string): BigNumber.BigNumber;
        public isAddress(address: string): boolean;
        public sha3(value: string, options?: Web3.Sha3Options): string;
    }

    namespace providers {
        class HttpProvider implements Web3.Provider {
            constructor(url?: string);
        }
    }

    namespace Web3 {
        type ContractAbi = Array<AbiDefinition>;

        type AbiDefinition = FunctionDescription|EventDescription;

        interface FunctionDescription {
            type: 'function'|'constructor'|'fallback';
            name?: string;
            inputs: Array<FunctionParameter>;
            outputs?: Array<FunctionParameter>;
            constant?: boolean;
            payable?: boolean;
        }

        interface EventParameter {
            name: string;
            type: string;
            indexed: boolean;
        }

        interface EventDescription {
            type: 'event';
            name: string;
            inputs: Array<EventParameter>;
            anonymous: boolean;
        }

        interface FunctionParameter {
            name: string;
            type: string;
        }

        interface Contract<A> {
            at(address: string): A;
        }

        interface FilterObject {
            fromBlock: number|string;
            toBlock: number|string;
            address: string;
            topics: string[];
        }

        interface SolidityEvent<A> {
            event: string;
            address: string;
            args: A;
        }

        interface FilterResult {
            get(callback: () => void): void;
            watch<A>(callback: (error: string|null, result: SolidityEvent<A>) => void): void;
            stopWatching(callback: () => void): void;
        }

        interface Provider {}

        interface Sha3Options {
            encoding: 'hex';
        }

        interface EthApi {
            coinbase: string;
            mining: boolean;
            getMining(cd: (err: Error, mining: boolean) => void): void;
            hashrate: number;
            getHashrate(cd: (err: Error, hashrate: number) => void): void;
            gasPrice: BigNumber.BigNumber;
            getGasPrice(cd: (err: Error, gasPrice: BigNumber.BigNumber) => void): void;
            accounts: Array<string>;
            getAccounts(cd: (err: Error, accounts: Array<string>) => void): void;
            blockNumber: number;
            getBlockNumber(callback: (err: Error, blockNumber: number) => void): void;
            defaultAccount: string;
            defaultBlock: Web3.BlockParam;
            syncing: Web3.SyncingResult;
            getSyncing(cd: (err: Error, syncing: Web3.SyncingResult) => void): void;
            isSyncing(cb: (err: Error, isSyncing: boolean, syncingState: Web3.SyncingState) => void): Web3.IsSyncing;
            compile: {
                solidity(sourceString: string, cb?: (err: any, result: any) => void): object,
            }

            getBlock(hashStringOrBlockNumber: string|Web3.BlockParam): Web3.BlockWithoutTransactionData;
            getBlock(hashStringOrBlockNumber: string|Web3.BlockParam,
                     callback: (err: Error, blockObj: Web3.BlockWithoutTransactionData) => void): void;
            getBlock(hashStringOrBlockNumber: string|Web3.BlockParam,
                     returnTransactionObjects: true): Web3.BlockWithTransactionData;
            getBlock(hashStringOrBlockNumber: string|Web3.BlockParam, returnTransactionObjects: true,
                     callback: (err: Error, blockObj: Web3.BlockWithTransactionData) => void): void;

            getBlockTransactionCount(hashStringOrBlockNumber: string|Web3.BlockParam): number;
            getBlockTransactionCount(hashStringOrBlockNumber: string|Web3.BlockParam,
                                     callback: (err: Error, blockTransactionCount: number) => void): void;

            // TODO returnTransactionObjects
            getUncle(hashStringOrBlockNumber: string|Web3.BlockParam, uncleNumber: number): Web3.BlockWithoutTransactionData;
            getUncle(hashStringOrBlockNumber: string|Web3.BlockParam, uncleNumber: number,
                     callback: (err: Error, uncle: Web3.BlockWithoutTransactionData) => void): void;

            getTransaction(transactionHash: string): Web3.Transaction;
            getTransaction(transactionHash: string,
                           callback: (err: Error, transaction: Web3.Transaction) => void): void;

            getTransactionFromBlock(hashStringOrBlockNumber: string|Web3.BlockParam,
                    indexNumber: number): Web3.Transaction;
            getTransactionFromBlock(hashStringOrBlockNumber: string|Web3.BlockParam, indexNumber: number,
                    callback: (err: Error, transaction: Web3.Transaction) => void): void;

            contract(abi: Web3.AbiDefinition[]): Web3.Contract<any>;

            // TODO block param
            getBalance(addressHexString: string): BigNumber.BigNumber;
            getBalance(addressHexString: string, callback: (err: any, result: BigNumber.BigNumber) => void): void;

            // TODO block param
            getStorageAt(address: string, position: number): string;
            getStorageAt(address: string, position: number, callback: (err: any, storage: string) => void): void;

            // TODO block param
            getCode(addressHexString: string): string;
            getCode(addressHexString: string, callback: (err: any, code: string) => void): void;

            filter(value: string|Web3.FilterObject): Web3.FilterResult;

            sendTransaction(txData: Web3.TxData): string;
            sendTransaction(txData: Web3.TxData, callback: (err: Error, value: string) => void): void;

            sendRawTransaction(rawTxData: string): string;
            sendRawTransaction(rawTxData: string, callback: (err: Error, value: string) => void): void;

            sign(address: string, data: string): string;
            sign(address: string, data: string, callback: (err: Error, signature: string) => void): void;

            getTransactionReceipt(txHash: string): Web3.TransactionReceipt;
            getTransactionReceipt(txHash: string,
                                  callback: (err: Error, receipt: Web3.TransactionReceipt) => void): void;

            // TODO block param
            call(callData: Web3.CallData): string;
            call(callData: Web3.CallData, callback: (err: Error, result: string) => void): void;

            estimateGas(callData: Web3.CallData): number;
            estimateGas(callData: Web3.CallData, callback: (err: Error, gas: number) => void): void;

            // TODO defaultBlock
            getTransactionCount(address: string): number;
            getTransactionCount(address: string, callback: (err: Error, count: number) => void): void;
        }

        interface VersionApi {
            api: string;
            network: string;
            getNetwork(cd: (err: Error, networkId: string) => void): void;
            node: string;
            getNode(cd: (err: Error, nodeVersion: string) => void): void;
            ethereum: string;
            getEthereum(cd: (err: Error, ethereum: string) => void): void;
            whisper: string;
            getWhisper(cd: (err: Error, whisper: string) => void): void;
        }

        interface PersonalApi {
          listAccounts: string[] | undefined;
          newAccount(password?: string): string;
          unlockAccount(address: string, password?: string, duration?: number): boolean;
          lockAccount(address: string): boolean;
          sign(message: string, account: string, password: string): string;
        }

        interface NetApi {
            listening: boolean;
            getListening(cd: (err: Error, listening: boolean) => void): void;
            peerCount: boolean;
            getPeerCount(cd: (err: Error, peerCount: number) => void): void;
        }

        type BlockParam = number|'earliest'|'latest'|'pending';

        type Unit = 'kwei'|'ada'|'mwei'|'babbage'|'gwei'|'shannon'|'szabo'|'finney'|
                    'ether'|'kether'|'grand'|'einstein'|'mether'|'gether'|'tether';

        interface SyncingState {
            startingBlock: number;
            currentBlock: number;
            highestBlock: number;
        }
        type SyncingResult = false|SyncingState;

        interface IsSyncing {
            addCallback(cb: (err: Error, isSyncing: boolean, syncingState: SyncingState) => void): void;
            stopWatching(): void;
        }

        interface AbstractBlock {
            number: number|null;
            hash: string|null;
            parentHash: string;
            nonce: string|null;
            sha3Uncles: string;
            logsBloom: string|null;
            transactionsRoot: string;
            stateRoot: string;
            miner: string;
            difficulty: BigNumber.BigNumber;
            totalDifficulty: BigNumber.BigNumber;
            extraData: string;
            size: number;
            gasLimit: number;
            gasUser: number;
            timestamp: number;
            uncles: Array<string>;
        }
        interface BlockWithoutTransactionData extends AbstractBlock {
            transactions: Array<string>;
        }
        interface BlockWithTransactionData extends AbstractBlock {
            transactions: Array<Transaction>;
        }

        interface Transaction {
            hash: string;
            nonce: number;
            blockHash: string|null;
            blockNumber: number|null;
            transactionIndex: number|null;
            from: string;
            to: string|null;
            value: BigNumber.BigNumber;
            gasPrice: BigNumber.BigNumber;
            gas: number;
            input: string;
        }

        interface CallTxDataBase {
            to?: string;
            value?: number|string|BigNumber.BigNumber;
            gas?: number|string|BigNumber.BigNumber;
            gasPrice?: number|string|BigNumber.BigNumber;
            data?: string;
            nonce?: number;
        }

        interface TxData extends CallTxDataBase {
            from: string;
        }

        interface CallData extends CallTxDataBase {
            from?: string;
        }

        interface TransactionReceipt {
            blockHash: string;
            blockNumber: number;
            transactionHash: string;
            transactionIndex: number;
            from: string;
            to: string;
            cumulativeGasUsed: number;
            gasUsed: number;
            contractAddress: string|null;
            logs: Array<LogEntry>;
        }

        interface LogEntry {
            logIndex: number|null;
            transactionIndex: number;
            transactionHash: string;
            blockHash: string|null;
            blockNumber: number|null;
            address: string;
            data: string;
            topics: string[];
        }
    }
    /* tslint:disable */
    export = Web3;
    /* tslint:enable */
}
