import 'basscss/css/basscss.css';
import 'less/all.less';
import { MuiThemeProvider } from 'material-ui/styles';
import * as React from 'react';
import { render } from 'react-dom';
import * as injectTapEventPlugin from 'react-tap-event-plugin';

import { Documentation } from '../components/documentation';
import { DocsInfo } from '../docs_info';
import { DocsInfoConfig, SupportedDocJson } from '../types';
injectTapEventPlugin();

/* tslint:disable:no-var-requires */
const IntroMarkdown = require('md/introduction');
/* tslint:enable:no-var-requires */

const docSections = {
    introduction: 'introduction',
    web3Wrapper: 'web3Wrapper',
};

const docsInfoConfig: DocsInfoConfig = {
    id: 'web3Wrapper',
    type: SupportedDocJson.TypeDoc,
    displayName: 'Web3 Wrapper',
    packageUrl: 'https://github.com/0xProject/0x-monorepo',
    menu: {
        introduction: [docSections.introduction],
        web3Wrapper: [docSections.web3Wrapper],
    },
    sectionNameToMarkdown: {
        [docSections.introduction]: IntroMarkdown,
    },
    // Note: This needs to be kept in sync with the types exported in index.ts. Unfortunately there is
    // currently no way to extract the re-exported types from index.ts via TypeDoc :(
    publicTypes: ['TxData', 'TransactionReceipt', 'RawLogEntry'],
    sectionNameToModulePath: {
        [docSections.web3Wrapper]: ['"index"'],
    },
    menuSubsectionToVersionWhenIntroduced: {},
    sections: docSections,
    visibleConstructors: [docSections.web3Wrapper],
};
const docsInfo = new DocsInfo(docsInfoConfig);

const selectedVersion = '0.2.0';
const availableVersions = ['0.1.12', '0.1.13', '0.1.14', '0.2.0'];

const sourceUrl = `${
    docsInfoConfig.packageUrl
}/blob/@0xproject/web3-wrapper%40${selectedVersion}/packages/web3-wrapper`;

import * as typeDocJson from './json/web3_wrapper_typedoc_output.json';
const docAgnosticFormat = docsInfo.convertToDocAgnosticFormat(typeDocJson);

render(
    <MuiThemeProvider>
        <Documentation
            selectedVersion={selectedVersion}
            availableVersions={availableVersions}
            docsInfo={docsInfo}
            docAgnosticFormat={docAgnosticFormat}
            sourceUrl={sourceUrl}
        />
    </MuiThemeProvider>,
    document.getElementById('app'),
);
