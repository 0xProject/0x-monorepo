import * as fs from 'fs';

import S3rver = require('s3rver');
import * as yargs from 'yargs';

import { logUtils } from '@0x/utils';

const argv = yargs
    .option('directory', { type: 'string', description: 'path to folder which will contain root s3 data' })
    .demandOption('directory')
    .option('port', { type: 'number', description: 'port to listen for clients on' })
    .demandOption('port')
    .help().argv;

(async () => {
    await new S3rver({
        port: argv.port,
        address: 'localhost',
        silent: false,
        directory: argv.directory,
        configureBuckets: [
            { name: 'staging-doc-jsons', configs: [fs.readFileSync(require.resolve('s3rver/example/cors.xml'))] },
        ],
    }).run();
})().catch(reason => {
    logUtils.warn(reason);
    process.exit(1);
});
