import {
    EIP1193Provider,
    JSONRPCErrorCallback,
    JSONRPCRequestPayload,
    Provider,
    Web3WrapperProvider,
} from 'ethereum-types';
import * as _ from 'lodash';

export const providerUtils = {
    standardizeOrThrow(provider: Provider): Web3WrapperProvider {
        if ((provider as EIP1193Provider).isEIP1193) {
            const web3WrapperProvider: Web3WrapperProvider = {
                sendAsync: (payload: JSONRPCRequestPayload, callback: JSONRPCErrorCallback) => {
                    const method = payload.method;
                    const params = payload.params;
                    (provider as EIP1193Provider)
                        .send(method, params)
                        .then((result: any) => {
                            callback(null, result);
                        })
                        .catch((err: Error) => {
                            callback(err);
                        });
                },
            };
            return web3WrapperProvider;
        } else if (_.isUndefined((provider as any).sendAsync)) {
            // Web3@1.0 provider doesn't support synchronous http requests,
            // so it only has an async `send` method, instead of a `send` and `sendAsync` in web3@0.x.x`
            // We re-assign the send method so that Web3@1.0 providers work with @0x/web3-wrapper
            const web3WrapperProvider: Web3WrapperProvider = {
                sendAsync: (provider as any).send,
            };
            return web3WrapperProvider;
        } else if (!_.isUndefined((provider as any).sendAsync)) {
            return provider as Web3WrapperProvider;
        } else if ((provider as any).host) {
            // HACK(fabio): Web3 1.0 Beta modified their `send` method to comply with EIP1193 but did not add the
            // `isEIP1193` flag. The only common identifier across Web3 providers is that they all have
            // a `host` property, so we check for it's existence. We put this check last to make it less likely
            // that this condition is hit for other providers that also expose a `host` property.
            const web3WrapperProvider: Web3WrapperProvider = {
                sendAsync: (payload: JSONRPCRequestPayload, callback: JSONRPCErrorCallback) => {
                    const method = payload.method;
                    const params = payload.params;
                    (provider as any)
                        .send(method, params)
                        .then((result: any) => {
                            callback(null, result);
                        })
                        .catch((err: Error) => {
                            callback(err);
                        });
                },
            };
            return web3WrapperProvider;
        }
        throw new Error(
            `Unsupported provider found. Please make sure it conforms to one of the supported providers. See 'Provider' type in 'ethereum-types' package.`,
        );
    },
};
