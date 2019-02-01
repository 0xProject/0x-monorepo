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
    },
    // If a 0x package re-exports an external package, we should add a link to it's exported items here
    EXTERNAL_EXPORT_TO_LINK: {
        Web3ProviderEngine: 'https://www.npmjs.com/package/web3-provider-engine',
        BigNumber: 'https://www.npmjs.com/package/bignumber.js',
        Schema: 'https://github.com/tdegrunt/jsonschema/blob/v1.2.4/lib/index.d.ts#L49',
        ValidatorResult: 'https://github.com/tdegrunt/jsonschema/blob/v1.2.4/lib/helpers.js#L31',
    },
    // Sometimes we want to hide a constructor from rendering in our docs. An example is when our library has a
    // factory method which instantiates an instance of a class, but we don't want users instantiating it themselves
    // and getting confused. Any class name in this list will not have it's constructor rendered in our docs.
    CLASSES_WITH_HIDDEN_CONSTRUCTORS: [
        'AssetBuyer',
        'ERC20ProxyWrapper',
        'ERC20TokenWrapper',
        'ERC721ProxyWrapper',
        'ERC721TokenWrapper',
        'EtherTokenWrapper',
        'ExchangeWrapper',
        'ForwarderWrapper',
        'OrderValidatorWrapper',
        'TransactionEncoder',
    ],
    // Some types are not explicitly part of the public interface like params, return values, etc... But we still
    // want them exported. E.g error enum types that can be thrown by methods. These must be manually added to this
    // config
    IGNORED_EXCESSIVE_TYPES: [
        'NonceSubproviderErrors',
        'Web3WrapperErrors',
        'ContractWrappersError',
        'OrderError',
        'AssetBuyerError',
        'ForwarderWrapperError',
    ],
    // Some libraries only export types. In those cases, we cannot check if the exported types are part of the
    // "exported public interface". Thus we add them here and skip those checks.
    TYPES_ONLY_LIBRARIES: ['ethereum-types', 'types'],
};
