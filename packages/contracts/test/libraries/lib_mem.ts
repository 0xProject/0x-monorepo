import { LogWithDecodedArgs, TransactionReceiptWithDecodedLogs, ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import BN = require('bn.js');
import * as chai from 'chai';
import ethUtil = require('ethereumjs-util');
import * as Web3 from 'web3';

import { TestLibMemContract } from '../../src/contract_wrappers/generated/test_lib_mem';
import { artifacts } from '../../src/utils/artifacts';
import { chaiSetup } from '../../src/utils/chai_setup';
import { constants } from '../../src/utils/constants';
import { AssetProxyId } from '../../src/utils/types';
import { provider, txDefaults, web3Wrapper } from '../../src/utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe.only('LibMem', () => {
    let owner: string;
    let testLibMem: TestLibMemContract;

    before(async () => {
        // Setup accounts & addresses
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = accounts[0];
        // Deploy TestLibMem
        testLibMem = await TestLibMemContract.deployFrom0xArtifactAsync(artifacts.TestLibMem, provider, txDefaults);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('LibMem', () => {
        it('should )', async () => {
            await testLibMem.test1.sendTransactionAsync();
        });

        it('should )', async () => {
            await testLibMem.test2.sendTransactionAsync();
        });

        it('should )', async () => {
            await testLibMem.test3.sendTransactionAsync();
        });

        it('should )', async () => {
            await testLibMem.test4.sendTransactionAsync();
        });

        it('should )', async () => {
            await testLibMem.test5.sendTransactionAsync();
        });

        it('should )', async () => {
            await testLibMem.test6.sendTransactionAsync();
        });

        it('should )', async () => {
            return expect(testLibMem.test7.sendTransactionAsync()).to.be.rejectedWith(constants.REVERT);
        });
    });
});
