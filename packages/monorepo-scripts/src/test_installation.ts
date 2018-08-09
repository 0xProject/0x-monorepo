#!/usr/bin/env node

import * as fs from 'fs';
import * as _ from 'lodash';
import * as mkdirp from 'mkdirp';
import * as path from 'path';
import { exec as execAsync } from 'promisify-child-process';
import * as rimraf from 'rimraf';
import { promisify } from 'util';

import { Package } from './types';

import { utils } from './utils/utils';

// Packages might not be runnable if they are command-line tools or only run in browsers.
const UNRUNNABLE_PACKAGES = [
    '@0xproject/abi-gen',
    '@0xproject/sra-report',
    '@0xproject/react-shared',
    '@0xproject/react-docs',
];

const mkdirpAsync = promisify(mkdirp);
const rimrafAsync = promisify(rimraf);
const writeFileAsync = promisify(fs.writeFile);

(async () => {
    const IS_LOCAL_PUBLISH = process.env.IS_LOCAL_PUBLISH === 'true';
    const registry = IS_LOCAL_PUBLISH ? 'http://localhost:4873/' : 'https://registry.npmjs.org/';
    const monorepoRootPath = path.join(__dirname, '../../..');
    const packages = utils.getTopologicallySortedPackages(monorepoRootPath);
    const installablePackages = _.filter(
        packages,
        pkg => !pkg.packageJson.private && !_.isUndefined(pkg.packageJson.main) && pkg.packageJson.main.endsWith('.js'),
    );
    utils.log('Testing packages:');
    _.map(installablePackages, pkg => utils.log(`* ${pkg.packageJson.name}`));
    const promises: Array<Promise<void>> = [];
    for (const installablePackage of installablePackages) {
        promises.push(testInstallPackageAsync(monorepoRootPath, registry, installablePackage));
    }
    await Promise.all(promises);
})().catch(err => {
    utils.log(err.message);
    utils.log(err.stderr);
    utils.log(err.stdout);
    utils.log(err.stack);
    process.exit(1);
});

async function testInstallPackageAsync(
    monorepoRootPath: string,
    registry: string,
    installablePackage: Package,
): Promise<void> {
    const changelogPath = path.join(installablePackage.location, 'CHANGELOG.json');
    const lastChangelogVersion = JSON.parse(fs.readFileSync(changelogPath).toString())[0].version;
    const packageName = installablePackage.packageJson.name;
    utils.log(`Testing ${packageName}@${lastChangelogVersion}`);
    const packageDirName = path.join(...(packageName + '-test').split('/'));
    const testDirectory = path.join(
        monorepoRootPath,
        'packages',
        'monorepo-scripts',
        '.installation-test',
        packageDirName,
    );
    await rimrafAsync(testDirectory);
    await mkdirpAsync(testDirectory);
    await execAsync('yarn init --yes', { cwd: testDirectory });
    const npmrcFilePath = path.join(testDirectory, '.npmrc');
    await writeFileAsync(npmrcFilePath, `registry=${registry}`);
    utils.log(`Installing ${packageName}@${lastChangelogVersion}`);
    await execAsync(`npm install --save ${packageName}@${lastChangelogVersion} --registry=${registry}`, {
        cwd: testDirectory,
    });
    const indexFilePath = path.join(testDirectory, 'index.ts');
    await writeFileAsync(indexFilePath, `import * as Package from '${packageName}';\nconsole.log(Package);\n`);
    const tsConfig = {
        compilerOptions: {
            typeRoots: ['node_modules/@0xproject/typescript-typings/types', 'node_modules/@types'],
            module: 'commonjs',
            target: 'es5',
            lib: ['es2017', 'dom'],
            declaration: true,
            noImplicitReturns: true,
            pretty: true,
            strict: true,
        },
        include: ['index.ts'],
    };
    const tsconfigFilePath = path.join(testDirectory, 'tsconfig.json');
    await writeFileAsync(tsconfigFilePath, JSON.stringify(tsConfig, null, '\t'));
    utils.log(`Compiling ${packageName}`);
    const tscBinaryPath = path.join(monorepoRootPath, './node_modules/typescript/bin/tsc');
    await execAsync(tscBinaryPath, { cwd: testDirectory });
    utils.log(`Successfully compiled with ${packageName} as a dependency`);
    const isUnrunnablePkg = _.includes(UNRUNNABLE_PACKAGES, packageName);
    if (!isUnrunnablePkg) {
        const transpiledIndexFilePath = path.join(testDirectory, 'index.js');
        utils.log(`Running test script with ${packageName} imported`);
        await execAsync(`node ${transpiledIndexFilePath}`);
        utils.log(`Successfilly ran test script with ${packageName} imported`);
    }
    await rimrafAsync(testDirectory);
}
