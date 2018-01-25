import * as _ from 'lodash';

import { AsyncMethod, SyncMethod, ZeroExError } from '../types';

import { constants } from './constants';

type ErrorTransformer = (err: Error) => Error;

const contractCallErrorTransformer = (error: Error) => {
    if (_.includes(error.message, constants.INVALID_JUMP_PATTERN)) {
        return new Error(ZeroExError.InvalidJump);
    }
    if (_.includes(error.message, constants.OUT_OF_GAS_PATTERN)) {
        return new Error(ZeroExError.OutOfGas);
    }
    return error;
};

const schemaErrorTransformer = (error: Error) => {
    if (_.includes(error.message, constants.INVALID_TAKER_FORMAT)) {
        const errMsg =
            'Order taker must be of type string. If you want anyone to be able to fill an order - pass ZeroEx.NULL_ADDRESS';
        return new Error(errMsg);
    }
    return error;
};

/**
 * Source: https://stackoverflow.com/a/29837695/3546986
 */
const asyncErrorHandlerFactory = (errorTransformer: ErrorTransformer) => {
    const asyncErrorHandlingDecorator = (
        target: object,
        key: string | symbol,
        descriptor: TypedPropertyDescriptor<AsyncMethod>,
    ) => {
        const originalMethod = descriptor.value as AsyncMethod;

        // Do not use arrow syntax here. Use a function expression in
        // order to use the correct value of `this` in this method
        // tslint:disable-next-line:only-arrow-functions
        descriptor.value = async function(...args: any[]) {
            try {
                const result = await originalMethod.apply(this, args);
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
        target: object,
        key: string | symbol,
        descriptor: TypedPropertyDescriptor<SyncMethod>,
    ) => {
        const originalMethod = descriptor.value as SyncMethod;

        // Do not use arrow syntax here. Use a function expression in
        // order to use the correct value of `this` in this method
        // tslint:disable-next-line:only-arrow-functions
        descriptor.value = function(...args: any[]) {
            try {
                const result = originalMethod.apply(this, args);
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
const zeroExErrorTransformer = _.flow(schemaErrorTransformer, contractCallErrorTransformer);

export const decorators = {
    asyncZeroExErrorHandler: asyncErrorHandlerFactory(zeroExErrorTransformer),
    syncZeroExErrorHandler: syncErrorHandlerFactory(zeroExErrorTransformer),
};
