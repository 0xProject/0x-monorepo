import { hexUtils } from '@0x/utils';
import * as chai from 'chai';
import { CompilerOptions, ContractArtifact } from 'ethereum-types';
import 'mocha';
import { join } from 'path';

import { Compiler } from '../src/compiler';
import { fsWrapper } from '../src/utils/fs_wrapper';

import { exchange_binary } from './fixtures/exchange_bin';
import { v6_contract_binary } from './fixtures/v6_contract_bin';
import { chaiSetup } from './util/chai_setup';
import { constants } from './util/constants';

chaiSetup.configure();
const expect = chai.expect;

const METADATA_SIZE = 43;

describe('#Compiler', function(): void {
    this.timeout(constants.timeoutMs); // tslint:disable-line:no-invalid-this
    const artifactsDir = `${__dirname}/fixtures/artifacts`;
    const contractsDir = `${__dirname}/fixtures/contracts`;
    const compilerOpts: CompilerOptions = {
        artifactsDir,
        contractsDir,
        contracts: constants.contracts,
    };
    it('should create a Compiler with empty opts', async () => {
        const _compiler = new Compiler(); // tslint:disable-line no-unused-variable
    });
    it('should create an Exchange artifact with the correct unlinked binary', async () => {
        compilerOpts.contracts = ['Exchange'];

        const exchangeArtifactPath = `${artifactsDir}/Exchange.json`;
        if (fsWrapper.doesPathExistSync(exchangeArtifactPath)) {
            await fsWrapper.removeFileAsync(exchangeArtifactPath);
        }

        await new Compiler(compilerOpts).compileAsync();

        const opts = {
            encoding: 'utf8',
        };
        const exchangeArtifactString = await fsWrapper.readFileAsync(exchangeArtifactPath, opts);
        const exchangeArtifact: ContractArtifact = JSON.parse(exchangeArtifactString);
        const unlinkedBinaryWithoutMetadata = hexUtils.slice(
            exchangeArtifact.compilerOutput.evm.bytecode.object,
            0,
            -METADATA_SIZE,
        );
        const exchangeBinaryWithoutMetadata = hexUtils.slice(exchange_binary, 0, -METADATA_SIZE);
        expect(unlinkedBinaryWithoutMetadata).to.equal(exchangeBinaryWithoutMetadata);
    });
    it("should throw when Whatever.sol doesn't contain a Whatever contract", async () => {
        const contract = 'BadContractName';

        const exchangeArtifactPath = `${artifactsDir}/${contract}.json`;
        if (fsWrapper.doesPathExistSync(exchangeArtifactPath)) {
            await fsWrapper.removeFileAsync(exchangeArtifactPath);
        }

        compilerOpts.contracts = [contract];
        const compiler = new Compiler(compilerOpts);

        expect(compiler.compileAsync()).to.be.rejected();
    });
    describe('after a successful compilation', () => {
        const contract = 'Exchange';
        let artifactPath: string;
        let artifactCreatedAtMs: number;
        beforeEach(async () => {
            compilerOpts.contracts = [contract];

            artifactPath = `${artifactsDir}/${contract}.json`;
            if (fsWrapper.doesPathExistSync(artifactPath)) {
                await fsWrapper.removeFileAsync(artifactPath);
            }

            await new Compiler(compilerOpts).compileAsync();

            artifactCreatedAtMs = (await fsWrapper.statAsync(artifactPath)).mtimeMs;
        });
        it('recompilation should update artifact when source has changed', async () => {
            // append some meaningless data to the contract, so that its hash
            // will change, so that the compiler will decide to recompile it.
            await fsWrapper.appendFileAsync(join(contractsDir, `${contract}.sol`), ' ');

            await new Compiler(compilerOpts).compileAsync();

            const artifactModifiedAtMs = (await fsWrapper.statAsync(artifactPath)).mtimeMs;

            expect(artifactModifiedAtMs).to.be.greaterThan(artifactCreatedAtMs);
        });
        it("recompilation should NOT update artifact when source hasn't changed", async () => {
            await new Compiler(compilerOpts).compileAsync();

            const artifactModifiedAtMs = (await fsWrapper.statAsync(artifactPath)).mtimeMs;

            expect(artifactModifiedAtMs).to.equal(artifactCreatedAtMs);
        });
    });
    it('should only compile what was requested', async () => {
        // remove all artifacts
        for (const artifact of await fsWrapper.readdirAsync(artifactsDir)) {
            await fsWrapper.removeFileAsync(join(artifactsDir, artifact));
        }

        // compile EmptyContract
        compilerOpts.contracts = ['EmptyContract'];
        await new Compiler(compilerOpts).compileAsync();

        // make sure the artifacts dir only contains EmptyContract.json
        for (const artifact of await fsWrapper.readdirAsync(artifactsDir)) {
            expect(artifact).to.equal('EmptyContract.json');
        }
    });
    it('should compile a V0.6 contract', async () => {
        compilerOpts.contracts = ['V6Contract'];

        const artifactPath = `${artifactsDir}/V6Contract.json`;
        if (fsWrapper.doesPathExistSync(artifactPath)) {
            await fsWrapper.removeFileAsync(artifactPath);
        }

        await new Compiler(compilerOpts).compileAsync();

        const opts = {
            encoding: 'utf8',
        };
        const exchangeArtifactString = await fsWrapper.readFileAsync(artifactPath, opts);
        const exchangeArtifact: ContractArtifact = JSON.parse(exchangeArtifactString);
        const actualBinaryWithoutMetadata = hexUtils.slice(
            exchangeArtifact.compilerOutput.evm.bytecode.object,
            0,
            -METADATA_SIZE,
        );
        const expectedBinaryWithoutMetadata = hexUtils.slice(v6_contract_binary, 0, -METADATA_SIZE);
        expect(actualBinaryWithoutMetadata).to.eq(expectedBinaryWithoutMetadata);
    });
});
