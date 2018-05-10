import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import chaiAsPromised = require('chai-as-promised');
import ChaiBigNumber = require('chai-bignumber');
import * as dirtyChai from 'dirty-chai';

export const chaiSetup = {
    configure(): void {
        chai.config.includeStack = true;
        chai.use(ChaiBigNumber());
        chai.use(dirtyChai);
        chai.use(chaiAsPromised);

        // Node uses '.inspect()' instead of '.toString()' for log messages
        // HACK: Typescript won't allow me to mess with BigNumber.prototype
        // directly, so I create an instance and then get the prototype.
        Object.getPrototypeOf(new BigNumber(0)).inspect = function() {
            return this.toString();
        };
    },
};
