import * as yargs from 'yargs';

import { publishReleaseNotesAsync } from './utils/github_release_utils';
import { utils } from './utils/utils';

const args = yargs
    .option('isDryRun', {
        describe: 'Whether we wish to do a dry run, not committing anything to Github',
        type: 'boolean',
        demandOption: true,
    })
    .example('$0 --isDryRun true', 'Full usage example').argv;

// tslint:disable-next-line:no-floating-promises
(async () => {
    const isDryRun = args.isDryRun;
    const shouldIncludePrivate = false;
    const allUpdatedPackages = await utils.getUpdatedPackagesAsync(shouldIncludePrivate);

    await publishReleaseNotesAsync(allUpdatedPackages, isDryRun);
})();
