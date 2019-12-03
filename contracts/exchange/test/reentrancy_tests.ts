import { blockchainTests, constants, describe, expect } from '@0x/contracts-test-utils';
import { BigNumber, hexRandom } from '@0x/utils';
import { DataItem, MethodAbi, TupleDataItem } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts } from './artifacts';
import { ReentrancyTesterContract } from './wrappers';

import { constants as TestConstants } from './utils/constants';

blockchainTests.resets('Reentrancy Tests', env => {
    const { ONE_ETHER } = constants;
    // Extract all mutator public functions from the Exchange contract.
    const [NON_REENTRANT_FUNCTIONS, REENTRANT_FUNCTIONS] = (() => {
        const reentrantFunctions = [] as MethodAbi[];
        const nonReentrantFunctions = [] as MethodAbi[];
        for (const method of artifacts.Exchange.compilerOutput.abi as MethodAbi[]) {
            if (
                method.type === 'function' &&
                !method.constant &&
                !_.includes(['view', 'pure'], method.stateMutability)
            ) {
                if (_.includes(TestConstants.REENTRANT_FUNCTIONS as string[], method.name)) {
                    reentrantFunctions.push(method);
                } else {
                    nonReentrantFunctions.push(method);
                }
            }
        }
        return [_.sortBy(nonReentrantFunctions, m => m.name), _.sortBy(reentrantFunctions, m => m.name)];
    })();
    let testerContract: ReentrancyTesterContract;

    // Generates well-constructed input data for an exchange function.
    function createFunctionInputs(item: DataItem[] | DataItem): any {
        if (item instanceof Array) {
            return item.map(createFunctionInputs);
        }
        // Handle tuples.
        if (item.type === 'tuple') {
            const tuple = item as TupleDataItem;
            return _.zipObject(tuple.components.map(c => c.name), tuple.components.map(createFunctionInputs));
        }
        // Handle strings.
        if (item.type === 'string') {
            return _.sampleSize('abcdefghijklmnopqrstuvwxyz'.split(''), 8).join('');
        }
        // Handle bytes.
        if (item.type === 'bytes') {
            return hexRandom(36);
        }
        // Handle addresses.
        if (item.type === 'address') {
            return hexRandom(constants.ADDRESS_LENGTH);
        }
        // Handle bools.
        if (item.type === 'bool') {
            return _.sample([true, false]);
        }
        // Handle arrays.
        let m = /^(.+)(\[(\d*)\])$/.exec(item.type);
        if (m) {
            const length = parseInt(m[3], 10) || 1;
            const subType = item.type.substr(0, item.type.length - m[2].length);
            return _.times(length, () =>
                createFunctionInputs({
                    ...item,
                    type: subType,
                }),
            );
        }
        // Handle integers.
        m = /^u?int(\d+)?$/.exec(item.type);
        if (m) {
            const size = parseInt(m[1], 10) || 256;
            const isSigned = item.type[0] === 'i';
            let n = ONE_ETHER.mod(new BigNumber(2).pow(size));
            if (isSigned) {
                n = n.dividedToIntegerBy(2).times(_.sample([-1, 1]) as number);
            }
            return n;
        }
        // Handle fixed size bytes.
        m = /^bytes(\d+)$/.exec(item.type);
        if (m) {
            const size = parseInt(m[1], 10) || 32;
            return hexRandom(size);
        }
        throw new Error(`Unhandled input type: ${item.type}`);
    }

    before(async () => {
        testerContract = await ReentrancyTesterContract.deployFrom0xArtifactAsync(
            artifacts.ReentrancyTester,
            env.provider,
            env.txDefaults,
            {},
        );
    });

    describe('non-reentrant functions', () => {
        for (const fn of NON_REENTRANT_FUNCTIONS) {
            it(`${fn.name}()`, async () => {
                const inputs = createFunctionInputs(fn.inputs);
                const callData = (testerContract as any)[fn.name](...inputs).getABIEncodedTransactionData();
                const isReentrant = await testerContract.isReentrant(callData).callAsync();
                expect(isReentrant).to.be.false();
            });
        }
    });

    describe('reentrant functions', () => {
        for (const fn of REENTRANT_FUNCTIONS) {
            it(`${fn.name}()`, async () => {
                const inputs = createFunctionInputs(fn.inputs);
                const callData = (testerContract as any)[fn.name](...inputs).getABIEncodedTransactionData();
                const isReentrant = await testerContract.isReentrant(callData).callAsync();
                expect(isReentrant).to.be.true();
            });
        }
    });
});
