import { DocGenConfigs } from './types';

export const docGenConfigs: DocGenConfigs = {
    // Versions our doc JSON format so we can handle breaking changes  intelligently
    DOC_JSON_VERSION: '0.0.1',
    // Some types that are exposed by our package's public interface are external types. As such, we won't
    // be able to render their definitions. Instead we link to them using this lookup.
    EXTERNAL_TYPE_MAP: {
        Array: true,
        BigNumber: true,
        Error: true,
        ErrorConstructor: true,
        Buffer: true,
        'solc.StandardContractOutput': true,
        'solc.CompilerSettings': true,
        Schema: true,
        Uint8Array: true,
        // HACK: CI can handle these without the namespace but some local setups (Jacob) require the namespace prefix
        //      This is duplicated until we can discover the source of the issue.
        GanacheOpts: true,
        keystore: true,
        'Ganache.GanacheOpts': true,
        PromiseWithTransactionHash: true,
        // HACK: Asset-swapper specifies marketSell and marketBuy quotes with a descriminant MarketOperation Type to ignore the error, linking Buy and Sell to MarketOperation
        Buy: true,
        Sell: true,
        IterableIterator: true,
        Set: true,
    },
    // Some types are not explicitly part of the public interface like params, return values, etc... But we still
    // want them exported. E.g error enum types that can be thrown by methods. These must be manually added to this
    // config
    IGNORED_EXCESSIVE_TYPES: [
        'NonceSubproviderErrors',
        'Web3WrapperErrors',
        'AssetBuyerError',
        'ContractError',
        'SubscriptionErrors',
        'TypedDataError',
        'SwapQuoterError',
        'SwapQuoteConsumerError',
        'SwapQuoteGetOutputOpts',
        'SwapQuoteExecutionOpts',
        'ForwarderError',
        'CoordinatorServerError',
        'CoordinatorServerCancellationResponse',
        'EventCallback',
        'IndexedFilterValues',
        'OrderInfo',
        'TransactionOpts',
        'ContractEvent',
        'SendTransactionOpts',
        'AwaitTransactionOpts',
        'ContractFunctionObj',
        'ContractTxFunctionObj',
        'EventCallback ',
        'EnvVars',
        'GlobalStakeByStatus',
        'OwnerStakeByStatus',
        'StakingPoolById',
        'AssetData',
        'SingleAssetData',
        'ERC20AssetData',
        'ERC20BridgeAssetData',
        'ERC721AssetData',
        'ERC1155AssetData',
        'MultiAssetData',
        'StaticCallAssetData',
        'MultiAssetDataWithRecursiveDecoding',
    ],
    // Some libraries only export types. In those cases, we cannot check if the exported types are part of the
    // "exported public interface". Thus we add them here and skip those checks.
    TYPES_ONLY_LIBRARIES: ['ethereum-types', '@0x/types'],
};
