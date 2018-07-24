#!/usr/bin/env node

import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import { exec as execAsync } from 'promisify-child-process';
import * as rimraf from 'rimraf';

import { utils } from './utils/utils';

(async () => {
    const monorepoRootPath = path.join(__dirname, '../../..');
    const packages = utils.getPackages(monorepoRootPath);
    const installablePackages = _.filter(
        packages,
        pkg => !pkg.packageJson.private && !_.isUndefined(pkg.packageJson.main) && pkg.packageJson.main.endsWith('.js'),
    );
    for (const installablePackage of installablePackages) {
        const packageName = installablePackage.packageJson.name;
        const packageVersion = installablePackage.packageJson.version;
        utils.log(`Testing ${packageName}`);
        const testDirectory = path.join(monorepoRootPath, '../test-env');
        fs.mkdirSync(testDirectory);
        let result = await execAsync('yarn init --yes', { cwd: testDirectory });
        utils.log(`Installing ${packageName}@${packageVersion}`);
        result = await execAsync(`yarn add ${packageName}@${packageVersion}`, { cwd: testDirectory });
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
