import { ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { ContractAbi, ContractArtifact, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare class ICurveContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }): Promise<ICurveContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }): Promise<ICurveContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }): Promise<ICurveContract>;
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
    /**
     * Sell `sellAmount` of `fromToken` token and receive `toToken` token.
 * This function exists on early versions of Curve (USDC/DAI)
      * @param i The token index being sold.
      * @param j The token index being bought.
      * @param sellAmount The amount of token being bought.
      * @param minBuyAmount The minimum buy amount of the token being bought.
      * @param deadline The time in seconds when this operation should expire.
     */
    exchange_underlying2(i: BigNumber, j: BigNumber, sellAmount: BigNumber, minBuyAmount: BigNumber, deadline: BigNumber): ContractTxFunctionObj<void>;
    /**
     * Sell `sellAmount` of `fromToken` token and receive `toToken` token.
 * This function exists on later versions of Curve (USDC/DAI/USDT)
      * @param i The token index being sold.
      * @param j The token index being bought.
      * @param sellAmount The amount of token being bought.
      * @param minBuyAmount The minimum buy amount of the token being bought.
     */
    exchange_underlying1(i: BigNumber, j: BigNumber, sellAmount: BigNumber, minBuyAmount: BigNumber): ContractTxFunctionObj<void>;
    /**
     * Get the amount of `fromToken` by buying `buyAmount` of `toToken`
 * This function exists on later versions of Curve (USDC/DAI/USDT)
      * @param i The token index being sold.
      * @param j The token index being bought.
      * @param buyAmount The amount of token being bought.
     */
    get_dx_underlying(i: BigNumber, j: BigNumber, buyAmount: BigNumber): ContractTxFunctionObj<BigNumber>;
    /**
     * Get the amount of `toToken` by selling `sellAmount` of `fromToken`
      * @param i The token index being sold.
      * @param j The token index being bought.
      * @param sellAmount The amount of token being bought.
     */
    get_dy_underlying(i: BigNumber, j: BigNumber, sellAmount: BigNumber): ContractTxFunctionObj<BigNumber>;
    /**
     * Get the underlying token address from the token index
      * @param i The token index.
     */
    underlying_coins(i: BigNumber): ContractTxFunctionObj<string>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=i_curve.d.ts.map