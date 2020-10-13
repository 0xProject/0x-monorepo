import { BaseContract } from '@0x/base-contract';
import { ContractAbi, ContractArtifact, TxData, SupportedProvider } from 'ethereum-types';
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare class MixinOasisContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }, addresses: {
        balancerBridge: string;
        curveBridge: string;
        kyberBridge: string;
        mooniswapBridge: string;
        mStableBridge: string;
        oasisBridge: string;
        shellBridge: string;
        uniswapBridge: string;
        uniswapV2Bridge: string;
        kyberNetworkProxy: string;
        oasis: string;
        uniswapV2Router: string;
        uniswapExchangeFactory: string;
        mStable: string;
        shell: string;
        weth: string;
    }): Promise<MixinOasisContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }, addresses: {
        balancerBridge: string;
        curveBridge: string;
        kyberBridge: string;
        mooniswapBridge: string;
        mStableBridge: string;
        oasisBridge: string;
        shellBridge: string;
        uniswapBridge: string;
        uniswapV2Bridge: string;
        kyberNetworkProxy: string;
        oasis: string;
        uniswapV2Router: string;
        uniswapExchangeFactory: string;
        mStable: string;
        shell: string;
        weth: string;
    }): Promise<MixinOasisContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }, addresses: {
        balancerBridge: string;
        curveBridge: string;
        kyberBridge: string;
        mooniswapBridge: string;
        mStableBridge: string;
        oasisBridge: string;
        shellBridge: string;
        uniswapBridge: string;
        uniswapV2Bridge: string;
        kyberNetworkProxy: string;
        oasis: string;
        uniswapV2Router: string;
        uniswapExchangeFactory: string;
        mStable: string;
        shell: string;
        weth: string;
    }): Promise<MixinOasisContract>;
    /**
     * @returns      The contract ABI
     */
    static ABI(): ContractAbi;
    protected static _deployLibrariesAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, web3Wrapper: Web3Wrapper, txDefaults: Partial<TxData>, libraryAddresses?: {
        [libraryName: string]: string;
    }): Promise<{
        [libraryName: string]: string;
    }>;
    getFunctionSignature(methodName: string): string;
    getABIDecodedTransactionData<T>(methodName: string, callData: string): T;
    getABIDecodedReturnData<T>(methodName: string, callData: string): T;
    getSelector(methodName: string): string;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=mixin_oasis.d.ts.map