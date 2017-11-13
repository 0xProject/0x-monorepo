import * as _ from 'lodash';
import {constants} from './constants';
import {AsyncMethod, ZeroExError} from '../types';

export const decorators = {
    /**
     * Source: https://stackoverflow.com/a/29837695/3546986
     */
    contractCallErrorHandler(target: object,
                             key: string|symbol,
                             descriptor: TypedPropertyDescriptor<AsyncMethod>,
    ): TypedPropertyDescriptor<AsyncMethod> {
        const originalMethod = (descriptor.value as AsyncMethod);

        // Do not use arrow syntax here. Use a function expression in
        // order to use the correct value of `this` in this method
        // tslint:disable-next-line:only-arrow-functions
        descriptor.value =  async function(...args: any[]) {
            try {
                const result = await originalMethod.apply(this, args);
                return result;
            } catch (error) {
                if (_.includes(error.message, constants.INVALID_JUMP_PATTERN)) {
                    throw new Error(ZeroExError.InvalidJump);
                }
                if (_.includes(error.message, constants.OUT_OF_GAS_PATTERN)) {
                    throw new Error(ZeroExError.OutOfGas);
                }
                throw error;
            }
        };

        return descriptor;
    },
};
