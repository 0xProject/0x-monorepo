import { ContractFunctionObj, ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { ContractAbi, ContractArtifact, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare class ILiquidityProviderContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractArtifact | SimpleContractArtifact;
    }): Promise<ILiquidityProviderContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractArtifact | SimpleContractArtifact;
    }): Promise<ILiquidityProviderContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }): Promise<ILiquidityProviderContract>;
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
     * Transfers `amount` of the ERC20 `tokenAddress` from `from` to `to`.
     * @param tokenAddress The address of the ERC20 token to transfer.
     * @param from Address to transfer asset from.
     * @param to Address to transfer asset to.
     * @param amount Amount of asset to transfer.
     * @param bridgeData Arbitrary asset data needed by the bridge contract.
     * @returns success The magic bytes &#x60;0xdc1600f3&#x60; if successful.
     */
    bridgeTransferFrom(tokenAddress: string, from: string, to: string, amount: BigNumber, bridgeData: string): ContractTxFunctionObj<string>;
    /**
     * Quotes the amount of `takerToken` that would need to be sold in
     * order to obtain `buyAmount` of `makerToken`.
     * @param takerToken Address of the taker token (what to sell).
     * @param makerToken Address of the maker token (what to buy).
     * @param buyAmount Amount of `makerToken` to buy.
     * @returns takerTokenAmount Amount of &#x60;takerToken&#x60; that would need to be sold.
     */
    getBuyQuote(takerToken: string, makerToken: string, buyAmount: BigNumber): ContractFunctionObj<BigNumber>;
    /**
     * Quotes the amount of `makerToken` that would be obtained by
     * selling `sellAmount` of `takerToken`.
     * @param takerToken Address of the taker token (what to sell).
     * @param makerToken Address of the maker token (what to buy).
     * @param sellAmount Amount of `takerToken` to sell.
     * @returns makerTokenAmount Amount of &#x60;makerToken&#x60; that would be obtained.
     */
    getSellQuote(takerToken: string, makerToken: string, sellAmount: BigNumber): ContractFunctionObj<BigNumber>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=i_liquidity_provider.d.ts.map