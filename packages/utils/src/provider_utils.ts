import {
    EIP1193Provider,
    JSONRPCErrorCallback,
    JSONRPCRequestPayload,
    Provider,
    SupportedProvider,
} from 'ethereum-types';
import * as _ from 'lodash';

export const providerUtils = {
    /**
     * Standardize the supported provider types into our internal provider interface
     * or throw if unsupported provider supplied.
     * @param supportedProvider Potentially supported provider instance
     * @return Provider that conforms of our internal provider interface
     */
    standardizeOrThrow(supportedProvider: SupportedProvider): Provider {
        if ((supportedProvider as EIP1193Provider).isEIP1193) {
            const provider = supportedProvider as Provider;
            provider.sendAsync = (payload: JSONRPCRequestPayload, callback: JSONRPCErrorCallback) => {
                    const method = payload.method;
                    const params = payload.params;
                    (supportedProvider as EIP1193Provider)
                        .send(method, params)
                        .then((result: any) => {
                            callback(null, result);
                        })
                        .catch((err: Error) => {
                            callback(err);
                        });
                };
            return provider;
        } else if (_.isUndefined((supportedProvider as any).sendAsync)) {
            // An early version of Web3@1.0 Beta provider only has an async `send` method so
            // we re-assign the send method so that early Web3@1.0 Beta providers work with @0x/web3-wrapper
            const provider = supportedProvider as Provider;
            provider.sendAsync = (supportedProvider as any).send;
            return provider;
        } else if (!_.isUndefined((supportedProvider as any).sendAsync)) {
            return supportedProvider as Provider;
        } else if ((supportedProvider as any).host) {
            // HACK(fabio): Later Web3@1.0 Beta modified their `send` method to comply with EIP1193 but did not add the
            // `isEIP1193` flag. The only common identifier across Web3.js providers is that they all have
            // a `host` property, so we check for it's existence. We put this check last to make it less likely
            // that this condition is hit for other providers that also expose a `host` property.
            const provider = supportedProvider as Provider;
            provider.sendAsync = (payload: JSONRPCRequestPayload, callback: JSONRPCErrorCallback) => {
                    const method = payload.method;
                    const params = payload.params;
                    (supportedProvider as any)
                        .send(method, params)
                        .then((result: any) => {
                            callback(null, result);
                        })
                        .catch((err: Error) => {
                            callback(err);
                        });
                };
            return provider;
        }
        throw new Error(
            `Unsupported provider found. Please make sure it conforms to one of the supported providers. See 'Provider' type in 'ethereum-types' package.`,
        );
    },
};
