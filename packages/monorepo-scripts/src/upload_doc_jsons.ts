/* This script really should not exist.  Callers would be better off calling the aws command line, like
 *     $ AWS_ACCESS_KEY=S3RVER \
 *       AWS_SECRET_ACCESS_KEY=S3RVER \
 *       aws \
 *           --endpoint-url http://127.0.0.1:8081 \
 *           s3 ls
 * But right now that's not working with local s3 (s3rver) because of
 * https://github.com/jamhall/s3rver/issues/447 , which has a fix submitted but
 * not yet reviewed.
 */
import * as fs from 'fs';
import * as path from 'path';

import { S3 } from 'aws-sdk';
import { walk } from 'walk';
import * as yargs from 'yargs';

import { logUtils } from '@0x/utils';

const argv = yargs
    .option('directory', { type: 'string', description: 'path to folder containing doc jsons' })
    .demandOption('directory')
    .option('s3Endpoint', { type: 'string', description: 'S3 endpoint URL' })
    .help().argv;

logUtils.log(
    `Uploading files from ${argv.directory}${argv.s3Endpoint ? ` to ${argv.s3Endpoint}/${argv.directory}` : ''}...`,
);

(async () => {
    const s3client = new S3({
        accessKeyId: 'S3RVER',
        secretAccessKey: 'S3RVER',
        endpoint: argv.s3Endpoint,
        s3ForcePathStyle: true,
    });

    const walker = walk(argv.directory);
    walker.on('file', async (root, fileStats, next) => {
        await s3client
            .putObject({
                Bucket: argv.directory,
                Body: fs.readFileSync(`${path.join(root, fileStats.name)}`),
                Key: `${path.join(root, fileStats.name).replace(`${argv.directory}/`, '')}`,
            })
            .promise();
        next();
    });
    walker.on('end', async () => {
        logUtils.log('Done');
    });
})().catch(reason => {
    logUtils.warn(reason);
    process.exit(1);
});
