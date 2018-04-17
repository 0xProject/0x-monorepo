import * as chai from 'chai';
import * as fs from 'fs';
import * as _ from 'lodash';
import 'mocha';
import * as path from 'path';

import { collectCoverageEntries } from '../src/collect_coverage_entries';
import { SingleFileSourceRange } from '../src/types';

const expect = chai.expect;

const getRange = (sourceCode: string, range: SingleFileSourceRange) => {
    const lines = sourceCode.split('\n').slice(range.start.line - 1, range.end.line);
    lines[lines.length - 1] = lines[lines.length - 1].slice(0, range.end.column);
    lines[0] = lines[0].slice(range.start.column);
    return lines.join('\n');
};

describe('Collect coverage entries', () => {
    describe('#collectCoverageEntries', () => {
        it('correctly collects coverage entries for Simplest contract', () => {
            const simplestContractBaseName = 'Simplest.sol';
            const simplestContractFileName = path.resolve(__dirname, 'fixtures/contracts', simplestContractBaseName);
            const simplestContract = fs.readFileSync(simplestContractFileName).toString();
            const coverageEntries = collectCoverageEntries(simplestContract);
            expect(coverageEntries.fnMap).to.be.deep.equal({});
            expect(coverageEntries.branchMap).to.be.deep.equal({});
            expect(coverageEntries.statementMap).to.be.deep.equal({});
            expect(coverageEntries.modifiersStatementIds).to.be.deep.equal([]);
        });
        it('correctly collects coverage entries for SimpleStorage contract', () => {
            const simpleStorageContractBaseName = 'SimpleStorage.sol';
            const simpleStorageContractFileName = path.resolve(
                __dirname,
                'fixtures/contracts',
                simpleStorageContractBaseName,
            );
            const simpleStorageContract = fs.readFileSync(simpleStorageContractFileName).toString();
            const coverageEntries = collectCoverageEntries(simpleStorageContract);
            const fnIds = _.keys(coverageEntries.fnMap);
            expect(coverageEntries.fnMap[fnIds[0]].name).to.be.equal('set');
            expect(coverageEntries.fnMap[fnIds[0]].line).to.be.equal(5);
            const setFunction = `function set(uint x) {
        storedData = x;
    }`;
            expect(getRange(simpleStorageContract, coverageEntries.fnMap[fnIds[0]].loc)).to.be.equal(setFunction);
            expect(coverageEntries.fnMap[fnIds[1]].name).to.be.equal('get');
            expect(coverageEntries.fnMap[fnIds[1]].line).to.be.equal(8);
            const getFunction = `function get() constant returns (uint retVal) {
        return storedData;
    }`;
            expect(getRange(simpleStorageContract, coverageEntries.fnMap[fnIds[1]].loc)).to.be.equal(getFunction);
            expect(coverageEntries.branchMap).to.be.deep.equal({});
            const statementIds = _.keys(coverageEntries.statementMap);
            expect(getRange(simpleStorageContract, coverageEntries.statementMap[statementIds[1]])).to.be.equal(
                'storedData = x',
            );
            expect(getRange(simpleStorageContract, coverageEntries.statementMap[statementIds[3]])).to.be.equal(
                'return storedData;',
            );
            expect(coverageEntries.modifiersStatementIds).to.be.deep.equal([]);
        });
        it('correctly collects coverage entries for AllSolidityFeatures contract', () => {
            const simpleStorageContractBaseName = 'AllSolidityFeatures.sol';
            const simpleStorageContractFileName = path.resolve(
                __dirname,
                'fixtures/contracts',
                simpleStorageContractBaseName,
            );
            const simpleStorageContract = fs.readFileSync(simpleStorageContractFileName).toString();
            const coverageEntries = collectCoverageEntries(simpleStorageContract);
            const fnDescriptions = _.values(coverageEntries.fnMap);
            const fnNames = _.map(fnDescriptions, fnDescription => fnDescription.name);
            const expectedFnNames = [
                'f',
                'c',
                'test',
                'getChoice',
                'Base',
                'Derived',
                'f',
                'f',
                '',
                'g',
                'setData',
                'getData',
                'sendHalf',
                'insert',
                'remove',
                'contains',
                'iterate_start',
                'iterate_valid',
                'iterate_advance',
                'iterate_get',
                'insert',
                'sum',
                'restricted',
                'DualIndex',
                'set',
                'transfer_ownership',
                'lookup',
                '',
                '',
                'sum',
                'someFunction',
                'fun',
                'at',
                'test',
                'get',
                'returnNumber',
                'alloc',
                'ham',
                'getMyTuple',
                'ham',
                'abstain',
                'foobar',
                'foobar',
                'a',
            ];
            expect(fnNames).to.be.deep.equal(expectedFnNames);

            const branchDescriptions = _.values(coverageEntries.branchMap);
            const branchLines = _.map(branchDescriptions, branchDescription => branchDescription.line);
            expect(branchLines).to.be.deep.equal([94, 115, 119, 130, 151, 187]);
            const branchTypes = _.map(branchDescriptions, branchDescription => branchDescription.type);
            expect(branchTypes).to.be.deep.equal(['if', 'if', 'if', 'if', 'binary-expr', 'if']);
        });
    });
});
