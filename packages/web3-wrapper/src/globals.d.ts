declare module 'web3-utils' {
    import * as BigNumber from 'bignumber.js';

    const toHex: (val: any) => string;
    const isHexStrict: (val: any) => boolean;
    const toDecimal: (val: any) => number;
}

declare module '*.json' {
    const json: any;
    /* tslint:disable */
    export default json;
    /* tslint:enable */
}
