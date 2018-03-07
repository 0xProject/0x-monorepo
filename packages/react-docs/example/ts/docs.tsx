import * as _ from 'lodash';
import * as React from 'react';

import { Documentation } from '../../src/ts/components/documentation';
import { DocsInfo } from '../../src/ts/docs_info';
import { DocAgnosticFormat, DocsInfoConfig, SupportedDocJson, TypeDocNode } from '../../src/ts/types';
import { constants } from '../../src/ts/utils/constants';

import * as v0TypeDocJson from './json/0.1.12.json';
import * as v2TypeDocJson from './json/0.2.0.json';

/* tslint:disable:no-var-requires */
const IntroMarkdown = require('md/introduction');
/* tslint:enable:no-var-requires */

const docSections = {
    introduction: 'introduction',
    web3Wrapper: 'web3Wrapper',
    types: constants.TYPES_SECTION_NAME,
};

const docsInfoConfig: DocsInfoConfig = {
    id: 'web3Wrapper',
    type: SupportedDocJson.TypeDoc,
    displayName: 'Web3 Wrapper',
    packageUrl: 'https://github.com/0xProject/0x-monorepo',
    menu: {
        introduction: [docSections.introduction],
        web3Wrapper: [docSections.web3Wrapper],
        types: [docSections.types],
    },
    sectionNameToMarkdown: {
        [docSections.introduction]: IntroMarkdown,
    },
    // Note: This needs to be kept in sync with the types exported in index.ts. Unfortunately there is
    // currently no way to extract the re-exported types from index.ts via TypeDoc :(
    publicTypes: ['TxData', 'TransactionReceipt', 'RawLogEntry'],
    sectionNameToModulePath: {
        [docSections.web3Wrapper]: ['"web3-wrapper/src/index"'],
        [docSections.types]: ['"types/src/index"'],
    },
    menuSubsectionToVersionWhenIntroduced: {},
    sections: docSections,
    visibleConstructors: [docSections.web3Wrapper],
};
const docsInfo = new DocsInfo(docsInfoConfig);

const availableVersions = ['0.1.12', '0.2.0'];
const versionToDocJSON: { [semver: string]: object } = {
    [availableVersions[0]]: v0TypeDocJson,
    [availableVersions[1]]: v2TypeDocJson,
};

export interface DocsProps {}

interface DocsState {
    selectedVersion: string;
    docAgnosticFormat?: DocAgnosticFormat;
}

export class Docs extends React.Component<DocsProps, DocsState> {
    constructor(props: DocsProps) {
        super(props);
        this.state = {
            selectedVersion: availableVersions[1],
            docAgnosticFormat: docsInfo.convertToDocAgnosticFormat(v2TypeDocJson),
        };
    }
    public render() {
        const menuSubsectionsBySection = _.isUndefined(this.state.docAgnosticFormat)
            ? {}
            : docsInfo.getMenuSubsectionsBySection(this.state.docAgnosticFormat);
        return (
            <Documentation
                selectedVersion={this.state.selectedVersion}
                availableVersions={availableVersions}
                docsInfo={docsInfo}
                docAgnosticFormat={this.state.docAgnosticFormat}
                sourceUrl={this._getSourceUrl()}
                onVersionSelected={this._onVersionSelected.bind(this)}
            />
        );
    }
    private _onVersionSelected(semver: string) {
        const selectedDocJSON = versionToDocJSON[semver];
        this.setState({
            selectedVersion: semver,
            docAgnosticFormat: docsInfo.convertToDocAgnosticFormat(selectedDocJSON as TypeDocNode),
        });
    }
    private _getSourceUrl() {
        const sourceUrl = `${docsInfoConfig.packageUrl}/blob/@0xproject/web3-wrapper%40${
            this.state.selectedVersion
        }/packages/web3-wrapper`;
        return sourceUrl;
    }
}
