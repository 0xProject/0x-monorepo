import { BigNumber } from 'bignumber.js';

export type JSONRPCErrorCallback = (err: Error | null, result?: JSONRPCResponsePayload) => void;

/**
 * Do not create your own provider. Use an existing provider from a Web3 or ProviderEngine library
 * Read more about Providers in the guides section of the 0x docs.
 */
export type SupportedProvider = Web3JsProvider | GanacheProvider | EIP1193Provider | ZeroExProvider;

export type Web3JsProvider = Web3JsV1Provider | Web3JsV2Provider | Web3JsV3Provider;

export interface GanacheProvider {
    sendAsync(payload: JSONRPCRequestPayload, callback: JSONRPCErrorCallback): void;
}

// DEPRECATED(fabio): This interface should be replaced with the EIP 1193 provider interface
// We will leave it here until the ecosystem has migrated fully to the new standard
export interface Provider {
    sendAsync(payload: JSONRPCRequestPayload, callback: JSONRPCErrorCallback): void;
}

/**
 * The interface for the provider used internally by 0x libraries
 * Any property we use from any SupportedProvider should we explicitly
 * add here
 */
export interface ZeroExProvider {
    // TODO: Consolidate these bools into a single enum value
    isZeroExProvider?: boolean;
    isMetaMask?: boolean;
    isParity?: boolean;
    stop?(): void;
    enable?(): Promise<void>;
    sendAsync(payload: JSONRPCRequestPayload, callback: JSONRPCErrorCallback): void;
}

/**
 * Web3.js version 1 provider interface
 * This provider interface was implemented in the pre-1.0Beta releases for Web3.js.
 * This interface allowed sending synchonous requests, support for which was later dropped.
 */
export interface Web3JsV1Provider {
    sendAsync(payload: JSONRPCRequestPayload, callback: JSONRPCErrorCallback): void;
    send(payload: JSONRPCRequestPayload): JSONRPCResponsePayload;
}

/**
 * Web3.js version 2 provider interface
 * This provider interface was used in a couple of Web3.js 1.0 beta releases
 * before the first attempts to conform to EIP1193
 */
export interface Web3JsV2Provider {
    send(payload: JSONRPCRequestPayload, callback: JSONRPCErrorCallback): void;
}

/**
 * Web3.js version 3 provider interface
 * This provider interface was implemented with the hopes for conforming to the EIP1193 spec,
 * however it does not conform entirely.
 */
export interface Web3JsV3Provider {
    send(method: string, params?: any[]): Promise<any>;
}

/**
 * Interface for providers that conform to EIP 1193
 * Source: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md
 */
export type EIP1193Event = 'accountsChanged' | 'networkChanged' | 'close' | 'connect' | 'notification';

export interface EIP1193Provider {
    isEIP1193: boolean;
    send(method: string, params?: any[]): Promise<any>;
    on(event: EIP1193Event, listener: (result: any) => void): this;
}

export type ContractAbi = AbiDefinition[];

export type AbiDefinition = FunctionAbi | EventAbi;

export type FunctionAbi = MethodAbi | ConstructorAbi | FallbackAbi;

export type ConstructorStateMutability = 'nonpayable' | 'payable';
export type StateMutability = 'pure' | 'view' | ConstructorStateMutability;

export interface MethodAbi {
    // Ideally this would be set to: `'function'` but then TS complains when artifacts are loaded
    // from JSON files, and this value has type `string` not type `'function'`
    type: string;
    name: string;
    inputs: DataItem[];
    outputs: DataItem[];
    constant: boolean;
    stateMutability: StateMutability;
    payable: boolean;
}

export interface ConstructorAbi {
    // Ideally this would be set to: `'constructor'` but then TS complains when artifacts are loaded
    // from JSON files, and this value has type `string` not type `'constructor'`
    type: string;
    inputs: DataItem[];
    payable: boolean;
    stateMutability: ConstructorStateMutability;
}

export interface FallbackAbi {
    // Ideally this would be set to: `'fallback'` but then TS complains when artifacts are loaded
    // from JSON files, and this value has type `string` not type `'fallback'`
    type: string;
    payable: boolean;
}

export interface EventParameter extends DataItem {
    indexed: boolean;
}

