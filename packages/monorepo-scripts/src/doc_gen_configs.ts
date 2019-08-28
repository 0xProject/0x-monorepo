import { DocGenConfigs } from './types';

export const docGenConfigs: DocGenConfigs = {
    // Versions our doc JSON format so we can handle breaking changes  intelligently
    DOC_JSON_VERSION: '0.0.1',
    // Some types that are exposed by our package's public interface are external types. As such, we won't
    // be able to render their definitions. Instead we link to them using this lookup.
    EXTERNAL_TYPE_TO_LINK: {
        Array: 'https://developer.mozilla.org/pt-PT/docs/Web/JavaScript/Reference/Global_Objects/Array',
        BigNumber: 'http://mikemcl.github.io/bignumber.js',
        Error: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error',
        ErrorConstructor: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error',
        Buffer: 'https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/v9/index.d.ts#L262',
        'solc.StandardContractOutput':
            'https://solidity.readthedocs.io/en/v0.4.24/using-the-compiler.html#output-description',
        'solc.CompilerSettings': 'https://solidity.readthedocs.io/en/v0.4.24/using-the-compiler.html#input-description',
        Schema:
            'https://github.com/tdegrunt/jsonschema/blob/5c2edd4baba149964aec0f23c87ad12c25a50dfb/lib/index.d.ts#L49',
        Uint8Array: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array',
        // HACK: CI can handle these without the namespace but some local setups (Jacob) require the namespace prefix
        //      This is duplicated until we can discover the source of the issue.
        GanacheOpts: 'https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/ganache-core/index.d.ts#L8',
        keystore: 'https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/eth-lightwallet/index.d.ts#L36',
        'Ganache.GanacheOpts':
            'https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/ganache-core/index.d.ts#L8',
        'lightwallet.keystore':
            'https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/eth-lightwallet/index.d.ts#L36',
        // HACK: Asset-swapper specifies marketSell and marketBuy quotes with a descriminant MarketOperation Type to ignore the error, linking Buy and Sell to MarketOperation
        Buy: 'https://github.com/0xProject/0x-monorepo/blob/development/packages/types/src/index.ts',
        Sell: 'https://github.com/0xProject/0x-monorepo/blob/development/packages/types/src/index.ts',
    },
    // Some types are not explicitly part of the public interface like params, return values, etc... But we still
    // want them exported. E.g error enum types that can be thrown by methods. These must be manually added to this
    // config
    IGNORED_EXCESSIVE_TYPES: [
        'NonceSubproviderErrors',
        'Web3WrapperErrors',
        'AssetBuyerError',
        'ContractError',
        'TypedDataError',
        'SwapQuoterError',
        'SwapQuoteGetOutputOpts',
        'SwapQuoteExecutionOpts',
        'ForwarderError',
        'CoordinatorServerError',
        'CoordinatorServerCancellationResponse',
        'EventCallback',
        'IndexedFilterValues',
        'OrderInfo',
        'TransactionOpts',
        'EventCallback ',
    ],
    // Some libraries only export types. In those cases, we cannot check if the exported types are part of the
    // "exported public interface". Thus we add them here and skip those checks.
    TYPES_ONLY_LIBRARIES: ['ethereum-types', 'types'],
};
