import * as fs from 'fs';
import * as glob from 'glob';
import * as _ from 'lodash';
import * as path from 'path';

import { ContractData } from './types';

export const collectContractsData = (artifactsPath: string, sourcesPath: string, networkId: number) => {
    const artifactsGlob = `${artifactsPath}/**/*.json`;
    const artifactFileNames = glob.sync(artifactsGlob, { absolute: true });
    const contractsDataIfExists: Array<ContractData | {}> = _.map(artifactFileNames, artifactFileName => {
        const artifact = JSON.parse(fs.readFileSync(artifactFileName).toString());
        const sources = artifact.networks[networkId].sources;
        const contractName = artifact.contract_name;
        // We don't compute coverage for dependencies
        const sourceCodes = _.map(sources, (source: string) => fs.readFileSync(source).toString());
        if (_.isUndefined(artifact.networks[networkId])) {
            throw new Error(`No ${contractName} artifacts found for networkId ${networkId}`);
        }
        const contractData = {
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
