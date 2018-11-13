#!/usr/bin/env node

import * as depcheckAsync from 'depcheck';
import * as _ from 'lodash';

import { constants } from './constants';
import { utils } from './utils/utils';

// For some reason, `depcheck` hangs on some packages. Add them here.
const IGNORE_PACKAGES = ['@0x/sol-compiler'];

(async () => {
    utils.log('*** NOTE: Not all deps listed here are actually not required. ***');
    utils.log("*** `depcheck` isn't perfect so double check before actually removing any. ***\n");
    const packages = utils.getPackages(constants.monorepoRootPath);
    for (const pkg of packages) {
        if (_.includes(IGNORE_PACKAGES, pkg.packageJson.name)) {
            continue; // skip
        }
        utils.log(`Checking ${pkg.packageJson.name} for unused deps. This might take a while...`);

        const configs = {};
        const { dependencies } = await depcheckAsync(pkg.location, configs);
        if (!_.isEmpty(dependencies)) {
            _.each(dependencies, dep => {
                utils.log(dep);
            });
        }
        utils.log('\n');
    }
})().catch(err => {
    utils.log(err);
    process.exit(1);
});
