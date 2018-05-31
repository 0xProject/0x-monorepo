import { addHexPrefix } from 'ethereumjs-util';
import * as fs from 'fs';
import * as glob from 'glob';
import * as _ from 'lodash';
import * as path from 'path';

import { ContractData } from './types';

export const collectContractsData = (artifactsPath: string, sourcesPath: string) => {
    const artifactsGlob = `${artifactsPath}/**/*.json`;
    const artifactFileNames = glob.sync(artifactsGlob, { absolute: true });
    const contractsData: ContractData[] = [];
    _.forEach(artifactFileNames, artifactFileName => {
        const artifact = JSON.parse(fs.readFileSync(artifactFileName).toString());
        const sources = _.keys(artifact.sources);
        const contractName = artifact.contractName;
        // We don't compute coverage for dependencies
        const sourceCodes = artifact.sourceCodes || _.map(sources, (source: string) => 
            fs.readFileSync(path.join(sourcesPath, source)).toString(),
        );
        const contractData = {
            sourceCodes,
            sources,
            bytecode: addHexPrefix(artifact.compilerOutput.evm.bytecode.object),
            sourceMap: artifact.compilerOutput.evm.bytecode.sourceMap,
            runtimeBytecode: addHexPrefix(artifact.compilerOutput.evm.deployedBytecode.object),
            sourceMapRuntime: artifact.compilerOutput.evm.deployedBytecode.sourceMap,
        };
        contractsData.push(contractData);
    });
    return contractsData;
};
