import * as yargs from 'yargs';

import { DocGenerateAndUploadUtils } from './utils/doc_generate_and_upload_utils';

const args = yargs
    .option('package', {
        describe:
            'Monorepo sub-package for which to generate DocJSON. If not supplied, it will do all defined in docGenConfigs.',
        type: 'string',
        demandOption: false,
    })
    .option('isStaging', {
        describe: 'Whether we wish to publish docs to staging or production',
        type: 'boolean',
        demandOption: true,
    })
    .option('shouldUpload', {
        describe: 'Whether we wish to upload the docs to S3 or not',
        type: 'boolean',
        demandOption: false,
        default: true,
    })
    .example("$0 --package '0x.js' --isStaging true", 'Full usage example').argv;

(async () => {
    const packageNameIfExists = args.package;
    const isStaging = args.isStaging;
    const shouldUploadDocs = args.shouldUpload;

    const docGenerateAndUploadUtils = new DocGenerateAndUploadUtils(packageNameIfExists, isStaging, shouldUploadDocs);
    await docGenerateAndUploadUtils.generateAndUploadDocsAsync();
})();
