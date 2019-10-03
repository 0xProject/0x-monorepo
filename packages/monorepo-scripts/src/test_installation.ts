#!/usr/bin/env node

import * as fs from 'fs';
import * as _ from 'lodash';
import * as mkdirp from 'mkdirp';
import * as path from 'path';
import { exec as execAsync } from 'promisify-child-process';
import * as rimraf from 'rimraf';
import { promisify } from 'util';

import { Changelog, Package } from './types';
import { utils } from './utils/utils';

// Packages might not be runnable if they are command-line tools or only run in browsers.
const UNRUNNABLE_PACKAGES = ['@0x/abi-gen'];
// HACK(fabio): Temporarily adding '@0x/contracts-coordinator', '@0x/contracts-extensions' since they
// aren't working in the V3 branch yet.
// TODO(dorothy-zbornak): Remove '@0x/contracts-coordinator', '@0x/contracts-extensions' after updating
// these packages for 3.0.
const UNINSTALLABLE_PACKAGES = ['@0x/contracts-coordinator', '@0x/contracts-extensions'];

const mkdirpAsync = promisify(mkdirp);
const rimrafAsync = promisify(rimraf);
const writeFileAsync = promisify(fs.writeFile);

interface PackageErr {
    packageName: string;
    error: ExecError;
}

interface ExecError {
    message: string;
    stack: string;
    stderr: string;
    stdout: string;
}

// returns the index for the given package name.
function findPackageIndex(packages: Package[], packageName: string): number {
    return _.findIndex(packages, pkg => pkg.packageJson.name === packageName);
}

function logIfDefined(x: any): void {
    if (x !== undefined) {
        utils.log(x);
    }
}

(async () => {
    const IS_LOCAL_PUBLISH = process.env.IS_LOCAL_PUBLISH === 'true';
    const registry = IS_LOCAL_PUBLISH ? 'http://localhost:4873/' : 'https://registry.npmjs.org/';
    const monorepoRootPath = path.join(__dirname, '../../..');
    // We sort error messages according to package topology so that we can see
    // them in a more intuitive order. E.g. if package A has an error and
    // package B imports it, the tests for both package A and package B will
    // fail. But package B only fails because of an error in package A.
    // Since the error in package A is the root cause, we log it first.
    const packages = utils.getTopologicallySortedPackages(monorepoRootPath);
    const installablePackages = _.filter(packages, pkg => {
        return (
            !pkg.packageJson.private &&
            pkg.packageJson.main !== undefined &&
            pkg.packageJson.main.endsWith('.js') &&
            !UNINSTALLABLE_PACKAGES.includes(pkg.packageJson.name)
        );
    });
    const CHUNK_SIZE = 15;
    const chunkedInstallablePackages = _.chunk(installablePackages, CHUNK_SIZE);
    utils.log(`Testing all packages in ${chunkedInstallablePackages.length} chunks`);
    for (const installablePackagesChunk of chunkedInstallablePackages) {
        utils.log('Testing packages:');
        _.map(installablePackagesChunk, pkg => utils.log(`* ${pkg.packageJson.name}`));
        // Run all package tests within that chunk asynchronously and push promises into an array so
        // we can wait for all of them to resolve.
        const promises: Array<Promise<void>> = [];
        const errors: PackageErr[] = [];
        for (const installablePackage of installablePackagesChunk) {
            const packagePromise = testInstallPackageAsync(monorepoRootPath, registry, installablePackage).catch(
                error => {
                    errors.push({ packageName: installablePackage.packageJson.name, error });
                },
            );
            promises.push(packagePromise);
        }
        await Promise.all(promises);
        if (errors.length > 0) {
            const topologicallySortedErrors = _.sortBy(errors, packageErr =>
                findPackageIndex(packages, packageErr.packageName),
            );
            _.forEach(topologicallySortedErrors, packageError => {
                utils.log(`ERROR in package ${packageError.packageName}:`);
                logIfDefined(packageError.error.message);
                logIfDefined(packageError.error.stderr);
                logIfDefined(packageError.error.stdout);
                logIfDefined(packageError.error.stack);
            });
            process.exit(1);
        }
    }
    process.exit(0);
})().catch(err => {
    utils.log(`Unexpected error: ${err.message}`);
    process.exit(1);
});

async function testInstallPackageAsync(
    monorepoRootPath: string,
    registry: string,
    installablePackage: Package,
): Promise<void> {
    const changelogPath = path.join(installablePackage.location, 'CHANGELOG.json');
    const lastChangelogVersion = utils.readJSONFile<Changelog>(changelogPath)[0].version;
    const packageName = installablePackage.packageJson.name;
    utils.log(`Testing ${packageName}@${lastChangelogVersion}`);
    const packageDirName = path.join(...`${packageName}-test`.split('/'));
    // NOTE(fabio): The `testDirectory` needs to be somewhere **outside** the monorepo root directory.
    // Otherwise, it will have access to the hoisted `node_modules` directory and the TypeScript missing
    // type errors will not be caught.
    const testDirectory = path.join(monorepoRootPath, '..', '.installation-test', packageDirName);
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
            typeRoots: ['node_modules/@0x/typescript-typings/types', 'node_modules/@types'],
            module: 'commonjs',
            target: 'es5',
            lib: ['es2017', 'dom'],
            declaration: true,
            noImplicitReturns: true,
            pretty: true,
            strict: true,
            resolveJsonModule: true,
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
        // tslint:disable-next-line:custom-no-magic-numbers
        const fiveMb = 1024 * 1024 * 5;
        await execAsync(`node ${transpiledIndexFilePath}`, { maxBuffer: fiveMb });
        utils.log(`Successfully ran test script with ${packageName} imported`);
    }
    await rimrafAsync(testDirectory);
}
