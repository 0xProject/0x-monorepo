import * as _ from 'lodash';

import { AsyncMethod, ContractWrappersError, SyncMethod } from '../types';

import { constants } from './constants';

type ErrorTransformer = (err: Error) => Error;

const contractCallErrorTransformer = (error: Error) => {
    if (_.includes(error.message, constants.INVALID_JUMP_PATTERN)) {
        return new Error(ContractWrappersError.InvalidJump);
    }
    if (_.includes(error.message, constants.OUT_OF_GAS_PATTERN)) {
        return new Error(ContractWrappersError.OutOfGas);
    }
    if (_.includes(error.message, constants.REVERT)) {
        const revertReason = error.message.split(constants.REVERT)[1].trim();
        return new Error(revertReason);
    }
    return error;
};

const schemaErrorTransformer = (error: Error) => {
    if (_.includes(error.message, constants.INVALID_TAKER_FORMAT)) {
        const errMsg =
            'Order taker must be of type string. If you want anyone to be able to fill an order - pass NULL_ADDRESS';
        return new Error(errMsg);
    }
    return error;
};

const signatureRequestErrorTransformer = (error: Error) => {
    if (
        _.includes(error.message, constants.METAMASK_USER_DENIED_SIGNATURE_PATTERN) ||
        _.includes(error.message, constants.TRUST_WALLET_USER_DENIED_SIGNATURE_PATTERN)
    ) {
        const errMsg = ContractWrappersError.SignatureRequestDenied;
        return new Error(errMsg);
    }
    return error;
};

/**
 * Source: https://stackoverflow.com/a/29837695/3546986
 */
const asyncErrorHandlerFactory = (errorTransformer: ErrorTransformer) => {
    const asyncErrorHandlingDecorator = (
        _target: object,
        _key: string | symbol,
        descriptor: TypedPropertyDescriptor<AsyncMethod>,
    ) => {
        const originalMethod = descriptor.value as AsyncMethod;

        // Do not use arrow syntax here. Use a function expression in
        // order to use the correct value of `this` in this method
        // tslint:disable-next-line:only-arrow-functions
        descriptor.value = async function(...args: any[]): Promise<any> {
            try {
                const result = await originalMethod.apply(this, args); // tslint:disable-line:no-invalid-this
                return result;
            } catch (error) {
                const transformedError = errorTransformer(error);
                throw transformedError;
            }
        };

        return descriptor;
    };

    return asyncErrorHandlingDecorator;
};

const syncErrorHandlerFactory = (errorTransformer: ErrorTransformer) => {
    const syncErrorHandlingDecorator = (
        _target: object,
        _key: string | symbol,
        descriptor: TypedPropertyDescriptor<SyncMethod>,
    ) => {
        const originalMethod = descriptor.value as SyncMethod;

        // Do not use arrow syntax here. Use a function expression in
        // order to use the correct value of `this` in this method
        // tslint:disable-next-line:only-arrow-functions
        descriptor.value = function(...args: any[]): any {
            try {
                const result = originalMethod.apply(this, args); // tslint:disable-line:no-invalid-this
                return result;
            } catch (error) {
                const transformedError = errorTransformer(error);
                throw transformedError;
            }
        };

        return descriptor;
    };

    return syncErrorHandlingDecorator;
};

// _.flow(f, g) = f ∘ g
const zeroExErrorTransformer = _.flow(
    schemaErrorTransformer,
    contractCallErrorTransformer,
    signatureRequestErrorTransformer,
);

export const decorators = {
    asyncZeroExErrorHandler: asyncErrorHandlerFactory(zeroExErrorTransformer),
    syncZeroExErrorHandler: syncErrorHandlerFactory(zeroExErrorTransformer),
};
