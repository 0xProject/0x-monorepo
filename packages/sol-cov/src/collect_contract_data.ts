import * as fs from 'fs';
import * as glob from 'glob';
import * as _ from 'lodash';
import * as path from 'path';

import { ContractData } from './types';

export const collectContractsData = (artifactsPath: string, sourcesPath: string, networkId: number) => {
    const sourcesGlob = `${sourcesPath}/**/*.sol`;
    const sourceFileNames = glob.sync(sourcesGlob, { absolute: true });
    const contractsDataIfExists: Array<ContractData | {}> = _.map(sourceFileNames, sourceFileName => {
        const baseName = path.basename(sourceFileName, '.sol');
        const artifactFileName = path.join(artifactsPath, `${baseName}.json`);
        if (!fs.existsSync(artifactFileName)) {
            // If the contract isn't directly compiled, but is imported as the part of the other contract - we don't
            // have an artifact for it and therefore can't do anything useful with it
            return {};
        }
        const artifact = JSON.parse(fs.readFileSync(artifactFileName).toString());
        const sources = _.map(artifact.networks[networkId].sources, source => {
            const includedFileName = glob.sync(`${sourcesPath}/**/${source}`, { absolute: true })[0];
            return includedFileName;
        });
        const sourceCodes = _.map(sources, source => {
            const includedSourceCode = fs.readFileSync(source).toString();
            return includedSourceCode;
        });
        const contractData = {
            baseName,
            sourceCodes,
            sources,
            sourceMap: artifact.networks[networkId].source_map,
            sourceMapRuntime: artifact.networks[networkId].source_map_runtime,
            runtimeBytecode: artifact.networks[networkId].runtime_bytecode,
            bytecode: artifact.networks[networkId].bytecode,
        };
        return contractData;
    });
    const contractsData = _.filter(contractsDataIfExists, contractData => !_.isEmpty(contractData)) as ContractData[];
    return contractsData;
};
