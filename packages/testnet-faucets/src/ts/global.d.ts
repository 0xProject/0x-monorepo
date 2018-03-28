declare module 'rollbar';
declare module 'web3-provider-engine/subproviders/rpc';
declare module 'web3-provider-engine/subproviders/nonce-tracker';
declare module 'web3-provider-engine/subproviders/hooked-wallet';

declare module '*.json' {
    const json: any;
    /* tslint:disable */
    export default json;
    /* tslint:enable */
}
