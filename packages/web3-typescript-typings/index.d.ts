declare module 'web3' {

    import * as BigNumber from 'bignumber.js';

    class Web3 {
        public static providers: typeof providers;

        public version: {
            getNetwork(cd: (err: Error, networkId: string) => void): void;
            getNode(cd: (err: Error, nodeVersion: string) => void): void;
        };

        public eth: {
            coinbase: string;
            defaultAccount: string;
            compile: {
                solidity(sourceString: string, cb?: (err: any, result: any) => void): object,
            }
            sign(address: string, message: string, callback: (err: Error, signData: string) => void): string;
            getBlock(blockHash: string, callback: (err: Error, blockObj: any) => void): BigNumber.BigNumber;
            getBlockNumber(callback: (err: Error, blockNumber: number) => void): void;
            contract<A>(abi: Web3.ContractAbi): Web3.Contract<A>;
            getBalance(addressHexString: string,
                callback?: (err: any, result: BigNumber.BigNumber) => void): BigNumber.BigNumber;
            getCode(addressHexString: string,
                callback?: (err: any, code: string) => void): string;
            filter(value: string|Web3.FilterObject): Web3.FilterResult;
            getAccounts(callback: (err: Error, value: any) => void): string[];
            sendTransaction(txData: any, callback: (err: Error, value: any) => void): void;
            getTransactionReceipt(txHash: string, callback: (err: Error, receipt: any) => void): void;
        };

        public setProvider(provider: Web3.Provider): void;
        public currentProvider: Web3.Provider;
        public fromWei(amount: number|BigNumber.BigNumber, unit: string): BigNumber.BigNumber;
        public toWei(amount: number|BigNumber.BigNumber, unit: string): BigNumber.BigNumber;
        public isAddress(address: string): boolean;
    }

    namespace providers {
        class HttpProvider implements Web3.Provider {
            constructor(url?: string);
        }
    }

    namespace Web3 {
        type ContractAbi = Array<AbiDefinition>;

        type AbiDefinition = FunctionDescription | EventDescription;

        interface FunctionDescription {
            type: "function" | "constructor" | "fallback";
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
            type: "event";
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
            event: string
            address: string
            args: A
        }

        interface FilterResult {
            get(callback: () => void): void;
            watch<A>(callback: (error: string|null, result: SolidityEvent<A>) => void): void;
            stopWatching(callback: () => void): void;
        }

        interface Provider {}
    }
    /* tslint:disable */
    export = Web3;
    /* tslint:enable */
}
