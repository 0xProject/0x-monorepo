import { postpublishUtils } from '@0xproject/monorepo-scripts';
import { execAsync } from 'async-child-process';
import * as _ from 'lodash';

import * as tsConfig from '../tsconfig.json';

const cwd = __dirname + '/..';
const S3BucketPath = 's3://staging-0xjs-docs-jsons/';
// Include any external packages that are part of the 0x.js public interface
// to this array so that TypeDoc picks it up and adds it to the Docs JSON
// So far, we only have @0xproject/types as part of 0x.js's public interface.
const fileIncludes = [...(tsConfig as any).include, '../types/src/index.ts'];
const fileIncludesAdjusted = postpublishUtils.adjustFileIncludePaths(fileIncludes, __dirname);
const jsonFilePath = `${__dirname}/../${postpublishUtils.generatedDocsDirectoryName}/index.json`;
const version = process.env.DOCS_VERSION || '0.0.0';

(async () => {
    await postpublishUtils.generateAndUploadDocsAsync(__dirname, cwd, fileIncludesAdjusted, version, S3BucketPath);
})().catch(console.error);
