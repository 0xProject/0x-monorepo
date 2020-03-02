import { ContractFunctionObj, ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { ContractAbi, ContractArtifact, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare class DevUtilsContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string;
    static contractName: string;
    private readonly _methodABIIndex;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractArtifact | SimpleContractArtifact;
    }, exchange_: string, chaiBridge_: string, dydxBridge_: string): Promise<DevUtilsContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractArtifact | SimpleContractArtifact;
    }, exchange_: string, chaiBridge_: string, dydxBridge_: string): Promise<DevUtilsContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }, exchange_: string, chaiBridge_: string, dydxBridge_: string): Promise<DevUtilsContract>;
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
    EIP712_EXCHANGE_DOMAIN_HASH(): ContractFunctionObj<string>;
    chaiBridgeAddress(): ContractFunctionObj<string>;
    /**
     * Decode AssetProxy identifier
     * @param assetData AssetProxy-compliant asset data describing an ERC-20, ERC-
     *     721, ERC1155, or MultiAsset asset.
     * @returns The AssetProxy identifier
     */
    decodeAssetProxyId(assetData: string): ContractFunctionObj<string>;
    /**
     * Decode ERC-1155 asset data from the format described in the AssetProxy contract specification.
     * @param assetData AssetProxy-compliant asset data describing an ERC-1155 set
     *     of assets.
     * @returns The ERC-1155 AssetProxy identifier, the address of the ERC-1155 contract hosting the assets, an array of the identifiers of the assets to be traded, an array of asset amounts to be traded, and callback data.  Each element of the arrays corresponds to the same-indexed element of the other array.  Return values specified as &#x60;memory&#x60; are returned as pointers to locations within the memory of the input parameter &#x60;assetData&#x60;.
     */
    decodeERC1155AssetData(assetData: string): ContractFunctionObj<[string, string, BigNumber[], BigNumber[], string]>;
    /**
     * Decode ERC-20 asset data from the format described in the AssetProxy contract specification.
     * @param assetData AssetProxy-compliant asset data describing an ERC-20 asset.
     * @returns The AssetProxy identifier, and the address of the ERC-20 contract hosting this asset.
     */
    decodeERC20AssetData(assetData: string): ContractFunctionObj<[string, string]>;
    /**
     * Decode ERC20Bridge asset data from the format described in the AssetProxy contract specification.
     * @param assetData AssetProxy-compliant asset data describing an ERC20Bridge
     *     asset
     * @returns The ERC20BridgeProxy identifier, the address of the ERC20 token to transfer, the address of the bridge contract, and extra data to be passed to the bridge contract.
     */
    decodeERC20BridgeAssetData(assetData: string): ContractFunctionObj<[string, string, string, string]>;
    /**
     * Decode ERC-721 asset data from the format described in the AssetProxy contract specification.
     * @param assetData AssetProxy-compliant asset data describing an ERC-721
     *     asset.
     * @returns The ERC-721 AssetProxy identifier, the address of the ERC-721 contract hosting this asset, and the identifier of the specific asset to be traded.
     */
    decodeERC721AssetData(assetData: string): ContractFunctionObj<[string, string, BigNumber]>;
    /**
     * Decode multi-asset data from the format described in the AssetProxy contract specification.
     * @param assetData AssetProxy-compliant data describing a multi-asset basket.
     * @returns The Multi-Asset AssetProxy identifier, an array of the amounts of the assets to be traded, and an array of the AssetProxy-compliant data describing each asset to be traded.  Each element of the arrays corresponds to the same-indexed element of the other array.
     */
    decodeMultiAssetData(assetData: string): ContractFunctionObj<[string, BigNumber[], string[]]>;
    /**
     * Decode StaticCall asset data from the format described in the AssetProxy contract specification.
     * @param assetData AssetProxy-compliant asset data describing a StaticCall
     *     asset
     * @returns The StaticCall AssetProxy identifier, the target address of the StaticCAll, the data to be passed to the target address, and the expected Keccak-256 hash of the static call return data.
     */
    decodeStaticCallAssetData(assetData: string): ContractFunctionObj<[string, string, string, string]>;
    /**
     * Decodes the call data for an Exchange contract method call.
     * @param transactionData ABI-encoded calldata for an Exchange     contract
     *     method call.
     * @returns The name of the function called, and the parameters it was     given.  For single-order fills and cancels, the arrays will have     just one element.
     */
    decodeZeroExTransactionData(transactionData: string): ContractFunctionObj<[string, Array<{
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
    }>, BigNumber[], string[]]>;
    dydxBridgeAddress(): ContractFunctionObj<string>;
    /**
     * Encode ERC-1155 asset data into the format described in the AssetProxy contract specification.
     * @param tokenAddress The address of the ERC-1155 contract hosting the
     *     asset(s) to be traded.
     * @param tokenIds The identifiers of the specific assets to be traded.
     * @param tokenValues The amounts of each asset to be traded.
     * @param callbackData Data to be passed to receiving contracts when a transfer
     *     is performed.
     * @returns AssetProxy-compliant asset data describing the set of assets.
     */
    encodeERC1155AssetData(tokenAddress: string, tokenIds: BigNumber[], tokenValues: BigNumber[], callbackData: string): ContractFunctionObj<string>;
    /**
     * Encode ERC-20 asset data into the format described in the AssetProxy contract specification.
     * @param tokenAddress The address of the ERC-20 contract hosting the asset to
     *     be traded.
     * @returns AssetProxy-compliant data describing the asset.
     */
    encodeERC20AssetData(tokenAddress: string): ContractFunctionObj<string>;
    /**
     * Encode ERC-721 asset data into the format described in the AssetProxy specification.
     * @param tokenAddress The address of the ERC-721 contract hosting the asset to
     *     be traded.
     * @param tokenId The identifier of the specific asset to be traded.
     * @returns AssetProxy-compliant asset data describing the asset.
     */
    encodeERC721AssetData(tokenAddress: string, tokenId: BigNumber): ContractFunctionObj<string>;
    /**
     * Encode data for multiple assets, per the AssetProxy contract specification.
     * @param amounts The amounts of each asset to be traded.
     * @param nestedAssetData AssetProxy-compliant data describing each asset to be
     *     traded.
     * @returns AssetProxy-compliant data describing the set of assets.
     */
    encodeMultiAssetData(amounts: BigNumber[], nestedAssetData: string[]): ContractFunctionObj<string>;
    /**
     * Encode StaticCall asset data into the format described in the AssetProxy contract specification.
     * @param staticCallTargetAddress Target address of StaticCall.
     * @param staticCallData Data that will be passed to staticCallTargetAddress in
     *     the StaticCall.
     * @param expectedReturnDataHash Expected Keccak-256 hash of the StaticCall
     *     return data.
     * @returns AssetProxy-compliant asset data describing the set of assets.
     */
    encodeStaticCallAssetData(staticCallTargetAddress: string, staticCallData: string, expectedReturnDataHash: string): ContractFunctionObj<string>;
    erc1155ProxyAddress(): ContractFunctionObj<string>;
    erc20ProxyAddress(): ContractFunctionObj<string>;
    erc721ProxyAddress(): ContractFunctionObj<string>;
    exchangeAddress(): ContractFunctionObj<string>;
    /**
     * Returns the number of asset(s) (described by assetData) that the corresponding AssetProxy contract is authorized to spend.  When the asset data contains multiple assets (eg for Multi-Asset), the return value indicates how many complete "baskets" of those assets may be spent by all of the corresponding AssetProxy contracts.
     * @param ownerAddress Owner of the assets specified by assetData.
     * @param assetData Details of asset, encoded per the AssetProxy contract
     *     specification.
     * @returns Number of assets (or asset baskets) that the corresponding AssetProxy is authorized to spend.
     */
    getAssetProxyAllowance(ownerAddress: string, assetData: string): ContractTxFunctionObj<BigNumber>;
    /**
     * Returns the owner's balance of the assets(s) specified in assetData.  When the asset data contains multiple assets (eg in ERC1155 or Multi-Asset), the return value indicates how many complete "baskets" of those assets are owned by owner.
     * @param ownerAddress Owner of the assets specified by assetData.
     * @param assetData Details of asset, encoded per the AssetProxy contract
     *     specification.
     * @returns Number of assets (or asset baskets) held by owner.
     */
    getBalance(ownerAddress: string, assetData: string): ContractTxFunctionObj<BigNumber>;
    /**
     * Calls getBalance() and getAllowance() for assetData.
     * @param ownerAddress Owner of the assets specified by assetData.
     * @param assetData Details of asset, encoded per the AssetProxy contract
     *     specification.
     * @returns Number of assets (or asset baskets) held by owner, and number of assets (or asset baskets) that the corresponding AssetProxy is authorized to spend.
     */
    getBalanceAndAssetProxyAllowance(ownerAddress: string, assetData: string): ContractTxFunctionObj<[BigNumber, BigNumber]>;
    /**
     * Calls getAssetProxyAllowance() for each element of assetData.
     * @param ownerAddress Owner of the assets specified by assetData.
     * @param assetData Array of asset details, each encoded per the AssetProxy
     *     contract specification.
     * @returns An array of asset allowances from getAllowance(), with each element corresponding to the same-indexed element in the assetData input.
     */
    getBatchAssetProxyAllowances(ownerAddress: string, assetData: string[]): ContractTxFunctionObj<BigNumber[]>;
    /**
     * Calls getBalance() for each element of assetData.
     * @param ownerAddress Owner of the assets specified by assetData.
     * @param assetData Array of asset details, each encoded per the AssetProxy
     *     contract specification.
     * @returns Array of asset balances from getBalance(), with each element corresponding to the same-indexed element in the assetData input.
     */
    getBatchBalances(ownerAddress: string, assetData: string[]): ContractTxFunctionObj<BigNumber[]>;
    /**
     * Calls getBatchBalances() and getBatchAllowances() for each element of assetData.
     * @param ownerAddress Owner of the assets specified by assetData.
     * @param assetData Array of asset details, each encoded per the AssetProxy
     *     contract specification.
     * @returns An array of asset balances from getBalance(), and an array of asset allowances from getAllowance(), with each element corresponding to the same-indexed element in the assetData input.
     */
    getBatchBalancesAndAssetProxyAllowances(ownerAddress: string, assetData: string[]): ContractTxFunctionObj<[BigNumber[], BigNumber[]]>;
    /**
     * Batch fetches ETH balances
     * @param addresses Array of addresses.
     * @returns Array of ETH balances.
     */
    getEthBalances(addresses: string[]): ContractFunctionObj<BigNumber[]>;
    getOrderHash(order: {
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
    }, chainId: BigNumber, exchange: string): ContractFunctionObj<string>;
    /**
     * Fetches all order-relevant information needed to validate if the supplied order is fillable.
     * @param order The order structure.
     * @param signature Signature provided by maker that proves the order's
     *     authenticity. `0x01` can always be provided if the signature does not
     *     need to be validated.
     * @returns The orderInfo (hash, status, and &#x60;takerAssetAmount&#x60; already filled for the given order), fillableTakerAssetAmount (amount of the order&#x27;s &#x60;takerAssetAmount&#x60; that is fillable given all on-chain state), and isValidSignature (validity of the provided signature). NOTE: If the &#x60;takerAssetData&#x60; encodes data for multiple assets, &#x60;fillableTakerAssetAmount&#x60; will represent a &quot;scaled&quot; amount, meaning it must be multiplied by all the individual asset amounts within the &#x60;takerAssetData&#x60; to get the final amount of each asset that can be filled.
     */
    getOrderRelevantState(order: {
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
    }, signature: string): ContractTxFunctionObj<[{
        orderStatus: number;
        orderHash: string;
        orderTakerAssetFilledAmount: BigNumber;
    }, BigNumber, boolean]>;
    /**
     * Fetches all order-relevant information needed to validate if the supplied orders are fillable.
     * @param orders Array of order structures.
     * @param signatures Array of signatures provided by makers that prove the
     *     authenticity of the orders. `0x01` can always be provided if a signature
     *     does not need to be validated.
     * @returns The ordersInfo (array of the hash, status, and &#x60;takerAssetAmount&#x60; already filled for each order), fillableTakerAssetAmounts (array of amounts for each order&#x27;s &#x60;takerAssetAmount&#x60; that is fillable given all on-chain state), and isValidSignature (array containing the validity of each provided signature). NOTE: If the &#x60;takerAssetData&#x60; encodes data for multiple assets, each element of &#x60;fillableTakerAssetAmounts&#x60; will represent a &quot;scaled&quot; amount, meaning it must be multiplied by all the individual asset amounts within the &#x60;takerAssetData&#x60; to get the final amount of each asset that can be filled.
     */
    getOrderRelevantStates(orders: Array<{
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
    }>, signatures: string[]): ContractTxFunctionObj<[Array<{
        orderStatus: number;
        orderHash: string;
        orderTakerAssetFilledAmount: BigNumber;
    }>, BigNumber[], boolean[]]>;
    /**
     * Simulates the maker transfers within an order and returns the index of the first failed transfer.
     * @param order The order to simulate transfers for.
     * @param takerAddress The address of the taker that will fill the order.
     * @param takerAssetFillAmount The amount of takerAsset that the taker wished
     *     to fill.
     * @returns The index of the first failed transfer (or 4 if all transfers are successful).
     */
    getSimulatedOrderMakerTransferResults(order: {
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
    }, takerAddress: string, takerAssetFillAmount: BigNumber): ContractTxFunctionObj<number>;
    /**
     * Simulates all of the transfers within an order and returns the index of the first failed transfer.
     * @param order The order to simulate transfers for.
     * @param takerAddress The address of the taker that will fill the order.
     * @param takerAssetFillAmount The amount of takerAsset that the taker wished
     *     to fill.
     * @returns The index of the first failed transfer (or 4 if all transfers are successful).
     */
    getSimulatedOrderTransferResults(order: {
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
    }, takerAddress: string, takerAssetFillAmount: BigNumber): ContractTxFunctionObj<number>;
    /**
     * Simulates all of the transfers for each given order and returns the indices of each first failed transfer.
     * @param orders Array of orders to individually simulate transfers for.
     * @param takerAddresses Array of addresses of takers that will fill each
     *     order.
     * @param takerAssetFillAmounts Array of amounts of takerAsset that will be
     *     filled for each order.
     * @returns The indices of the first failed transfer (or 4 if all transfers are successful) for each order.
     */
    getSimulatedOrdersTransferResults(orders: Array<{
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
    }>, takerAddresses: string[], takerAssetFillAmounts: BigNumber[]): ContractTxFunctionObj<number[]>;
    getTransactionHash(transaction: {
        salt: BigNumber;
        expirationTimeSeconds: BigNumber;
        gasPrice: BigNumber;
        signerAddress: string;
        data: string;
    }, chainId: BigNumber, exchange: string): ContractFunctionObj<string>;
    /**
     * Gets the amount of an asset transferable by the maker of an order.
     * @param ownerAddress Address of the owner of the asset.
     * @param assetData Description of tokens, per the AssetProxy contract
     *     specification.
     * @returns The amount of the asset tranferable by the owner. NOTE: If the &#x60;assetData&#x60; encodes data for multiple assets, the &#x60;transferableAssetAmount&#x60; will represent the amount of times the entire &#x60;assetData&#x60; can be transferred. To calculate the total individual transferable amounts, this scaled &#x60;transferableAmount&#x60; must be multiplied by the individual asset amounts located within the &#x60;assetData&#x60;.
     */
    getTransferableAssetAmount(ownerAddress: string, assetData: string): ContractTxFunctionObj<BigNumber>;
    /**
     * Reverts if assetData is not of a valid format for its given proxy id.
     * @param assetData AssetProxy compliant asset data.
     */
    revertIfInvalidAssetData(assetData: string): ContractFunctionObj<void>;
    staticCallProxyAddress(): ContractFunctionObj<string>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=dev_utils.d.ts.map