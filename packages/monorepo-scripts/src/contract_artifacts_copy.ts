import * as artifacts from '@0x/contract-artifacts';
const artifactsToPublish = Object.keys(artifacts);

import * as fs from 'fs';
import * as path from 'path';

import { utils } from './utils/utils';

const pkgNames = process.argv.slice(2);
const contractsDirs = [];
for (const pkgName of pkgNames) {
    if (pkgName.indexOf('/contracts-') === -1) {
        throw new Error(`Invalid package name: [${pkgName}]. Contracts packages must be prefixed with 'contracts-'`);
    }
    contractsDirs.push(pkgName.split('/contracts-')[1]);
}

const contractsPath = path.join(__dirname, '../../../contracts');
const allArtifactPaths = [];
for (const dir of contractsDirs) {
    const artifactsDir = path.join(contractsPath, dir, 'generated-artifacts');
    if (!fs.existsSync(artifactsDir)) {
        continue;
    }
    const artifactPaths: string[] = fs
        .readdirSync(artifactsDir)
        .filter(artifact => {
            const artifactWithoutExt = artifact.split('.')[0];
            return artifactsToPublish.includes(artifactWithoutExt) && !shouldSkip(dir, artifactWithoutExt);
        })
        .map(artifact => path.join(artifactsDir, artifact));
    allArtifactPaths.push(...artifactPaths);
}

for (const _path of allArtifactPaths) {
    const fileName = _path.split('/').slice(-1)[0];
    const targetPath = path.join(__dirname, '../../contract-artifacts/artifacts', fileName);
    const targetPathPython = path.join(__dirname, '../../../python-packages/contract_artifacts/src/zero_ex/contract_artifacts/artifacts', fileName);
    fs.copyFileSync(_path, targetPath);
    fs.copyFileSync(_path, targetPathPython);
    utils.log(`Copied from ${_path} to ${targetPath}`);
}
utils.log(`Finished copying contract-artifacts. Remember to lint artifacts before using abi-gen.`);

/*
 * @param dir        the directory name under 0x-monorepo/contracts, e.g. 'exchange', 'extensions'
 * @param artifact   the artifact name without extension, e.g. DutchAuction, Exchange
 */
function shouldSkip(dir: string, artifact: string): boolean {
    return (
        (dir === 'extensions' && artifact === 'Exchange') || // duplicate artifact
        (dir === 'extensions' && artifact === 'WETH9') // duplicate artifact
    );
}
