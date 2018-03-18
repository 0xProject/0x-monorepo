import { DoxityDocObj, TypeDocNode } from '@0xproject/react-docs';
import { logUtils } from '@0xproject/utils';
import findVersions = require('find-versions');
import * as _ from 'lodash';
import { S3FileObject, VersionToFileName } from 'ts/types';
import { utils } from 'ts/utils/utils';
import convert = require('xml-js');

export const docUtils = {
    async getVersionToFileNameAsync(s3DocJsonRoot: string): Promise<VersionToFileName> {
        const versionFileNames = await this.getVersionFileNamesAsync(s3DocJsonRoot);
        const versionToFileName: VersionToFileName = {};
        _.each(versionFileNames, fileName => {
            const [version] = findVersions(fileName);
            versionToFileName[version] = fileName;
        });
        return versionToFileName;
    },
    async getVersionFileNamesAsync(s3DocJsonRoot: string): Promise<string[]> {
        const response = await fetch(s3DocJsonRoot);
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

        const versionFileNames = _.map(fileObjs, fileObj => {
            return fileObj.Key._text;
        });
        return versionFileNames;
    },
    async getJSONDocFileAsync(fileName: string, s3DocJsonRoot: string): Promise<TypeDocNode | DoxityDocObj> {
        const endpoint = `${s3DocJsonRoot}/${fileName}`;
        const response = await fetch(endpoint);
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
