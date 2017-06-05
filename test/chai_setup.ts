import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';
import ChaiBigNumber = require('chai-bignumber');
import chaiAsPromised = require('chai-as-promised');

export class ChaiSetup {
    public static configure(): void {
        chai.config.includeStack = true;
        chai.use(ChaiBigNumber());
        chai.use(dirtyChai);
        chai.use(chaiAsPromised);
    }
}
