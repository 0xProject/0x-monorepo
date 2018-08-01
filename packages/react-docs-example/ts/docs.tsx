import * as React from 'react';

import {
    constants,
    DocAgnosticFormat,
    DocsInfo,
    DocsInfoConfig,
    Documentation,
    SupportedDocJson,
    TypeDocNode,
} from '@0xproject/react-docs';

import * as v0TypeDocJson from './json/0.1.12.json';
import * as v2TypeDocJson from './json/0.2.0.json';

// tslint:disable-next-line:no-implicit-dependencies no-var-requires
const IntroMarkdownV1 = require('md/introduction');

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
    sections: docSections,
    typeConfigs: {
        typeNameToExternalLink: {
            Web3: 'https://github.com/ethereum/wiki/wiki/JavaScript-API',
            Provider: 'https://github.com/0xProject/web3-typescript-typings/blob/f5bcb96/index.d.ts#L150',
            BigNumber: 'http://mikemcl.github.io/bignumber.js',
        },
        typeNameToPrefix: {
            Provider: 'Web3',
        },
        typeNameToDocSection: {
            Web3Wrapper: docSections.web3Wrapper,
        },
    },
};
const docsInfo = new DocsInfo(docsInfoConfig);

const availableVersions = ['0.1.12', '0.2.0'];
const versionToDocJSON: { [semver: string]: object } = {
    [availableVersions[0]]: v0TypeDocJson,
    [availableVersions[1]]: v2TypeDocJson,
};

export interface DocsProps {}

export interface DocsState {
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
    public render(): React.ReactNode {
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
    private _onVersionSelected(semver: string): void {
        const selectedDocJSON = versionToDocJSON[semver];
        this.setState({
            selectedVersion: semver,
            docAgnosticFormat: docsInfo.convertToDocAgnosticFormat(selectedDocJSON as TypeDocNode),
        });
    }
    private _getSourceUrl(): string {
        const sourceUrl = `${docsInfoConfig.packageUrl}/blob/@0xproject/web3-wrapper@${
            this.state.selectedVersion
        }/packages`;
        return sourceUrl;
    }
}
