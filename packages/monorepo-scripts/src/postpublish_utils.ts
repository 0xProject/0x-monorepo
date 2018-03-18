import { execAsync } from 'async-child-process';
import * as promisify from 'es6-promisify';
import * as _ from 'lodash';
import * as publishRelease from 'publish-release';
import semverSort = require('semver-sort');

import { utils } from './utils';

const publishReleaseAsync = promisify(publishRelease);
const githubPersonalAccessToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN_0X_JS;
const generatedDocsDirectoryName = 'generated_docs';

export interface PostpublishConfigs {
    cwd: string;
    packageName: string;
    version: string;
    assets: string[];
    docPublishConfigs: DocPublishConfigs;
}

export interface DocPublishConfigs {
    fileIncludes: string[];
    s3BucketPath: string;
    s3StagingBucketPath: string;
}

export const postpublishUtils = {
    generateConfig(packageJSON: any, tsConfigJSON: any, cwd: string): PostpublishConfigs {
        if (_.isUndefined(packageJSON.name)) {
            throw new Error('name field required in package.json. Cannot publish release notes to Github.');
        }
        if (_.isUndefined(packageJSON.version)) {
            throw new Error('version field required in package.json. Cannot publish release notes to Github.');
        }
        const postpublishConfig = _.get(packageJSON, 'config.postpublish', {});
        const configs: PostpublishConfigs = {
            cwd,
            packageName: packageJSON.name,
            version: packageJSON.version,
            assets: _.get(postpublishConfig, 'assets', []),
            docPublishConfigs: {
                fileIncludes: [
                    ...tsConfigJSON.include,
                    ..._.get(postpublishConfig, 'docPublishConfigs.extraFileIncludes', []),
                ],
                s3BucketPath: _.get(postpublishConfig, 'docPublishConfigs.s3BucketPath'),
                s3StagingBucketPath: _.get(postpublishConfig, 'docPublishConfigs.s3StagingBucketPath'),
            },
        };
        return configs;
    },
    async runAsync(packageJSON: any, tsConfigJSON: any, cwd: string): Promise<void> {
        const configs = this.generateConfig(packageJSON, tsConfigJSON, cwd);
        const release = await this.publishReleaseNotesAsync(
            configs.cwd,
            configs.packageName,
            configs.version,
            configs.assets,
        );
        if (
            !_.isUndefined(configs.docPublishConfigs.s3BucketPath) ||
            !_.isUndefined(configs.docPublishConfigs.s3StagingBucketPath)
        ) {
            utils.log('POSTPUBLISH: Release successful, generating docs...');
            await postpublishUtils.generateAndUploadDocsAsync(
                configs.cwd,
                configs.docPublishConfigs.fileIncludes,
                configs.version,
                configs.docPublishConfigs.s3BucketPath,
            );
        } else {
            utils.log(`POSTPUBLISH: No S3Bucket config found for ${packageJSON.name}. Skipping doc JSON generation.`);
        }
    },
    async publishDocsToStagingAsync(packageJSON: any, tsConfigJSON: any, cwd: string) {
        const configs = this.generateConfig(packageJSON, tsConfigJSON, cwd);
        if (_.isUndefined(configs.docPublishConfigs.s3StagingBucketPath)) {
            utils.log('config.postpublish.docPublishConfigs.s3StagingBucketPath entry in package.json not found!');
            return;
        }

        utils.log('POSTPUBLISH: Generating docs...');
        await postpublishUtils.generateAndUploadDocsAsync(
            configs.cwd,
            configs.docPublishConfigs.fileIncludes,
            configs.version,
            configs.docPublishConfigs.s3StagingBucketPath,
        );
    },
    async publishReleaseNotesAsync(cwd: string, packageName: string, version: string, assets: string[]): Promise<void> {
        const releaseName = this.getReleaseName(packageName, version);
        const tag = this.getTag(packageName, version);
        utils.log('POSTPUBLISH: Releasing ', releaseName, '...');
        const finalAssets = this.adjustAssetPaths(cwd, assets);
        const result = await publishReleaseAsync({
            token: githubPersonalAccessToken,
            owner: '0xProject',
            repo: '0x-monorepo',
            tag,
            name: releaseName,
            notes: 'N/A',
            draft: false,
            prerelease: false,
            reuseRelease: true,
            reuseDraftOnly: false,
            assets,
        });
    },
    getTag(packageName: string, version: string) {
        return `${packageName}@${version}`;
    },
    getReleaseName(subPackageName: string, version: string): string {
        const releaseName = `${subPackageName} v${version}`;
        return releaseName;
    },
    adjustAssetPaths(cwd: string, assets: string[]) {
        const finalAssets: string[] = [];
        _.each(assets, (asset: string) => {
            finalAssets.push(`${cwd}/${asset}`);
        });
        return finalAssets;
    },
    adjustFileIncludePaths(fileIncludes: string[], cwd: string): string[] {
        const fileIncludesAdjusted = _.map(fileIncludes, fileInclude => {
            let path = _.startsWith(fileInclude, './') ? `${cwd}/${fileInclude.substr(2)}` : `${cwd}/${fileInclude}`;

            // HACK: tsconfig.json needs wildcard directory endings as `/**/*`
            // but TypeDoc needs it as `/**` in order to pick up files at the root
            if (_.endsWith(path, '/**/*')) {
                path = path.slice(0, -2);
            }
            return path;
        });
        return fileIncludesAdjusted;
    },
    async generateAndUploadDocsAsync(cwd: string, fileIncludes: string[], version: string, S3BucketPath: string) {
        const fileIncludesAdjusted = this.adjustFileIncludePaths(fileIncludes, cwd);
        const projectFiles = fileIncludesAdjusted.join(' ');
        const jsonFilePath = `${cwd}/${generatedDocsDirectoryName}/index.json`;
        const result = await execAsync(
            `JSON_FILE_PATH=${jsonFilePath} PROJECT_FILES="${projectFiles}" yarn docs:json`,
            {
                cwd,
            },
        );
        if (!_.isEmpty(result.stderr)) {
            throw new Error(result.stderr);
        }
        const fileName = `v${version}.json`;
        utils.log(`POSTPUBLISH: Doc generation successful, uploading docs... as ${fileName}`);
        const s3Url = S3BucketPath + fileName;
        await execAsync(`S3_URL=${s3Url} yarn upload_docs_json`, {
            cwd,
        });
        // Remove the generated docs directory
        await execAsync(`rm -rf ${generatedDocsDirectoryName}`, {
            cwd,
        });
        utils.log(`POSTPUBLISH: Docs uploaded to S3 bucket: ${S3BucketPath}`);
    },
};
