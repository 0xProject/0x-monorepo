import { logUtils } from '@0x/utils';
import * as fs from 'fs';
import * as path from 'path';

import * as artifacts from './index';

const pkgNames = process.argv.slice(2);
const artifactsToPublish = Object.keys(artifacts);

const contractsDirs = [];
for (const pkgName of pkgNames) {
    if (!pkgName.startsWith('@0x/contracts-')) {
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
            return artifactsToPublish.includes(artifactWithoutExt);
        })
        .map(artifact => path.join(artifactsDir, artifact));
    allArtifactPaths.push(...artifactPaths);
}

for (const _path of allArtifactPaths) {
    const fileName = _path.split('/').slice(-1)[0];
    const targetPath = path.join(__dirname, '../artifacts', fileName);
    const targetPathPython = path.join(
        __dirname,
        '../../../python-packages/contract_artifacts/src/zero_ex/contract_artifacts/artifacts',
        fileName,
    );
    fs.copyFileSync(_path, targetPath);
    fs.copyFileSync(_path, targetPathPython);
    logUtils.log(`Copied from ${_path} to ${targetPath}`);
}
logUtils.log(`Finished copying contract-artifacts. Remember to transform artifacts before publishing or using abi-gen`);
