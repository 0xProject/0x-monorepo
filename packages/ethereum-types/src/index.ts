import { BigNumber } from 'bignumber.js';

export type JSONRPCErrorCallback = (err: Error | null, result?: JSONRPCResponsePayload) => void;

/**
 * Do not create your own provider. Use an existing provider from a Web3 or ProviderEngine library
 * Read more about Providers in the 0x wiki.
 */
export interface Provider {
    sendAsync(payload: JSONRPCRequestPayload, callback: JSONRPCErrorCallback): void;
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

export enum OpCode {
    DelegateCall = 'DELEGATECALL',
    Revert = 'REVERT',
    Create = 'CREATE',
    Stop = 'STOP',
    Invalid = 'INVALID',
    CallCode = 'CALLCODE',
    StaticCall = 'STATICCALL',
    Return = 'RETURN',
    Call = 'CALL',
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
    title: string;
    author: string;
    methods: {
        [signature: string]: {
            details: string;
            params: {
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
 * useDockerisedSolc: If set to true - sol-compiler will try using docker to achieve faster compilation times. Otherwise and by default - solcjs will be used.
 * solcVersion: If you don't want to compile each contract with the Solidity version specified in-file, you can force all
 * contracts to compile with the the version specified here.
 */
export interface CompilerOptions {
    contractsDir?: string;
    artifactsDir?: string;
    compilerSettings?: CompilerSettings;
    contracts?: string[] | '*';
    useDockerisedSolc?: boolean;
    solcVersion?: string;
} // tslint:disable-line:max-file-line-count