export interface EventAbi {
    // Ideally this would be set to: `'event'` but then TS complains when artifacts are loaded
    // from JSON files, and this value has type `string` not type `'event'`
    type: string;
    name: string;
    inputs: EventParameter[];
    anonymous: boolean;
}

export interface DataItem {
    name: string;
    type: string;
    components?: DataItem[];
}

export interface TupleDataItem extends DataItem {
    components: DataItem[];
}

export enum OpCode {
    // 0s: Stop and Arithmetic Operations
    Stop = 'STOP',
    Add = 'ADD',
    Mul = 'MUL',
    Sub = 'SUB',
    Div = 'DIV',
    SDiv = 'SDIV',
    Mod = 'MOD',
    SMod = 'SMOD',
    AddMod = 'ADDMOD',
    MulMod = 'MULMOD',
    Exp = 'EXP',
    SignExtend = 'SIGNEXTEND',
    // 10s: Comparison & Bitwise Logic Operations
    Lt = 'LT',
    Gt = 'GT',
    SLt = 'SLT',
    SGt = 'SGT',
    Eq = 'EQ',
    IsZero = 'ISZERO',
    And = 'AND',
    Or = 'OR',
    Xor = 'XOR',
    Not = 'NOT',
    Byte = 'BYTE',
    // 20s: SHA3
    Sha3 = 'SHA3',
    // 30s: Environmental Information
    Address = 'ADDRESS',
    Balance = 'BALANCE',
    Origin = 'ORIGIN',
    Caller = 'CALLER',
    CallValue = 'CALLVALUE',
    CallDataLoad = 'CALLDATALOAD',
    CallDataSize = 'CALLDATASIZE',
    CallDataCopy = 'CALLDATACOPY',
    CodeSize = 'CODESIZE',
    CodeCopy = 'CODECOPY',
    GasPrice = 'GASPRICE',
    ExtCodeSize = 'EXTCODESIZE',
    ExtCodeCopy = 'EXTCODECOPY',
    ReturnDataSize = 'RETURNDATASIZE',
    ReturnDataCopy = 'RETURNDATACOPY',
    // 40s: Block Information
    BlockHash = 'BLOCKHASH',
    Coinbase = 'COINBASE',
    TimeStamp = 'TimeStamp',
    Number = 'NUMBER',
    Difficulty = 'DIFFICULTY',
    Gaslimit = 'GASLIMIT',
    // 50s: Stack, Memory, Storage and Flow Operations
    Pop = 'POP',
    MLoad = 'MLOAD',
    MStore = 'MSTORE',
    MStore8 = 'MSTORE8',
    SLoad = 'SLOAD',
    SStore = 'SSTORE',
    Jump = 'JUMP',
    Jumpi = 'JUMPI',
    Pc = 'PC',
    MSize = 'MSIZE',
    Gas = 'GAS',
    JumpDest = 'JUMPDEST',
    // 60s & 70s: Push Operations
    Push1 = 'PUSH1',
    Push2 = 'PUSH2',
    Push3 = 'PUSH3',
    Push4 = 'PUSH4',
    Push5 = 'PUSH5',
    Push6 = 'PUSH6',
    Push7 = 'PUSH7',
    Push8 = 'PUSH8',
    Push9 = 'PUSH9',
    Push10 = 'PUSH10',
    Push11 = 'PUSH11',
    Push12 = 'PUSH12',
    Push13 = 'PUSH13',
    Push14 = 'PUSH14',
    Push15 = 'PUSH15',
    Push16 = 'PUSH16',
    Push17 = 'PUSH17',
    Push18 = 'PUSH18',
    Push19 = 'PUSH19',
    Push20 = 'PUSH20',
    Push21 = 'PUSH21',
    Push22 = 'PUSH22',
    Push23 = 'PUSH23',
    Push24 = 'PUSH24',
    Push25 = 'PUSH25',
    Push26 = 'PUSH26',
    Push27 = 'PUSH27',
    Push28 = 'PUSH28',
    Push29 = 'PUSH29',
    Push30 = 'PUSH30',
    Push31 = 'PUSH31',
    Push32 = 'PUSH32',
    // 80s: Duplication Operation
    Dup1 = 'DUP1',
    Dup2 = 'DUP2',
    Dup3 = 'DUP3',
    Dup4 = 'DUP4',
    Dup5 = 'DUP5',
    Dup6 = 'DUP6',
    Dup7 = 'DUP7',
    Dup8 = 'DUP8',
    Dup9 = 'DUP9',
    Dup10 = 'DUP10',
    Dup11 = 'DUP11',
    Dup12 = 'DUP12',
    Dup13 = 'DUP13',
    Dup14 = 'DUP14',
    Dup15 = 'DUP15',
    Dup16 = 'DUP16',
    // 90s: Exchange Operation
    Swap1 = 'SWAP1',
    Swap2 = 'SWAP2',
    Swap3 = 'SWAP3',
    Swap4 = 'SWAP4',
    Swap5 = 'SWAP5',
    Swap6 = 'SWAP6',
    Swap7 = 'SWAP7',
    Swap8 = 'SWAP8',
    Swap9 = 'SWAP9',
    Swap10 = 'SWAP10',
    Swap11 = 'SWAP11',
    Swap12 = 'SWAP12',
    Swap13 = 'SWAP13',
    Swap14 = 'SWAP14',
    Swap15 = 'SWAP15',
    Swap16 = 'SWAP16',
    // a0s: Logging Operations
    Log1 = 'LOG1',
    Log2 = 'LOG2',
    Log3 = 'LOG3',
    Log4 = 'LOG4',
    // f0s: System operations
    Create = 'CREATE',
    Call = 'CALL',
    CallCode = 'CALLCODE',
    Return = 'RETURN',
    DelegateCall = 'DELEGATECALL',
    StaticCall = 'STATICCALL',
    Revert = 'REVERT',
    Invalid = 'INVALID',
    SelfDestruct = 'SELFDESTRUCT',
}

