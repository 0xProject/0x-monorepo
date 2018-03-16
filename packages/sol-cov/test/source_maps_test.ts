import * as chai from 'chai';
import * as fs from 'fs';
import * as _ from 'lodash';
import 'mocha';
import * as path from 'path';

import { getLocationByOffset, parseSourceMap } from '../src/source_maps';

const expect = chai.expect;

const simplestContractBaseName = 'Simplest.sol';
const simplestContractFileName = path.resolve(__dirname, 'fixtures/contracts', simplestContractBaseName);
const simplestContract = fs.readFileSync(simplestContractFileName).toString();

describe('source maps', () => {
    describe('#getLocationByOffset', () => {
        it('correctly computes location by offset', () => {
            const locationByOffset = getLocationByOffset(simplestContract);
            const expectedLocationByOffset = {
                '0': { line: 1, column: 0 },
                '1': { line: 1, column: 1 },
                '2': { line: 1, column: 2 },
                '3': { line: 1, column: 3 },
                '4': { line: 1, column: 4 },
                '5': { line: 1, column: 5 },
                '6': { line: 1, column: 6 },
                '7': { line: 1, column: 7 },
                '8': { line: 1, column: 8 },
                '9': { line: 1, column: 9 },
                '10': { line: 1, column: 10 },
                '11': { line: 1, column: 11 },
                '12': { line: 1, column: 12 },
                '13': { line: 1, column: 13 },
                '14': { line: 1, column: 14 },
                '15': { line: 1, column: 15 },
                '16': { line: 1, column: 16 },
                '17': { line: 1, column: 17 },
                '18': { line: 1, column: 18 },
                '19': { line: 1, column: 19 },
                '20': { line: 2, column: 0 },
                '21': { line: 2, column: 1 },
                '22': { line: 3, column: 0 },
            };
            expect(locationByOffset).to.be.deep.equal(expectedLocationByOffset);
        });
    });
    describe('#parseSourceMap', () => {
        it('correctly parses the source map', () => {
            // This is the source map and bytecode for an empty contract like Example.sol
            const srcMap = '0:21:0:-;;;;;;;;;;;;;;;;;';
            const bytecodeHex =
                '60606040523415600e57600080fd5b603580601b6000396000f3006060604052600080fd00a165627a7a72305820377cdef690e46589f40efeef14d8ef73504af059fb3fd46f1da3cd2fc52ef7890029';
            const sources = [simplestContractBaseName];
            const pcToSourceRange = parseSourceMap([simplestContract], srcMap, bytecodeHex, sources);
            const expectedSourceRange = {
                location: {
                    start: { line: 1, column: 0 },
                    end: { line: 2, column: 1 },
                },
                fileName: simplestContractBaseName,
            };
            _.forEach(pcToSourceRange, sourceRange => {
                // Solidity source maps are too short and we map some instructions to undefined
                // Source: https://github.com/ethereum/solidity/issues/3741
                if (!_.isUndefined(sourceRange)) {
                    expect(sourceRange).to.be.deep.equal(expectedSourceRange);
                }
            });
        });
    });
});
