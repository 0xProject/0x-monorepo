import { logUtils } from '@0x/utils';
import * as fs from 'fs';
import * as path from 'path';

import * as artifacts from './index';

const MONOREPO_ROOT = path.join(__dirname, '../../../..');

// HACK (xianny): can't import the root package.json normally because it is outside rootDir of this project
const pkgJson = JSON.parse(fs.readFileSync(path.join(MONOREPO_ROOT, 'package.json')).toString());
const pkgNames = pkgJson.config.contractsPackages.split(' ');

const artifactsToPublish = Object.keys(artifacts);

const contractsDirs = [];
for (const pkgName of pkgNames) {
    if (!pkgName.startsWith('@0x/contracts-')) {
        throw new Error(`Invalid package name: [${pkgName}]. Contracts packages must be prefixed with 'contracts-'`);
    }
    contractsDirs.push(pkgName.split('/contracts-')[1]);
}

const contractsPath = path.join(MONOREPO_ROOT, 'contracts');
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

if (allArtifactPaths.length < pkgNames.length) {
    throw new Error(
        `Expected ${pkgNames.length} artifacts, found ${
            allArtifactPaths.length
        }. Please ensure artifacts are present in ${contractsPath}/**/generated_artifacts`,
    );
}

for (const _path of allArtifactPaths) {
    const fileName = _path.split('/').slice(-1)[0];
    const targetPath = path.join(__dirname, '../../artifacts', fileName);
    fs.copyFileSync(_path, targetPath);
    logUtils.log(`Copied ${_path}`);
}
logUtils.log(`Finished copying contract-artifacts. Remember to transform artifacts before publishing or using abi-gen`);
