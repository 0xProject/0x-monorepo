import { postpublishUtils } from '@0xproject/monorepo-scripts';
import { execAsync } from 'async-child-process';
import * as _ from 'lodash';

import * as packageJSON from '../package.json';
import * as tsConfig from '../tsconfig.json';

const cwd = `${__dirname}/..`;
const subPackageName = (packageJSON as any).name;
// Include any external packages that are part of the @0xproject/connect public interface
// to this array so that TypeDoc picks it up and adds it to the Docs JSON
const fileIncludes = [...(tsConfig as any).include];
const fileIncludesAdjusted = postpublishUtils.adjustFileIncludePaths(fileIncludes, __dirname);
const S3BucketPath = 's3://connect-docs-jsons/';

(async () => {
    const tagAndVersion = await postpublishUtils.getLatestTagAndVersionAsync(subPackageName);
    const tag = tagAndVersion.tag;
    const version = tagAndVersion.version;

    const releaseName = postpublishUtils.getReleaseName(subPackageName, version);
    const assets = [`${__dirname}/../_bundles/index.js`, `${__dirname}/../_bundles/index.min.js`];
    const release = await postpublishUtils.publishReleaseNotesAsync(tag, releaseName, assets);

    // tslint:disable-next-line:no-console
    console.log('POSTPUBLISH: Release successful, generating docs...');
    await postpublishUtils.generateAndUploadDocsAsync(__dirname, cwd, fileIncludesAdjusted, version, S3BucketPath);
})().catch(console.error);
