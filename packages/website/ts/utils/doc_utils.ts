import { DocAgnosticFormat, GeneratedDocJson } from '@0x/react-docs';
import { fetchAsync, logUtils } from '@0x/utils';
import * as _ from 'lodash';
import { S3FileObject, VersionToFilePath } from 'ts/types';
import convert = require('xml-js');

export const docUtils = {
    async getVersionToFilePathAsync(s3DocJsonRoot: string, folderName: string): Promise<VersionToFilePath> {
        const versionFilePaths = await docUtils.getVersionFileNamesAsync(s3DocJsonRoot, folderName);
        const versionToFilePath: VersionToFilePath = {};
        _.each(versionFilePaths, filePath => {
            const version = filePath.split('/v')[1].replace('.json', '');
            versionToFilePath[version] = filePath;
        });
        return versionToFilePath;
    },
    async getVersionFileNamesAsync(s3DocJsonRoot: string, folderName: string): Promise<string[]> {
        const response = await fetchAsync(s3DocJsonRoot);
        if (response.status !== 200) {
            // TODO: Show the user an error message when the docs fail to load
            const errMsg = await response.text();
            logUtils.log(`Failed to load JSON file list: ${response.status} ${errMsg}`);
            throw new Error(errMsg);
        }
        const responseXML = await response.text();
        const responseJSONString = convert.xml2json(responseXML, {
            compact: true,
        });
        const responseObj = JSON.parse(responseJSONString);
        const fileObjs: S3FileObject[] = _.isArray(responseObj.ListBucketResult.Contents)
            ? (responseObj.ListBucketResult.Contents as S3FileObject[])
            : [responseObj.ListBucketResult.Contents];

        /*
         * S3 simply pre-fixes files in "folders" with the folder name. Thus, since we
         * store docJSONs for multiple packages in a single S3 bucket, we must filter out
         * the versionFileNames for a given folder here (ignoring folder entries)
         *
         * Example S3 response:
         * <ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
         * <Name>staging-doc-jsons</Name>
         * <Prefix/>
         * <Marker/>
         * <MaxKeys>1000</MaxKeys>
         * <IsTruncated>false</IsTruncated>
         * <Contents>
         * <Key>0xjs/</Key>
         * <LastModified>2018-03-16T13:17:46.000Z</LastModified>
         * <ETag>"d41d8cd98f00b204e9800998ecf8427e"</ETag>
         * <Size>0</Size>
         * <StorageClass>STANDARD</StorageClass>
         * </Contents>
         * <Contents>
         * <Key>0xjs/v0.1.0.json</Key>
         * <LastModified>2018-03-16T13:18:23.000Z</LastModified>
         * <ETag>"b4f7f74913aab4a5ad1e6a58fcb3b274"</ETag>
         * <Size>1039050</Size>
         * <StorageClass>STANDARD</StorageClass>
         * </Contents>
         */
        const relevantObjs = _.filter(fileObjs, fileObj => {
            const key = fileObj.Key._text;
            const isInFolderOfInterest = _.includes(key, folderName);
            const isFileEntry = !_.endsWith(key, '/');
            return isInFolderOfInterest && isFileEntry;
        });

        const versionFilePaths = _.map(relevantObjs, fileObj => {
            return fileObj.Key._text;
        });
        return versionFilePaths;
    },
    async getJSONDocFileAsync(filePath: string, s3DocJsonRoot: string): Promise<GeneratedDocJson | DocAgnosticFormat> {
        const endpoint = `${s3DocJsonRoot}/${filePath}`;
        const response = await fetchAsync(endpoint);
        if (response.status !== 200) {
            // TODO: Show the user an error message when the docs fail to load
            const errMsg = await response.text();
            logUtils.log(`Failed to load Doc JSON: ${response.status} ${errMsg}`);
            throw new Error(errMsg);
        }
        const jsonDocObj = await response.json();
        return jsonDocObj;
    },
};
