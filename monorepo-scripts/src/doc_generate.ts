import * as yargs from 'yargs';

import { DocGenerateUtils } from './utils/doc_generate_utils';
import { utils } from './utils/utils';

const args = yargs
    .option('package', {
        describe: 'Monorepo sub-package for which to generate DocJSON',
        type: 'string',
        demandOption: true,
    })
    .example("$0 --package '0x.js'", 'Full usage example').argv;

(async () => {
    const packageName = args.package;

    const docGenerateAndUploadUtils = new DocGenerateUtils(packageName);
    await docGenerateAndUploadUtils.generateAndUploadDocsAsync();

    process.exit(0);
})().catch(err => {
    utils.log(err);
    process.exit(1);
});
