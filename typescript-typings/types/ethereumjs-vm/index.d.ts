declare module 'ethereumjs-vm' {
    import BN = require('bn.js');
    type Common = any; // from ethereumjs-common
    type Account = any; // from ethereumjs-account
    type Blockchain = any; // from ethereumjs-blockchain

    export default class VM {
        opts: VmOpts;
        stateManager: StateManager;
        constructor(opts: VmOpts);
        runCall(opts: RunCallOpts): Promise<EVMResult>;
    }

    interface VmOpts {
        chain?: string;
        hardfork?: string;
        stateManager?: StateManager;
        state?: any;
        blockchain?: Blockchain;
        activatePrecompiles?: boolean;
        allowUnlimitedContractSize?: boolean;
        common?: Common;
    }

    interface RunCallOpts {
        block?: any;
        gasPrice?: Buffer;
        origin?: Buffer;
        caller?: Buffer;
        gasLimit?: Buffer;
        to?: Buffer;
        value?: Buffer;
        data?: Buffer;
        code?: Buffer;
        depth?: number;
        compiled?: boolean;
        static?: boolean;
        salt?: Buffer;
        selfdestruct?: { [k: string]: boolean };
        delegatecall?: boolean;
    }

    interface EVMResult {
        gasUsed: BN;
        createdAddress?: Buffer;
        execResult: ExecResult;
    }

    interface ExecResult {
        runState?: RunState;
        exceptionError?: VmError;
        gas?: BN;
        gasUsed: BN;
        returnValue: Buffer;
        logs?: any[];
        gasRefund?: BN;
        selfdestruct?: { [k: string]: Buffer };
    }
    interface RunState {
        programCounter: number;
        opCode: number;
        memory: Memory;
        memoryWordCount: BN;
        highestMemCost: BN;
        stack: Stack;
        code: Buffer;
        validJumps: number[];
        _common: Common;
        stateManager: StateManager;
        eei: EEI;
    }

    class Memory {
        _store: number[];
        constructor();
        extend(offset: number, size: number): void;
        write(offset: number, size: number, value: Buffer): void;
        read(offset: number, size: number): Buffer;
    }

    class Stack {
        _store: BN[];
        constructor();
        length(): number;
        push(value: BN): void;
        pop(): BN;
        popN(num: number): BN[];
        swap(position: number): void;
        dup(position: number): void;
    }

    class StateManager {
        _common: Common;
        _trie: any;
        _storageTries: any;
        _cache: Cache;
        _touched: Set<string>;
        _touchedStack: Set<string>[];
        _checkpointCount: number;
        _originalStorageCache: Map<string, Map<string, Buffer>>;

        constructor(opts: StateManagerOpts);
        copy(): StateManager;
        getAccount(address: Buffer, cb: any): void;
        putAccount(address: Buffer, account: Account, cb: any): void;
        putContractCode(address: Buffer, value: Buffer, cb: any): void;
        getContractCode(address: Buffer, cb: any): void;
        _lookupStorageTrie(address: Buffer, cb: any): void;
        _getStorageTrie(address: Buffer, cb: any): void;
        getContractStorage(address: Buffer, key: Buffer, cb: any): void;
        getOriginalContractStorage(address: Buffer, key: Buffer, cb: any): void;
        _modifyContractStorage(address: Buffer, modifyTrie: any, cb: any): void;
        putContractStorage(address: Buffer, key: Buffer, value: Buffer, cb: any): void;
        clearContractStorage(address: Buffer, cb: any): void;
        checkpoint(cb: any): void;
        commit(cb: any): void;
        revert(cb: any): void;
        getStateRoot(cb: any): void;
        setStateRoot(stateRoot: Buffer, cb: any): void;
        dumpStorage(address: Buffer, cb: any): void;
        hasGenesisState(cb: any): void;
        generateCanonicalGenesis(cb: any): void;
        generateGenesis(initState: any, cb: any): void;
        accountIsEmpty(address: Buffer, cb: any): void;
        cleanupTouchedAccounts(cb: any): void;
        _clearOriginalStorageCache(): void;
    }

    class Cache {
        _cache: any;
        _checkpoints: any[];
        _trie: any;
        constructor(trie: any);
        put(key: Buffer, val: Account, fromTrie: boolean): void;
        get(key: Buffer): Account;
        lookup(key: Buffer): Account | undefined;
        _lookupAccount(address: Buffer, cb: any): void;
        getOrLoad(key: Buffer, cb: any): void;
        warm(addresses: string[], cb: any): void;
        flush(cb: any): void;
        checkpoint(): void;
        revert(): void;
        commit(): void;
        clear(): void;
        del(key: Buffer): void;
        _update(key: Buffer, val: Account, modified: boolean, deleted: boolean): void;
    }

    interface StateManagerOpts {
        common?: Common;
        trie?: any;
    }

    class EEI {
        _env: Env;
        _result: RunResult;
        _state: PStateManager;
        _evm: EVM;
        _lastReturned: Buffer;
        _common: Common;
        _gasLeft: BN;
        constructor(env: Env, state: PStateManager, evm: EVM, common: Common, gasLeft: BN);
        useGas(amount: BN): void;
        refundGas(amount: BN): void;
        getAddress(): Buffer;
        getExternalBalance(address: Buffer): Promise<BN>;
        getSelfBalance(): BN;
        getCaller(): BN;
        getCallValue(): BN;
        getCallData(): Buffer;
        getCallDataSize(): BN;
        getCodeSize(): BN;
        getCode(): Buffer;
        isStatic(): boolean;
        getExternalCodeSize(address: BN): Promise<BN>;
        getExternalCode(address: BN | Buffer): Promise<Buffer>;
        getReturnDataSize(): BN;
        getReturnData(): Buffer;
        getTxGasPrice(): BN;
        getTxOrigin(): BN;
        getBlockNumber(): BN;
        getBlockCoinbase(): BN;
        getBlockTimestamp(): BN;
        getBlockDifficulty(): BN;
        getBlockGasLimit(): BN;
        getChainId(): BN;
        getBlockHash(num: BN): Promise<BN>;
        storageStore(key: Buffer, value: Buffer): Promise<void>;
        storageLoad(key: Buffer): Promise<Buffer>;
        getGasLeft(): BN;
        finish(returnData: Buffer): void;
        revert(returnData: Buffer): void;
        selfDestruct(toAddress: Buffer): Promise<void>;
        _selfDestruct(toAddress: Buffer): Promise<void>;
        log(data: Buffer, numberOfTopics: number, topics: Buffer[]): void;
        call(gasLimit: BN, address: Buffer, value: BN, data: Buffer): Promise<BN>;
        callCode(gasLimit: BN, address: Buffer, value: BN, data: Buffer): Promise<BN>;
        callStatic(gasLimit: BN, address: Buffer, value: BN, data: Buffer): Promise<BN>;
        callDelegate(gasLimit: BN, address: Buffer, value: BN, data: Buffer): Promise<BN>;
        _baseCall(msg: Message): Promise<BN>;
        create(gasLimit: BN, value: BN, data: Buffer, salt: Buffer | null): Promise<BN>;
        create2(gasLimit: BN, value: BN, data: Buffer, salt: Buffer): Promise<BN>;
        isAccountEmpty(address: Buffer): Promise<boolean>;
        private _getReturnCode(results: EVMResult): any;
    }

    interface Env {
        blockchain: Blockchain;
        address: Buffer;
        caller: Buffer;
        callData: Buffer;
        callValue: BN;
        code: Buffer;
        isStatic: boolean;
        depth: number;
        gasPrice: Buffer;
        origin: Buffer;
        block: any;
        contract: Account;
    }

    interface RunResult {
        logs: any;
        returnValue?: Buffer;
        gasRefund: BN;
        selfdestruct: { [k: string]: Buffer };
    }

    export class PStateManager {
        _wrapped: StateManager;
        constructor(wrapped: StateManager);
        copy(): PStateManager;
        getAccount(addr: Buffer): Promise<Account>;
        putAccount(addr: Buffer, account: Account): Promise<void>;
        putContractCode(addr: Buffer, code: Buffer): Promise<void>;
        getContractCode(addr: Buffer): Promise<Buffer>;
        getContractStorage(addr: Buffer, key: Buffer): Promise<any>;
        getOriginalContractStorage(addr: Buffer, key: Buffer): Promise<any>;
        putContractStorage(addr: Buffer, key: Buffer, value: Buffer): Promise<void>;
        clearContractStorage(addr: Buffer): Promise<void>;
        checkpoint(): Promise<void>;
        commit(): Promise<void>;
        revert(): Promise<void>;
        getStateRoot(): Promise<Buffer>;
        setStateRoot(root: Buffer): Promise<void>;
        dumpStorage(address: Buffer): Promise<StorageDump>;
        hasGenesisState(): Promise<boolean>;
        generateCanonicalGenesis(): Promise<void>;
        generateGenesis(initState: any): Promise<void>;
        accountIsEmpty(address: Buffer): Promise<boolean>;
        cleanupTouchedAccounts(): Promise<void>;
    }

    interface StorageDump {
        [key: string]: string;
    }

    class EVM {
        _vm: any;
        _state: PStateManager;
        _tx: TxContext;
        _block: any;
        constructor(vm: any, txContext: TxContext, block: any);
        executeMessage(message: Message): Promise<EVMResult>;
        _executeCall(message: Message): Promise<EVMResult>;
        _executeCreate(message: Message): Promise<EVMResult>;
        runInterpreter(message: Message, opts: InterpreterOpts): Promise<ExecResult>;
        getPrecompile(address: Buffer): PrecompileFunc;
        runPrecompile(code: PrecompileFunc, data: Buffer, gasLimit: BN): ExecResult;
        _loadCode(message: Message): Promise<void>;
        _generateAddress(message: Message): Promise<Buffer>;
        _reduceSenderBalance(account: Account, message: Message): Promise<void>;
        _addToBalance(toAccount: Account, message: Message): Promise<void>;
        _touchAccount(address: Buffer): Promise<void>;
    }

    class TxContext {
        gasPrice: Buffer;
        origin: Buffer;
        constructor(gasPrice: Buffer, origin: Buffer);
    }

    class Message {
        to: Buffer;
        value: BN;
        caller: Buffer;
        gasLimit: BN;
        data: Buffer;
        depth: number;
        code: Buffer | PrecompileFunc;
        _codeAddress: Buffer;
        isStatic: boolean;
        isCompiled: boolean;
        salt: Buffer;
        selfdestruct: any;
        delegatecall: boolean;
        constructor(opts: any);
        codeAddress(): Buffer;
    }

    interface InterpreterOpts {
        pc?: number;
    }

    interface PrecompileFunc {
        (opts: PrecompileInput): ExecResult;
    }

    interface PrecompileInput {
        data: Buffer;
        gasLimit: BN;
        _common: Common;
    }

    class VmError {
        error: ERROR;
        errorType: string;
        constructor(error: ERROR);
    }

    enum ERROR {
        OUT_OF_GAS = 'out of gas',
        STACK_UNDERFLOW = 'stack underflow',
        STACK_OVERFLOW = 'stack overflow',
        INVALID_JUMP = 'invalid JUMP',
        INVALID_OPCODE = 'invalid opcode',
        OUT_OF_RANGE = 'value out of range',
        REVERT = 'revert',
        STATIC_STATE_CHANGE = 'static state change',
        INTERNAL_ERROR = 'internal error',
        CREATE_COLLISION = 'create collision',
        STOP = 'stop',
    }
}
