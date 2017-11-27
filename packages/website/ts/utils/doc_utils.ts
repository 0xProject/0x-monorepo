import * as _ from 'lodash';
import findVersions = require('find-versions');
import convert = require('xml-js');
import {constants} from 'ts/utils/constants';
import {utils} from 'ts/utils/utils';
import {VersionToFileName, S3FileObject, TypeDocNode, DoxityDocObj} from 'ts/types';

export const docUtils = {
    async getVersionToFileNameAsync(s3DocJsonRoot: string):
        Promise<VersionToFileName> {
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
            utils.consoleLog(`Failed to load JSON file list: ${response.status} ${errMsg}`);
            return;
        }
        const responseXML = await response.text();
        const responseJSONString = convert.xml2json(responseXML, {
            compact: true,
        });
        const responseObj = JSON.parse(responseJSONString);
        let fileObjs: S3FileObject[];
        if (_.isArray(responseObj.ListBucketResult.Contents)) {
            fileObjs = responseObj.ListBucketResult.Contents as S3FileObject[];
        } else {
            fileObjs = [responseObj.ListBucketResult.Contents];
        }
        const versionFileNames = _.map(fileObjs, fileObj => {
            return fileObj.Key._text;
        });
        return versionFileNames;
    },
    async getJSONDocFileAsync(fileName: string, s3DocJsonRoot: string): Promise<TypeDocNode|DoxityDocObj> {
        const endpoint = `${s3DocJsonRoot}/${fileName}`;
        const response = await fetch(endpoint);
        if (response.status !== 200) {
            // TODO: Show the user an error message when the docs fail to load
            const errMsg = await response.text();
            utils.consoleLog(`Failed to load Doc JSON: ${response.status} ${errMsg}`);
            return;
        }
        const jsonDocObj = await response.json();
        return jsonDocObj;
    },
};
