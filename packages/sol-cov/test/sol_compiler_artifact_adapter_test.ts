import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';
import * as path from 'path';

import { SolCompilerArtifactAdapter } from '../src/artifact_adapters/sol_compiler_artifact_adapter';

const expect = chai.expect;

describe('SolCompilerArtifactAdapter', () => {
    describe('#collectContractsData', () => {
        it('correctly collects contracts data', async () => {
            const artifactsPath = path.resolve(__dirname, 'fixtures/artifacts');
            const sourcesPath = path.resolve(__dirname, 'fixtures/contracts');
            const zeroExArtifactsAdapter = new SolCompilerArtifactAdapter(artifactsPath, sourcesPath);
            const contractsData = await zeroExArtifactsAdapter.collectContractsDataAsync();
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
