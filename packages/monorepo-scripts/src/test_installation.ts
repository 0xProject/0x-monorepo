#!/usr/bin/env node

import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import { exec as execAsync } from 'promisify-child-process';
import * as rimraf from 'rimraf';

import { utils } from './utils/utils';

(async () => {
    const IS_LOCAL_PUBLISH = process.env.IS_LOCAL_PUBLISH === 'true';
    const registry = IS_LOCAL_PUBLISH ? 'http://localhost:4873' : 'https://registry.npmjs.org';
    const monorepoRootPath = path.join(__dirname, '../../..');
    const packages = utils.getTopologicallySortedPackages(monorepoRootPath);
    const installablePackages = _.filter(
        packages,
        pkg => !pkg.packageJson.private && !_.isUndefined(pkg.packageJson.main) && pkg.packageJson.main.endsWith('.js'),
    );
    utils.log('Testing packages:');
    _.map(installablePackages, pkg => utils.log(`* ${pkg.packageJson.name}`));
    for (const installablePackage of installablePackages) {
        const changelogPath = path.join(installablePackage.location, 'CHANGELOG.json');
        const lastChangelogVersion = JSON.parse(fs.readFileSync(changelogPath).toString())[0].version;
        const packageName = installablePackage.packageJson.name;
        utils.log(`Testing ${packageName}`);
        const testDirectory = path.join(monorepoRootPath, '../test-env');
        fs.mkdirSync(testDirectory);
        await execAsync('yarn init --yes', { cwd: testDirectory });
        const npmrcFilePath = path.join(testDirectory, '.npmrc');
        fs.writeFileSync(npmrcFilePath, `registry=${registry}`);
        utils.log(`Installing ${packageName}@${lastChangelogVersion}`);
        await execAsync(`npm install --save ${packageName}@${lastChangelogVersion} --registry=${registry}`, {
            cwd: testDirectory,
        });
        const indexFilePath = path.join(testDirectory, 'index.ts');
        fs.writeFileSync(indexFilePath, `import * as Package from '${packageName}';\n`);
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
        fs.writeFileSync(tsconfigFilePath, JSON.stringify(tsConfig, null, '\t'));
        utils.log(`Compiling ${packageName}`);
        const tscBinaryPath = path.join(monorepoRootPath, './node_modules/typescript/bin/tsc');
        await execAsync(tscBinaryPath, { cwd: testDirectory });
        utils.log(`Successfully compiled with ${packageName} as a dependency`);
        rimraf.sync(testDirectory);
    }
})().catch(err => {
    utils.log(err.stderr);
    utils.log(err.stdout);
    process.exit(1);
});
