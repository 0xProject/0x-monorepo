import * as chai from 'chai';
import 'mocha';

import {Compiler} from './../src/compiler';
import {Deployer} from './../src/deployer';
import {fsWrapper} from './../src/utils/fs_wrapper';
import {CompilerOptions, ContractArtifact, ContractData, DeployerOptions, DoneCallback} from './../src/utils/types';
import {constructor_args, exchange_binary} from './fixtures/exchange_bin';
import {constants} from './util/constants';

const expect = chai.expect;
const artifactsDir = `${__dirname}/fixtures/artifacts`;
const contractsDir = `${__dirname}/fixtures/contracts`;
const exchangeArtifactPath = `${artifactsDir}/Exchange.json`;
const compilerOpts: CompilerOptions = {
    artifactsDir,
    contractsDir,
    networkId: constants.networkId,
    optimizerEnabled: constants.optimizerEnabled,
};
const compiler = new Compiler(compilerOpts);
const deployerOpts: DeployerOptions = {
    artifactsDir,
    networkId: constants.networkId,
    jsonrpcPort: constants.jsonrpcPort,
    defaults: {
        gasPrice: constants.gasPrice,
    },
};
const deployer = new Deployer(deployerOpts);

/* tslint:disable */
beforeEach(function(done: DoneCallback) {
    this.timeout(constants.timeoutMs);
    (async () => {
        if (fsWrapper.doesPathExistSync(exchangeArtifactPath)) {
            await fsWrapper.removeFileAsync(exchangeArtifactPath);
        }
        await compiler.compileAllAsync();
        done();
    })().catch(done);
});
/* tslint:enable */

describe('#Compiler', () => {
    it('should create an Exchange artifact with the correct unlinked binary', async () => {
        const opts = {
            encoding: 'utf8',
        };
        const exchangeArtifactString = await fsWrapper.readFileAsync(exchangeArtifactPath, opts);
        const exchangeArtifact: ContractArtifact = JSON.parse(exchangeArtifactString);
        const exchangeContractData: ContractData = exchangeArtifact.networks[constants.networkId];
        // The last 43 bytes of the binaries are metadata which may not be equivalent
        const unlinkedBinaryWithoutMetadata = exchangeContractData.unlinked_binary.slice(0, -86);
        const exchangeBinaryWithoutMetadata = exchange_binary.slice(0, -86);
        expect(unlinkedBinaryWithoutMetadata).to.equal(exchangeBinaryWithoutMetadata);
    });
});
describe('#Deployer', () => {
    describe('#deployAsync', () => {
        it('should deploy the Exchange contract without updating the Exchange artifact', async () => {
            const exchangeConstructorArgs = [constants.zrxTokenAddress, constants.tokenTransferProxyAddress];
            const exchangeContractInstance = await deployer.deployAsync('Exchange', exchangeConstructorArgs);
            const opts = {
                encoding: 'utf8',
            };
            const exchangeArtifactString = await fsWrapper.readFileAsync(exchangeArtifactPath, opts);
            const exchangeArtifact: ContractArtifact = JSON.parse(exchangeArtifactString);
            const exchangeContractData: ContractData = exchangeArtifact.networks[constants.networkId];
            const exchangeAddress = exchangeContractInstance.address;
            expect(exchangeAddress).to.not.equal(undefined);
            expect(exchangeContractData.address).to.equal(undefined);
            expect(exchangeContractData.constructor_args).to.equal(undefined);
        });
    });
    describe('#deployAndSaveAsync', () => {
        it('should save the correct contract address and constructor arguments to the Exchange artifact', async () => {
            const exchangeConstructorArgs = [constants.zrxTokenAddress, constants.tokenTransferProxyAddress];
            const exchangeContractInstance = await deployer.deployAndSaveAsync('Exchange', exchangeConstructorArgs);
            const opts = {
                encoding: 'utf8',
            };
            const exchangeArtifactString = await fsWrapper.readFileAsync(exchangeArtifactPath, opts);
            const exchangeArtifact: ContractArtifact = JSON.parse(exchangeArtifactString);
            const exchangeContractData: ContractData = exchangeArtifact.networks[constants.networkId];
            const exchangeAddress = exchangeContractInstance.address;
            expect(exchangeAddress).to.be.equal(exchangeContractData.address);
            expect(constructor_args).to.be.equal(exchangeContractData.constructor_args);
        });
    });
});
