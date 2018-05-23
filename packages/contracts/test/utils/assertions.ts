import * as chai from 'chai';
import * as _ from 'lodash';

import { constants } from '../../util/constants';

const expect = chai.expect;

// throws if the given promise does not reject with one of two expected error
// messages.
export const expectRevertOrAlwaysFailingTransaction = <T>(p: Promise<T>) => {
    return expect(p)
        .to.be.rejected()
        .then(e => {
            expect(e).to.satisfy(
                (err: Error) =>
                    _.includes(err.message, constants.REVERT) ||
                    _.includes(err.message, constants.ALWAYS_FAILING_TRANSACTION),
            );
        });
};
