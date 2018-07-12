import { FetchRequest } from '@0xproject/types';
import 'isomorphic-fetch';

export const fetchAsync = async (
    endpoint: string,
    options: FetchRequest,
    timeoutMs: number = 20000,
): Promise<Response> => {
    let finalOptions;
    if ((process as any).browser === true) {
        const controller = new AbortController();
        const signal = controller.signal;
        setTimeout(() => {
            controller.abort();
        }, timeoutMs);
        finalOptions = {
            signal,
            ...options,
        };
    } else {
        finalOptions = {
            timeout: timeoutMs,
            ...options,
        };
    }

    const response = await fetch(endpoint, finalOptions);
    return response;
};
