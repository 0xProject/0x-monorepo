import { DocGenConfigs } from './types';

export const docGenConfigs: DocGenConfigs = {
    DOC_JSON_VERSION: '0.0.1',
    EXTERNAL_TYPE_TO_LINK: {
        BigNumber: 'http://mikemcl.github.io/bignumber.js',
        Error: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error',
        Buffer: 'https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/v9/index.d.ts#L262',
        'solc.StandardContractOutput':
            'https://solidity.readthedocs.io/en/v0.4.24/using-the-compiler.html#output-description',
        'solc.CompilerSettings': 'https://solidity.readthedocs.io/en/v0.4.24/using-the-compiler.html#input-description',
        Schema:
            'https://github.com/tdegrunt/jsonschema/blob/5c2edd4baba149964aec0f23c87ad12c25a50dfb/lib/index.d.ts#L49',
    },
    /**
     * If a 0x package re-exports an external package, we should add a link to it's exported items here
     */
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
};
