import * as chai from 'chai';
import * as _ from 'lodash';

import { DoneCallback } from '@0xproject/types';

const expect = chai.expect;

export const callbackErrorReporter = {
    reportNoErrorCallbackErrors(done: DoneCallback, expectToBeCalledOnce = true) {
        const callback = <T>(f?: (value: T) => void) => {
            const wrapped = (value: T) => {
                if (_.isUndefined(f)) {
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
    reportNodeCallbackErrors(done: DoneCallback, expectToBeCalledOnce = true) {
        const callback = <T>(f?: (value: T) => void) => {
            const wrapped = (error: Error | null, value: T | undefined) => {
                if (!_.isNull(error)) {
                    done(error);
                } else {
                    if (_.isUndefined(f)) {
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
    assertNodeCallbackError(done: DoneCallback, errMsg: string) {
        const wrapped = <T>(error: Error | null, value: T | undefined) => {
            if (_.isNull(error)) {
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
