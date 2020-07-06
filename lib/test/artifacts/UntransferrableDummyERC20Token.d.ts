export declare const UntransferrableDummyERC20Token: {
    schemaVersion: string;
    contractName: string;
    compilerOutput: {
        abi: ({
            constant: boolean;
            inputs: {
                name: string;
                type: string;
            }[];
            name: string;
            outputs: {
                name: string;
                type: string;
            }[];
            payable: boolean;
            stateMutability: string;
            type: string;
            anonymous?: undefined;
        } | {
            inputs: {
                name: string;
                type: string;
            }[];
            payable: boolean;
            stateMutability: string;
            type: string;
            constant?: undefined;
            name?: undefined;
            outputs?: undefined;
            anonymous?: undefined;
        } | {
            anonymous: boolean;
            inputs: {
                indexed: boolean;
                name: string;
                type: string;
            }[];
            name: string;
            type: string;
            constant?: undefined;
            outputs?: undefined;
            payable?: undefined;
            stateMutability?: undefined;
        })[];
        evm: {
            bytecode: {
                linkReferences: {};
                object: string;
            };
        };
    };
    sources: {
        'test/UntransferrableDummyERC20Token.sol': {
            id: number;
        };
        'test/DummyERC20Token.sol': {
            id: number;
        };
        '@0x/contracts-utils/contracts/src/Ownable.sol': {
            id: number;
        };
        '@0x/contracts-utils/contracts/src/interfaces/IOwnable.sol': {
            id: number;
        };
        'src/MintableERC20Token.sol': {
            id: number;
        };
        '@0x/contracts-utils/contracts/src/SafeMath.sol': {
            id: number;
        };
        'src/UnlimitedAllowanceERC20Token.sol': {
            id: number;
        };
        'src/ERC20Token.sol': {
            id: number;
        };
        'src/interfaces/IERC20Token.sol': {
            id: number;
        };
    };
    sourceCodes: {
        'test/UntransferrableDummyERC20Token.sol': string;
        'test/DummyERC20Token.sol': string;
        '@0x/contracts-utils/contracts/src/Ownable.sol': string;
        '@0x/contracts-utils/contracts/src/interfaces/IOwnable.sol': string;
        'src/MintableERC20Token.sol': string;
        '@0x/contracts-utils/contracts/src/SafeMath.sol': string;
        'src/UnlimitedAllowanceERC20Token.sol': string;
        'src/ERC20Token.sol': string;
        'src/interfaces/IERC20Token.sol': string;
    };
    sourceTreeHashHex: string;
    compiler: {
        name: string;
        version: string;
        settings: {
            optimizer: {
                enabled: boolean;
                runs: number;
                details: {
                    yul: boolean;
                    deduplicate: boolean;
                    cse: boolean;
                    constantOptimizer: boolean;
                };
            };
            outputSelection: {
                '*': {
                    '*': string[];
                };
            };
            evmVersion: string;
            remappings: string[];
        };
    };
    networks: {};
};
//# sourceMappingURL=UntransferrableDummyERC20Token.d.ts.map