export interface StructLog {
    depth: number;
    error: string;
    gas: number;
    gasCost: number;
    memory: string[];
    op: OpCode;
    pc: number;
    stack: string[];
    storage: { [location: string]: string };
}

export interface TransactionTrace {
    gas: number;
    returnValue: any;
    structLogs: StructLog[];
}

export type Unit =
    | 'kwei'
    | 'ada'
    | 'mwei'
    | 'babbage'
    | 'gwei'
    | 'shannon'
    | 'szabo'
    | 'finney'
    | 'ether'
    | 'kether'
    | 'grand'
    | 'einstein'
    | 'mether'
    | 'gether'
    | 'tether';

export interface JSONRPCRequestPayload {
    params: any[];
    method: string;
    id: number;
    jsonrpc: string;
}

export interface JSONRPCResponseError {
    message: string;
    code: number;
}

export interface JSONRPCResponsePayload {
    result: any;
    id: number;
    jsonrpc: string;
    error?: JSONRPCResponseError;
}

export interface AbstractBlock {
    number: number | null;
    hash: string | null;
    parentHash: string;
    nonce: string | null;
    sha3Uncles: string;
    logsBloom: string | null;
    transactionsRoot: string;
    stateRoot: string;
    miner: string;
    difficulty: BigNumber;
    totalDifficulty: BigNumber;
    extraData: string;
    size: number;
    gasLimit: number;
    gasUsed: number;
    timestamp: number;
    uncles: string[];
}

export interface BlockWithoutTransactionData extends AbstractBlock {
    transactions: string[];
}

export interface BlockWithTransactionData extends AbstractBlock {
    transactions: Transaction[];
}

export interface Transaction {
    hash: string;
    nonce: number;
    blockHash: string | null;
    blockNumber: number | null;
    transactionIndex: number | null;
    from: string;
    to: string | null;
    value: BigNumber;
    gasPrice: BigNumber;
    gas: number;
    input: string;
}

export interface CallTxDataBase {
    to?: string;
    value?: number | string | BigNumber;
    gas?: number | string | BigNumber;
    gasPrice?: number | string | BigNumber;
    data?: string;
    nonce?: number;
}

export interface TxData extends CallTxDataBase {
    from: string;
}

export interface CallData extends CallTxDataBase {
    from?: string;
}

export interface FilterObject {
    fromBlock?: number | string;
    toBlock?: number | string;
    blockHash?: string;
    address?: string;
    topics?: LogTopic[];
}

export type LogTopic = null | string | string[];

export interface DecodedLogEntry<A> extends LogEntry {
    event: string;
    args: A;
}

export interface DecodedLogEntryEvent<A> extends DecodedLogEntry<A> {
    removed: boolean;
}

