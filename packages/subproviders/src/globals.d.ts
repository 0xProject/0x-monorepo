declare module '*.json' {
    const json: any;
    /* tslint:disable */
    export default json;
    /* tslint:enable */
}

// TODO: Move this to `typescript-typings` once it is more fleshed out
declare module 'json-rpc-error' {
    export class InternalError extends Error {
        constructor(err: Error | string);
    }
    export class MethodNotFound extends Error {
        constructor();
    }
}
