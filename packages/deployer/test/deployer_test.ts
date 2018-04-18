import * as chai from 'chai';
import 'mocha';

import { Compiler } from '../src/compiler';
import { Deployer } from '../src/deployer';
import { fsWrapper } from '../src/utils/fs_wrapper';
import { CompilerOptions, ContractArtifact, ContractNetworkData, DoneCallback } from '../src/utils/types';

import { constructor_args, exchange_binary } from './fixtures/exchange_bin';
import { constants } from './util/constants';
import { provider } from './util/provider';

const expect = chai.expect;

describe('#Deployer', () => {
    const artifactsDir = `${__dirname}/fixtures/artifacts`;
    const contractsDir = `${__dirname}/fixtures/contracts`;
    const exchangeArtifactPath = `${artifactsDir}/Exchange.json`;
    const compilerOpts: CompilerOptions = {
        artifactsDir,
        contractsDir,
        contracts: constants.contracts,
    };
    const compiler = new Compiler(compilerOpts);
    const deployerOpts = {
        artifactsDir,
        networkId: constants.networkId,
        provider,
        defaults: {
            gasPrice: constants.gasPrice,
        },
    };
    const deployer = new Deployer(deployerOpts);
    beforeEach(function(done: DoneCallback) {
        this.timeout(constants.timeoutMs);
        (async () => {
            if (fsWrapper.doesPathExistSync(exchangeArtifactPath)) {
                await fsWrapper.removeFileAsync(exchangeArtifactPath);
            }
            await compiler.compileAsync();
            done();
        })().catch(done);
    });
    describe('#deployAsync', () => {
        it('should deploy the Exchange contract without updating the Exchange artifact', async () => {
            const exchangeConstructorArgs = [constants.zrxTokenAddress, constants.tokenTransferProxyAddress];
            const exchangeContractInstance = await deployer.deployAsync('Exchange', exchangeConstructorArgs);
            const opts = {
                encoding: 'utf8',
            };
            const exchangeArtifactString = await fsWrapper.readFileAsync(exchangeArtifactPath, opts);
            const exchangeArtifact: ContractArtifact = JSON.parse(exchangeArtifactString);
            const exchangeContractData: ContractNetworkData = exchangeArtifact.networks[constants.networkId];
            const exchangeAddress = exchangeContractInstance.address;
            expect(exchangeAddress).to.not.equal(undefined);
            expect(exchangeContractData).to.equal(undefined);
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
            const exchangeContractData: ContractNetworkData = exchangeArtifact.networks[constants.networkId];
            const exchangeAddress = exchangeContractInstance.address;
            expect(exchangeAddress).to.be.equal(exchangeContractData.address);
            expect(constructor_args).to.be.equal(exchangeContractData.constructorArgs);
        });
    });
});
