const pkgNames = process.argv.slice(2);
import * as artifacts from '@0x/contract-artifacts';
import * as fs from 'fs';
import * as path from 'path';
/*
 * @param dir        the directory name under 0x-monorepo/contracts, e.g. 'exchange', 'extensions'
 * @param artifact   the artifact name without extension, e.g. DutchAuction, Exchange
 */
function shouldSkip(dir: string, artifact: string): boolean {
    return (dir === 'extensions' && artifact === 'Exchange') || (dir === 'extensions' && artifact === 'WETH9');
}
const artifactsToPublish = Object.keys(artifacts);

const contractsPath = path.join(__dirname, '../../../contracts');
const contractsDirs = pkgNames.map(pkg => pkg.split('/contracts-')[1]);

const compiledArtifactPaths = contractsDirs.reduce(
    (acc, dir) => {
        const artifactsDir = path.join(contractsPath, dir, 'generated-artifacts');
        if (!fs.existsSync(artifactsDir)) {
            return acc;
        }
        const compiledArtifacts: string[] = fs
            .readdirSync(artifactsDir)
            .filter(artifact => {
                const artifactWithoutExt = artifact.split('.')[0];
                return artifactsToPublish.includes(artifactWithoutExt) && !shouldSkip(dir, artifactWithoutExt);
            })
            .map(artifact => path.join(artifactsDir, artifact));
        return acc.concat(compiledArtifacts);
    },
    [] as string[],
);

for (const _path of compiledArtifactPaths) {
    const fileName = _path.split('/').slice(-1)[0];
    const targetPath = path.join(__dirname, '../../contract-artifacts/artifacts', fileName);
    fs.copyFileSync(_path, targetPath);
    console.log(`Copied from ${_path} to ${targetPath}`); // tslint:disable-line:no-console
    console.log(`Finished copying contract-artifacts. Run 'cd packages/contract-artifacts && yarn lint`); // tslint:disable-line:no-console
}
