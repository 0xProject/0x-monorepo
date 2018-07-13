declare module '*.json' {
    const json: any;
    /* tslint:disable */
    export default json;
    /* tslint:enable */
}

declare module 'detect-node' {
    export const isNode: boolean;
}
