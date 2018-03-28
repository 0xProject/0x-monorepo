declare module 'web3_beta';
declare module 'request-promise-native';

// semver-sort declarations
declare module 'semver-sort' {
    const desc: (versions: string[]) => string[];
}

declare module '*.json' {
    const json: any;
    /* tslint:disable */
    export default json;
    /* tslint:enable */
}
