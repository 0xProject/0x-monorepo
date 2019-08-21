import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import ChaiBigNumber = require('chai-bignumber');
import * as dirtyChai from 'dirty-chai';
import 'mocha';

import { NetworkId } from '@0x/contract-addresses';

import { isAddressWhitelistedAsync } from '../src';

chai.config.includeStack = true;
chai.use(ChaiBigNumber());
chai.use(dirtyChai);
chai.use(chaiAsPromised);
const expect = chai.expect;

describe('whitelist', () => {
    it('should return false for an empty input address', async () => {
        expect(await isAddressWhitelistedAsync(NetworkId.Ganache, '')).to.be.false();
    });
});
