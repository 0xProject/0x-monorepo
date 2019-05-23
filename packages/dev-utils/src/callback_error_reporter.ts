import * as chai from 'chai';
import * as _ from 'lodash';

import { DoneCallback } from '@0x/types';

const expect = chai.expect;

export const callbackErrorReporter = {
    reportNoErrorCallbackErrors(
        done: DoneCallback,
        expectToBeCalledOnce: boolean = true,
    ): <T>(f?: ((value: T) => void) | undefined) => (value: T) => void {
        const callback = <T>(f?: (value: T) => void) => {
            const wrapped = (value: T) => {
                if (f === undefined) {
                    done();
                    return;
                }
                try {
                    f(value);
                    if (expectToBeCalledOnce) {
                        done();
                    }
                } catch (err) {
                    done(err);
                }
            };
            return wrapped;
        };
        return callback;
    },
    reportNodeCallbackErrors(
        done: DoneCallback,
        expectToBeCalledOnce: boolean = true,
    ): <T>(f?: ((value: T) => void) | undefined) => (error: Error | null, value: T | undefined) => void {
        const callback = <T>(f?: (value: T) => void) => {
            const wrapped = (error: Error | null, value: T | undefined) => {
                if (error !== null) {
                    done(error);
                } else {
                    if (f === undefined) {
                        done();
                        return;
                    }
                    try {
                        f(value as T);
                        if (expectToBeCalledOnce) {
                            done();
                        }
                    } catch (err) {
                        done(err);
                    }
                }
            };
            return wrapped;
        };
        return callback;
    },
    assertNodeCallbackError(
        done: DoneCallback,
        errMsg: string,
    ): <T>(error: Error | null, value: T | undefined) => void {
        const wrapped = <T>(error: Error | null, _value: T | undefined) => {
            if (error === null) {
                done(new Error('Expected callback to receive an error'));
            } else {
                try {
                    expect(error.message).to.be.equal(errMsg);
                    done();
                } catch (err) {
                    done(err);
                }
            }
        };
        return wrapped;
    },
};