export interface LogEntryEvent extends LogEntry {
    removed: boolean;
}

export interface LogEntry {
    logIndex: number | null;
    transactionIndex: number | null;
    transactionHash: string;
    blockHash: string | null;
    blockNumber: number | null;
    address: string;
    data: string;
    topics: string[];
}

export interface TxDataPayable extends TxData {
    value?: BigNumber;
}

export type TransactionReceiptStatus = null | string | 0 | 1;

export interface TransactionReceipt {
    blockHash: string;
    blockNumber: number;
    transactionHash: string;
    transactionIndex: number;
    from: string;
    to: string;
    status: TransactionReceiptStatus;
    cumulativeGasUsed: number;
    gasUsed: number;
    contractAddress: string | null;
    logs: LogEntry[];
}

export enum AbiType {
    Function = 'function',
    Constructor = 'constructor',
    Event = 'event',
    Fallback = 'fallback',
}

export type ContractEventArg = any;

export interface DecodedLogArgs {
    [argName: string]: ContractEventArg;
}

export interface LogWithDecodedArgs<ArgsType extends DecodedLogArgs> extends DecodedLogEntry<ArgsType> {}
export type RawLog = LogEntry;

export enum BlockParamLiteral {
    Earliest = 'earliest',
    Latest = 'latest',
    Pending = 'pending',
}

export type BlockParam = BlockParamLiteral | number;

export interface RawLogEntry {
    logIndex: string | null;
    transactionIndex: string | null;
    transactionHash: string;
    blockHash: string | null;
    blockNumber: string | null;
    address: string;
    data: string;
    topics: string[];
}

export enum SolidityTypes {
    Address = 'address',
    Bool = 'bool',
    Bytes = 'bytes',
    Int = 'int',
    String = 'string',
    Tuple = 'tuple',
    Uint256 = 'uint256',
    Uint8 = 'uint8',
    Uint = 'uint',
}

/**
 * Contains the logs returned by a TransactionReceipt. We attempt to decode the
 * logs using AbiDecoder. If we have the logs corresponding ABI, we decode it,
 * otherwise we don't.
 */
export interface TransactionReceiptWithDecodedLogs extends TransactionReceipt {
    logs: Array<LogWithDecodedArgs<DecodedLogArgs> | LogEntry>;
}

export interface TraceParams {
    disableMemory?: boolean;
    disableStack?: boolean;
    disableStorage?: boolean;
    tracer?: string;
    timeout?: string;
}

export type OutputField =
    | '*'
    | 'ast'
    | 'legacyAST'
    | 'abi'
    | 'devdoc'
    | 'userdoc'
    | 'metadata'
    | 'ir'
    | 'evm.assembly'
    | 'evm.legacyAssembly'
    | 'evm.bytecode.object'
    | 'evm.bytecode.opcodes'
    | 'evm.bytecode.sourceMap'
    | 'evm.bytecode.linkReferences'
    | 'evm.deployedBytecode.object'
    | 'evm.deployedBytecode.opcodes'
    | 'evm.deployedBytecode.sourceMap'
    | 'evm.deployedBytecode.linkReferences'
    | 'evm.methodIdentifiers'
    | 'evm.gasEstimates'
    | 'ewasm.wast'
    | 'ewasm.wasm';

export interface ContractNetworks {
    [networkId: number]: ContractNetworkData;
}

export interface ContractNetworkData {
    address: string;
    links: {
        [linkName: string]: string;
    };
    constructorArgs: string;
}

export type ParamDescription = string;

export interface StandardContractOutput {
    abi: ContractAbi;
    evm: EvmOutput;
    devdoc?: DevdocOutput;
}

export interface StandardOutput {
    errors: SolcError[];
    sources: {
        [fileName: string]: {
            id: number;
            ast?: object;
            legacyAST?: object;
        };
    };
    contracts: {
        [fileName: string]: {
            [contractName: string]: StandardContractOutput;
        };
    };
}

export type ErrorType =
    | 'JSONError'
    | 'IOError'
    | 'ParserError'
    | 'DocstringParsingError'
    | 'SyntaxError'
    | 'DeclarationError'
    | 'TypeError'
    | 'UnimplementedFeatureError'
    | 'InternalCompilerError'
    | 'Exception'
    | 'CompilerError'
    | 'FatalError'
    | 'Warning';
