import * as chai from 'chai';
import * as _ from 'lodash';
import 'make-promises-safe';
import 'mocha';
import * as path from 'path';

import { collectContractsData } from '../src/collect_contract_data';

const expect = chai.expect;

describe('Collect contracts data', () => {
    describe('#collectContractsData', () => {
        it('correctly collects contracts data', () => {
            const artifactsPath = path.resolve(__dirname, 'fixtures/artifacts');
            const sourcesPath = path.resolve(__dirname, 'fixtures/contracts');
            const contractsData = collectContractsData(artifactsPath, sourcesPath);
            _.forEach(contractsData, contractData => {
                expect(contractData).to.have.keys([
                    'sourceCodes',
                    'sources',
                    'sourceMap',
                    'sourceMapRuntime',
                    'bytecode',
                    'runtimeBytecode',
                ]);
            });
        });
    });
});
