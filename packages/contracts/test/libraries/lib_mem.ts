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

// BUG: Ideally we would use Buffer.from(memory).toString('hex')
// https://github.com/Microsoft/TypeScript/issues/23155
const toHex = (buf: Uint8Array): string =>
    buf.reduce((a, v) => a + ('00' + v.toString(16)).slice(-2), '0x');

const fromHex = (str: string): Uint8Array =>
    Uint8Array.from(Buffer.from(str.slice(2), 'hex'));

describe('LibMem', () => {
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

    describe('memcpy', () => {

        // Create memory 0x000102...FF
        const memSize = 256;
        const memory = (new Uint8Array(memSize)).map((_, i) => i);
        const memHex = toHex(memory);

        // Reference implementation to test against
        const refMemcpy = (mem: Uint8Array, dest: number, source: number, length: number): Uint8Array =>
            Uint8Array.from(memory).copyWithin(dest, source, source + length);

        // Test vectors: destination, source, length, job description
        const tests: Array<[number, number, number, string]> = [
            [1, 5, 4, 'four bytes within one word'],
        ];

        // Construct test cases
        tests.forEach(([dest, source, length, job]) =>
            it(`copies ${job}`, async () => {
                const expected = refMemcpy(memory, dest, source, length);
                const resultStr = await testLibMem.testMemcpy.callAsync(
                    memHex,
                    new BigNumber(dest),
                    new BigNumber(source),
                    new BigNumber(length),
                );
                const result = fromHex(resultStr);
                expect(result).to.deep.equal(expected);
            }),
        );

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
            return expect(testLibMem.test7.sendTransactionAsync()).to.be.rejectedWith(constants.REVERT );
        });
    });
});
