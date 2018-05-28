import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';

import { TestLibMemContract } from '../../src/contract_wrappers/generated/test_lib_mem';
import { artifacts } from '../../src/utils/artifacts';
import { chaiSetup } from '../../src/utils/chai_setup';
import { provider, txDefaults, web3Wrapper } from '../../src/utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;

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

    describe('memcpy', () => {

        // Create memory 0x000102...FF
        const memSize = 256;
        const memory = (new Uint8Array(memSize)).map((_, i) => i);
        const memHex = toHex(memory);

        // Reference implementation to test against
        const refMemcpy = (mem: Uint8Array, dest: number, source: number, length: number): Uint8Array =>
            Uint8Array.from(memory).copyWithin(dest, source, source + length);

        // Test vectors: destination, source, length, job description
        type Tests = Array<[number, number, number, string]>;

        const test = (tests: Tests) =>
            tests.forEach(([dest, source, length, job]) =>
                it(job, async () => {
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

        test([[0, 0, 0, 'copies zero bytes with overlap']]);

        describe('copies forward', () => test([
            [128, 0, 0, 'zero bytes'],
            [128, 0, 1, 'one byte'],
            [128, 0, 11, 'eleven bytes'],
            [128, 0, 31, 'thirty-one bytes'],
            [128, 0, 32, 'one word'],
            [128, 0, 64, 'two words'],
            [128, 0, 96, 'three words'],
            [128, 0, 33, 'one word and one byte'],
            [128, 0, 72, 'two words and eight bytes'],
            [128, 0, 100, 'three words and four bytes'],
        ]));

        describe('copies forward within one word', () => test([
            [16, 0, 0, 'zero bytes'],
            [16, 0, 1, 'one byte'],
            [16, 0, 11, 'eleven bytes'],
            [16, 0, 16, 'sixteen bytes'],
        ]));

        describe('copies forward with one byte overlap', () => test([
            [0, 0, 1, 'one byte'],
            [10, 0, 11, 'eleven bytes'],
            [30, 0, 31, 'thirty-one bytes'],
            [31, 0, 32, 'one word'],
            [32, 0, 33, 'one word and one byte'],
            [71, 0, 72, 'two words and eight bytes'],
            [99, 0, 100, 'three words and four bytes'],
        ]));

        describe('copies forward with thirty-one bytes overlap', () => test([
            [0, 0, 31, 'thirty-one bytes'],
            [1, 0, 32, 'one word'],
            [2, 0, 33, 'one word and one byte'],
            [41, 0, 72, 'two words and eight bytes'],
            [69, 0, 100, 'three words and four bytes'],
        ]));

        describe('copies forward with one word overlap', () => test([
            [0, 0, 32, 'one word'],
            [1, 0, 33, 'one word and one byte'],
            [41, 0, 72, 'two words and eight bytes'],
            [69, 0, 100, 'three words and four bytes'],
        ]));

        describe('copies forward with one word and one byte overlap', () => test([
            [0, 0, 33, 'one word and one byte'],
            [40, 0, 72, 'two words and eight bytes'],
            [68, 0, 100, 'three words and four bytes'],
        ]));

        describe('copies forward with two words overlap', () => test([
            [0, 0, 64, 'two words'],
            [8, 0, 72, 'two words and eight bytes'],
            [36, 0, 100, 'three words and four bytes'],
        ]));

        describe('copies forward within one word and one byte overlap', () => test([
            [0, 0, 1, 'one byte'],
            [10, 0, 11, 'eleven bytes'],
            [15, 0, 16, 'sixteen bytes'],
        ]));

        describe('copies backward', () => test([
            [0, 128, 0, 'zero bytes'],
            [0, 128, 1, 'one byte'],
            [0, 128, 11, 'eleven bytes'],
            [0, 128, 31, 'thirty-one bytes'],
            [0, 128, 32, 'one word'],
            [0, 128, 64, 'two words'],
            [0, 128, 96, 'three words'],
            [0, 128, 33, 'one word and one byte'],
            [0, 128, 72, 'two words and eight bytes'],
            [0, 128, 100, 'three words and four bytes'],
        ]));

        describe('copies backward within one word', () => test([
            [0, 16, 0, 'zero bytes'],
            [0, 16, 1, 'one byte'],
            [0, 16, 11, 'eleven bytes'],
            [0, 16, 16, 'sixteen bytes'],
        ]));

        describe('copies backward with one byte overlap', () => test([
            [0, 0, 1, 'one byte'],
            [0, 10, 11, 'eleven bytes'],
            [0, 30, 31, 'thirty-one bytes'],
            [0, 31, 32, 'one word'],
            [0, 32, 33, 'one word and one byte'],
            [0, 71, 72, 'two words and eight bytes'],
            [0, 99, 100, 'three words and four bytes'],
        ]));

        describe('copies backward with thirty-one bytes overlap', () => test([
            [0, 0, 31, 'thirty-one bytes'],
            [0, 1, 32, 'one word'],
            [0, 2, 33, 'one word and one byte'],
            [0, 41, 72, 'two words and eight bytes'],
            [0, 69, 100, 'three words and four bytes'],
        ]));

        describe('copies backward with one word overlap', () => test([
            [0, 0, 32, 'one word'],
            [0, 1, 33, 'one word and one byte'],
            [0, 41, 72, 'two words and eight bytes'],
            [0, 69, 100, 'three words and four bytes'],
        ]));

        describe('copies backward with one word and one byte overlap', () => test([
            [0, 0, 33, 'one word and one byte'],
            [0, 40, 72, 'two words and eight bytes'],
            [0, 68, 100, 'three words and four bytes'],
        ]));

        describe('copies backward with two words overlap', () => test([
            [0, 0, 64, 'two words'],
            [0, 8, 72, 'two words and eight bytes'],
            [0, 36, 100, 'three words and four bytes'],
        ]));

        describe('copies forward within one word and one byte overlap', () => test([
            [0, 0, 1, 'one byte'],
            [0, 10, 11, 'eleven bytes'],
            [0, 15, 16, 'sixteen bytes'],
        ]));

    });
});
