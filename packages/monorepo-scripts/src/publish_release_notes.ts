import * as _ from 'lodash';
import * as yargs from 'yargs';

import { publishReleaseNotesAsync } from './utils/github_release_utils';
import { utils } from './utils/utils';

const args = yargs
    .option('isDryRun', {
        describe: 'Whether we wish to do a dry run, not committing anything to Github',
        type: 'boolean',
        demandOption: true,
    })
    .option('packages', {
        describe:
            'Space-separated list of packages to generated release notes for. If not supplied, it does all `Lerna updated` packages.',
        type: 'string',
    })
    .example('$0 --isDryRun true --packages "0x.js @0x/web3-wrapper"', 'Full usage example').argv;

(async () => {
    const isDryRun = args.isDryRun;
    let packages;
    if (_.isUndefined(args.packages)) {
        const shouldIncludePrivate = false;
        packages = await utils.getPackagesToPublishAsync(shouldIncludePrivate);
    } else {
        const packageNames = args.packages.split(' ');
        packages = await utils.getPackagesByNameAsync(packageNames);
    }

    await publishReleaseNotesAsync(packages, isDryRun);
    process.exit(0);
})().catch(err => {
    utils.log(err);
    process.exit(1);
});
