declare module 'truffle-contract';
declare module 'whatwg-fetch';
declare module 'thenby';
declare module 'react-document-title';
declare module 'react-ga';

declare module '*.json' {
    const json: any;
    /* tslint:disable */
    export default json;
    /* tslint:enable */
}
declare module 'web3-provider-engine/subproviders/filters';

// This will be defined by default in TS 2.4
// Source: https://github.com/Microsoft/TypeScript/issues/12364
interface System {
    import<T>(module: string): Promise<T>;
}
declare var System: System;
