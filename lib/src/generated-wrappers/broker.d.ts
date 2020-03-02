import { ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { ContractAbi, ContractArtifact, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { SimpleContractArtifact } from '@0x/types';
export declare class BrokerContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractArtifact | SimpleContractArtifact;
    }, exchange: string, weth: string): Promise<BrokerContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }, exchange: string, weth: string): Promise<BrokerContract>;
    /**
     * @returns      The contract ABI
     */
    static ABI(): ContractAbi;
    getFunctionSignature(methodName: string): string;
    getABIDecodedTransactionData<T>(methodName: string, callData: string): T;
    getABIDecodedReturnData<T>(methodName: string, callData: string): T;
    getSelector(methodName: string): string;
    /**
     * Fills multiple property-based orders by the given amounts using the given assets.
     * Pays protocol fees using either the ETH supplied by the taker to the transaction or
     * WETH acquired from the maker during settlement. The final WETH balance is sent to the taker.
     * @param brokeredTokenIds Token IDs specified by the taker to be used to fill
     *     the orders.
     * @param orders The property-based orders to fill. The format of a property-
     *     based order is the        same as that of a normal order, except the
     *     takerAssetData. Instaed of specifying a        specific ERC721 asset,
     *     the takerAssetData should be ERC1155 assetData where the
     *     underlying tokenAddress is this contract's address and the desired
     *     properties are        encoded in the extra data field. Also note that
     *     takerFees must be denominated in        WETH (or zero).
     * @param takerAssetFillAmounts The amounts to fill the orders by.
     * @param signatures The makers' signatures for the given orders.
     * @param batchFillFunctionSelector The selector for either `batchFillOrders`,
     *           `batchFillOrKillOrders`, or `batchFillOrdersNoThrow`.
     * @param ethFeeAmounts Amounts of ETH, denominated in Wei, that are paid to
     *     corresponding feeRecipients.
     * @param feeRecipients Addresses that will receive ETH when orders are filled.
     * @returns fillResults Amounts filled and fees paid by the makers and taker.
     */
    batchBrokerTrade(brokeredTokenIds: BigNumber[], orders: Array<{
        makerAddress: string;
        takerAddress: string;
        feeRecipientAddress: string;
        senderAddress: string;
        makerAssetAmount: BigNumber;
        takerAssetAmount: BigNumber;
        makerFee: BigNumber;
        takerFee: BigNumber;
        expirationTimeSeconds: BigNumber;
        salt: BigNumber;
        makerAssetData: string;
        takerAssetData: string;
        makerFeeAssetData: string;
        takerFeeAssetData: string;
    }>, takerAssetFillAmounts: BigNumber[], signatures: string[], batchFillFunctionSelector: string, ethFeeAmounts: BigNumber[], feeRecipients: string[]): ContractTxFunctionObj<Array<{
        makerAssetFilledAmount: BigNumber;
        takerAssetFilledAmount: BigNumber;
        makerFeePaid: BigNumber;
        takerFeePaid: BigNumber;
        protocolFeePaid: BigNumber;
    }>>;
    /**
     * Fills a single property-based order by the given amount using the given assets.
     * Pays protocol fees using either the ETH supplied by the taker to the transaction or
     * WETH acquired from the maker during settlement. The final WETH balance is sent to the taker.
     * @param brokeredTokenIds Token IDs specified by the taker to be used to fill
     *     the orders.
     * @param order The property-based order to fill. The format of a property-
     *     based order is the        same as that of a normal order, except the
     *     takerAssetData. Instaed of specifying a        specific ERC721 asset,
     *     the takerAssetData should be ERC1155 assetData where the
     *     underlying tokenAddress is this contract's address and the desired
     *     properties are        encoded in the extra data field. Also note that
     *     takerFees must be denominated in        WETH (or zero).
     * @param takerAssetFillAmount The amount to fill the order by.
     * @param signature The maker's signature of the given order.
     * @param fillFunctionSelector The selector for either `fillOrder` or
     *     `fillOrKillOrder`.
     * @param ethFeeAmounts Amounts of ETH, denominated in Wei, that are paid to
     *     corresponding feeRecipients.
     * @param feeRecipients Addresses that will receive ETH when orders are filled.
     * @returns fillResults Amounts filled and fees paid by the maker and taker.
     */
    brokerTrade(brokeredTokenIds: BigNumber[], order: {
        makerAddress: string;
        takerAddress: string;
        feeRecipientAddress: string;
        senderAddress: string;
        makerAssetAmount: BigNumber;
        takerAssetAmount: BigNumber;
        makerFee: BigNumber;
        takerFee: BigNumber;
        expirationTimeSeconds: BigNumber;
        salt: BigNumber;
        makerAssetData: string;
        takerAssetData: string;
        makerFeeAssetData: string;
        takerFeeAssetData: string;
    }, takerAssetFillAmount: BigNumber, signature: string, fillFunctionSelector: string, ethFeeAmounts: BigNumber[], feeRecipients: string[]): ContractTxFunctionObj<{
        makerAssetFilledAmount: BigNumber;
        takerAssetFilledAmount: BigNumber;
        makerFeePaid: BigNumber;
        takerFeePaid: BigNumber;
        protocolFeePaid: BigNumber;
    }>;
    /**
     * The Broker implements the ERC1155 transfer function to be compatible with the ERC1155 asset proxy
     * @param from Since the Broker serves as the taker of the order, this should
     *     equal `address(this)`
     * @param to This should be the maker of the order.
     * @param amounts Should be an array of just one `uint256`, specifying the
     *     amount of the brokered assets to transfer.
     * @param data Encodes the validator contract address and any auxiliary data it
     *     needs for property validation.
     */
    safeBatchTransferFrom(from: string, to: string, index_2: BigNumber[], amounts: BigNumber[], data: string): ContractTxFunctionObj<void>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=broker.d.ts.map