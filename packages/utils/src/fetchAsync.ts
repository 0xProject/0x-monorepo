import isNode = require('detect-node');
import 'isomorphic-fetch';
// WARNING: This needs to be imported after isomorphic-fetch: https://github.com/mo/abortcontroller-polyfill#using-it-on-browsers-without-fetch
// tslint:disable-next-line:ordered-imports
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only';

export const fetchAsync = async (
    endpoint: string,
    options: RequestInit = {},
    timeoutMs: number = 20000,
): Promise<Response> => {
    if (options.signal || (options as any).timeout) {
        throw new Error(
            'Cannot call fetchAsync with options.signal or options.timeout. To set a timeout, please use the supplied "timeoutMs" parameter.',
        );
    }
    let optionsWithAbortParam;
    if (!isNode) {
        const controller = new AbortController();
        const signal = controller.signal;
        setTimeout(() => {
            controller.abort();
        }, timeoutMs);
        optionsWithAbortParam = {
            signal,
            ...options,
        };
    } else {
        // HACK: the `timeout` param only exists in `node-fetch`, and not on the `isomorphic-fetch`
        // `RequestInit` type. Since `isomorphic-fetch` conditionally wraps `node-fetch` when the
        // execution environment is `Node.js`, we need to cast it to `any` in that scenario.
        optionsWithAbortParam = {
            timeout: timeoutMs,
            ...options,
        } as any;
    }

    const response = await fetch(endpoint, optionsWithAbortParam);
    return response;
};