export type ErrorSeverity = 'error' | 'warning';

export interface SolcError {
    sourceLocation?: SourceLocation;
    type: ErrorType;
    component: 'general' | 'ewasm';
    severity: ErrorSeverity;
    message: string;
    formattedMessage?: string;
}

export interface SourceLocation {
    file: string;
    start: number;
    end: number;
}

export interface EvmOutput {
    bytecode: EvmBytecodeOutput;
    deployedBytecode: EvmBytecodeOutput;
}

export interface EvmBytecodeOutput {
    object: string;
    sourceMap: string;
}

export interface DevdocOutput {
    title?: string;
    author?: string;
    methods: {
        [signature: string]: {
            details?: string;
            params?: {
                [name: string]: ParamDescription;
            };
            return?: string;
        };
    };
}

export interface ContractVersionData {
    compiler: CompilerOpts;
    sources: {
        [sourceName: string]: {
            id: number;
        };
    };
    sourceCodes: {
        [sourceName: string]: string;
    };
    sourceTreeHashHex: string;
    compilerOutput: StandardContractOutput;
}

export interface CompilerOpts {
    name: 'solc';
    version: string;
    settings: CompilerSettings;
}

/**
 * This type defines the schema of the artifact.json file generated by Sol-compiler
 * schemaVersion: The version of the artifact schema
 * contractName: The contract name it represents
 * networks: Network specific information by network (address, id, constructor args, etc...)
 * compilerOutput: The Solidity compiler output generated from the specified compiler input
 * description (http://solidity.readthedocs.io/en/v0.4.24/using-the-compiler.html#compiler-input-and-output-json-description)
 * compiler: The compiler settings used
 * sourceCodes: The source code of the contract and all it's dependencies
 * sources: A mapping from source filePath to sourceMap id
 * sourceTreeHashHex: A unique hash generated from the contract source and that of it's dependencies.
 * If any of the sources change, the hash would change notifying us that a re-compilation is necessary
 */
export interface ContractArtifact extends ContractVersionData {
    schemaVersion: string;
    contractName: string;
    networks: ContractNetworks;
}

export interface GeneratedCompilerOptions {
    name: 'solc';
    version: string;
    settings: CompilerSettings;
}

// Copied from the solc.js library types
export interface CompilerSettings {
    remappings?: string[];
    optimizer?: OptimizerSettings;
    evmVersion?: 'homestead' | 'tangerineWhistle' | 'spuriousDragon' | 'byzantium' | 'constantinople';
    metadata?: CompilerSettingsMetadata;
    libraries?: {
        [fileName: string]: {
            [libName: string]: string;
        };
    };
    outputSelection: {
        [fileName: string]: {
            [contractName: string]: OutputField[];
        };
    };
}

export interface CompilerSettingsMetadata {
    useLiteralContent: true;
}

export interface OptimizerSettings {
    enabled: boolean;
    runs?: number;
}

export interface Source {
    id: number;
}

/**
 * Options you can specify (as flags or in a compiler.json file) when invoking sol-compiler
 * contractsDir: Directory containing your project's Solidity contracts. Can contain nested directories.
 * artifactsDir: Directory where you want the generated artifacts.json written to
 * compilerSettings: Desired settings to pass to the Solidity compiler during compilation.
 * (http://solidity.readthedocs.io/en/v0.4.24/using-the-compiler.html#compiler-input-and-output-json-description)
 * contracts: List of contract names you wish to compile, or alternatively ['*'] to compile all contracts in the
 * specified directory.
 * useDockerisedSolc: If set to true - sol-compiler will try calling a dockerized installations of solc to achieve faster compilation times. Otherwise and by default - solcjs will be used. Defaults to false.
 * isOfflineMode: If set to true - sol-compiler will not fetch the list of solc releases from github. It will use the hardcoded list. Defaults to false.
 * solcVersion: If you don't want to compile each contract with the Solidity version specified in-file, you can force all
 * contracts to compile with the the version specified here.
 */
export interface CompilerOptions {
    contractsDir?: string;
    artifactsDir?: string;
    compilerSettings?: CompilerSettings;
    contracts?: string[] | '*';
    useDockerisedSolc?: boolean;
    isOfflineMode?: boolean;
    solcVersion?: string;
} // tslint:disable-line:max-file-line-count
