import * as chai from 'chai';
import 'mocha';

import { Compiler } from '../src/compiler';
import { fsWrapper } from '../src/utils/fs_wrapper';
import { CompilerOptions, ContractArtifact, ContractNetworkData, DoneCallback } from '../src/utils/types';

import { exchange_binary } from './fixtures/exchange_bin';
import { constants } from './util/constants';

const expect = chai.expect;

describe('#Compiler', function() {
    this.timeout(constants.timeoutMs);
    const artifactsDir = `${__dirname}/fixtures/artifacts`;
    const contractsDir = `${__dirname}/fixtures/contracts`;
    const exchangeArtifactPath = `${artifactsDir}/Exchange.json`;
    const compilerOpts: CompilerOptions = {
        artifactsDir,
        contractsDir,
        contracts: constants.contracts,
    };
    const compiler = new Compiler(compilerOpts);
    beforeEach((done: DoneCallback) => {
        (async () => {
            if (fsWrapper.doesPathExistSync(exchangeArtifactPath)) {
                await fsWrapper.removeFileAsync(exchangeArtifactPath);
            }
            await compiler.compileAsync();
            done();
        })().catch(done);
    });
    it('should create an Exchange artifact with the correct unlinked binary', async () => {
        const opts = {
            encoding: 'utf8',
        };
        const exchangeArtifactString = await fsWrapper.readFileAsync(exchangeArtifactPath, opts);
        const exchangeArtifact: ContractArtifact = JSON.parse(exchangeArtifactString);
        // The last 43 bytes of the binaries are metadata which may not be equivalent
        const unlinkedBinaryWithoutMetadata = exchangeArtifact.compilerOutput.evm.bytecode.object.slice(2, -86);
        const exchangeBinaryWithoutMetadata = exchange_binary.slice(0, -86);
        expect(unlinkedBinaryWithoutMetadata).to.equal(exchangeBinaryWithoutMetadata);
    });
});
