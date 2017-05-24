declare module 'web3' {

    import * as BigNumber from 'bignumber.js';

    class Web3 {
        public static providers: typeof providers;

        public version: {
            getNetwork(): number;
            getNode(): string;
        };

        public eth: {
            coinbase: string;
            defaultAccount: string;
            compile: {
                solidity(sourceString: string, cb?: (err: any, result: any) => void): object,
            }
            sign(address: string, message: string, callback: (err: Error, signData: string) => void): string;
            getBlock(blockHash: string, callback: (err: Error, blockObj: any) => void): BigNumber.BigNumber;
            contract(abi: AbiDefinition[]): Contract;
            getBalance(addressHexString: string,
                callback?: (err: any, result: BigNumber.BigNumber) => void): BigNumber.BigNumber;
            getCode(addressHexString: string,
                callback?: (err: any, code: string) => void): string;
            filter(value: string|FilterObject): FilterResult;
            getAccounts(callback: (err: Error, value: any) => void): string[];
            sendTransaction(txData: any, callback: (err: Error, value: any) => void): void;
        };

        public setProvider(provider: providers.Provider): void;
        public currentProvider(): any;
        public fromWei(amount: BigNumber.BigNumber, unit: string): BigNumber.BigNumber;
        public isAddress(address: string): boolean;
    }

    interface AbiIOParameter {
        name: string;
        type: string;
    }

    interface AbiDefinition {
        constants: boolean;
        inputs: AbiIOParameter[];
        name: string;
        outputs: AbiIOParameter[];
        type: string;
    }

    interface Contract {}

    interface FilterObject {
        fromBlock: number|string;
        toBlock: number|string;
        address: string;
        topics: string[];
    }

    interface FilterResult {
        get(callback: () => void): void;
        watch(callback: () => void): void;
        stopWatching(): void;
    }

    namespace providers {
        interface Provider {}

        class HttpProvider implements Provider {
            constructor(url?: string);
        }
    }

    namespace Web3 {} // Empty module so the class is exportable as a module
    export = Web3;
}
