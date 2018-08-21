import { DocGenConfigs } from './types';

export const docGenConfigs: DocGenConfigs = {
    DOC_JSON_VERSION: '0.0.1',
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
        'Ganache.GanacheOpts':
            'https://github.com/0xProject/0x-monorepo/blob/ddf85112d7e4eb1581e0d82ce6eedad429641106/packages/typescript-typings/types/ganache-core/index.d.ts#L3',
        'lightwallet.keystore':
            'https://github.com/0xProject/0x-monorepo/blob/ddf85112d7e4eb1581e0d82ce6eedad429641106/packages/typescript-typings/types/eth-lightwallet/index.d.ts#L32',
    },
    // If a 0x package re-exports an external package, we should add a link to it's exported items here
    EXTERNAL_EXPORT_TO_LINK: {
        Web3ProviderEngine: 'https://www.npmjs.com/package/web3-provider-engine',
        BigNumber: 'https://www.npmjs.com/package/bignumber.js',
        Schema: 'https://github.com/tdegrunt/jsonschema/blob/v1.2.4/lib/index.d.ts#L49',
        ValidatorResult: 'https://github.com/tdegrunt/jsonschema/blob/v1.2.4/lib/helpers.js#L31',
    },
    CLASSES_WITH_HIDDEN_CONSTRUCTORS: [
        'ERC20ProxyWrapper',
        'ERC20TokenWrapper',
        'ERC721ProxyWrapper',
        'ERC721TokenWrapper',
        'EtherTokenWrapper',
        'ExchangeWrapper',
        'ForwarderWrapper',
    ],
    // Some types are not explicitly part of the public interface like params, return values, etc... But we still
    // want them exported. E.g error enum types that can be thrown by methods. These must be manually added to this
    // config
    IGNORED_EXCESSIVE_TYPES: ['NonceSubproviderErrors', 'Web3WrapperErrors', 'ContractWrappersError', 'OrderError'],
    // Some libraries only export types. In those cases, we cannot check if the exported types are part of the
    // "exported public interface". Thus we add them here and skip those checks.
    TYPES_ONLY_LIBRARIES: ['ethereum-types', 'types'],
};
