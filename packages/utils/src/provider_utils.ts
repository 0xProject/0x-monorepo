import {
    EIP1193Provider,
    JSONRPCErrorCallback,
    JSONRPCRequestPayload,
    SupportedProvider,
    ZeroExProvider,
} from 'ethereum-types';
import * as _ from 'lodash';

export const providerUtils = {
    /**
     * Standardize the supported provider types into our internal provider interface
     * or throw if unsupported provider supplied.
     * @param supportedProvider Potentially supported provider instance
     * @return Provider that conforms of our internal provider interface
     */
    standardizeOrThrow(supportedProvider: SupportedProvider): ZeroExProvider {
        if (supportedProvider === undefined) {
            throw new Error(`supportedProvider cannot be 'undefined'`);
        }
        const provider = {
            isStandardizedProvider: true,
            isMetaMask: (supportedProvider as any).isMetaMask,
            isParity: (supportedProvider as any).isParity,
            stop: (supportedProvider as any).stop,
            enable: (supportedProvider as any).enable,
            sendAsync: _.noop, // Will be replaced
        };
        // Case 1: We've already converted to our ZeroExProvider so noop.
        if ((supportedProvider as any).isStandardizedProvider) {
            return supportedProvider as ZeroExProvider;
        // Case 2: It's a compliant EIP 1193 Provider
        } else if ((supportedProvider as EIP1193Provider).isEIP1193) {
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
        // Case 3: The provider has a `sendAsync` method, so we use it.
        } else if (!_.isUndefined((supportedProvider as any).sendAsync)) {
            provider.sendAsync = (supportedProvider as any).sendAsync.bind(supportedProvider);
            return provider;
        // Case 4: The provider does not have a `sendAsync` method but does have a `send` method
        // It is most likely a Web3.js provider so we remap it to `sendAsync`. We only support
        // Web3.js@1.0.0-beta.38 and above.
        } else if (!_.isUndefined((supportedProvider as any).send)) {
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
