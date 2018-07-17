declare module 'json-rpc-error' {
    export class InternalError extends Error {
        constructor(err: Error | string);
    }
    export class MethodNotFound extends Error {
        constructor();
    }
}
