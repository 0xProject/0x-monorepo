import * as chai from 'chai';
import chaiAsPromised = require('chai-as-promised');
import * as dirtyChai from 'dirty-chai';

export const chaiSetup = {
    configure(): void {
        chai.config.includeStack = true;
        chai.use(dirtyChai);
        chai.use(chaiAsPromised);
    },
};
