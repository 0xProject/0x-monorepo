import * as yargs from 'yargs';

import { generateAndUploadDocsAsync } from './utils/publish_utils';

const args = yargs
    .option('package', {
        describe: 'Monorepo sub-package for which to generate DocJSON',
        type: 'string',
        demandOption: true,
    })
    .option('isStaging', {
        describe: 'Whether we wish to publish docs to staging or production',
        type: 'boolean',
        demandOption: true,
    })
    .example("$0 --package '0x.js' --isStaging true", 'Full usage example').argv;

(async () => {
    const packageName = args.package;
    const isStaging = args.isStaging;

    await generateAndUploadDocsAsync(packageName, isStaging);
})();
