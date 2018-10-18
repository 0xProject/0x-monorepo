import { DocsInfo, DocsInfoConfig, SupportedDocJson } from '@0x/react-docs';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { DocPage as DocPageComponent, DocPageProps } from 'ts/pages/documentation/doc_page';
import { Dispatcher } from 'ts/redux/dispatcher';
import { State } from 'ts/redux/reducer';
import { DocPackages, ScreenWidths } from 'ts/types';
import { Translate } from 'ts/utils/translate';

/* tslint:disable:no-var-requires */
const IntroMarkdown1 = require('md/docs/subproviders/1/introduction');
const InstallationMarkdown1 = require('md/docs/subproviders/1/installation');
const InstallationMarkdown2 = require('md/docs/subproviders/2/installation');
const LedgerNodeHidMarkdown1 = require('md/docs/subproviders/1/ledger_node_hid');
/* tslint:enable:no-var-requires */

const docSections = {
    introduction: 'introduction',
    installation: 'installation',
    ledgerNodeHid: 'ledger-node-hid-issue',
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.Subproviders,
    packageName: '@0x/subproviders',
    type: SupportedDocJson.TypeDoc,
    displayName: 'Subproviders',
    packageUrl: 'https://github.com/0xProject/0x-monorepo',
    markdownMenu: {
        'getting-started': [docSections.introduction, docSections.installation, docSections.ledgerNodeHid],
    },
    sectionNameToMarkdownByVersion: {
        '0.0.1': {
            [docSections.introduction]: IntroMarkdown1,
            [docSections.installation]: InstallationMarkdown1,
            [docSections.ledgerNodeHid]: LedgerNodeHidMarkdown1,
        },
        '2.1.0': {
            [docSections.introduction]: IntroMarkdown1,
            [docSections.installation]: InstallationMarkdown2,
            [docSections.ledgerNodeHid]: LedgerNodeHidMarkdown1,
        },
    },
    markdownSections: docSections,
};
const docsInfo = new DocsInfo(docsInfoConfig);

interface ConnectedState {
    docsVersion: string;
    availableDocVersions: string[];
    docsInfo: DocsInfo;
    translate: Translate;
    screenWidth: ScreenWidths;
}

interface ConnectedDispatch {
    dispatcher: Dispatcher;
}

const mapStateToProps = (state: State, _ownProps: DocPageProps): ConnectedState => ({
    docsVersion: state.docsVersion,
    availableDocVersions: state.availableDocVersions,
    translate: state.translate,
    docsInfo,
    screenWidth: state.screenWidth,
});

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
});

export const Documentation: React.ComponentClass<DocPageProps> = connect(mapStateToProps, mapDispatchToProps)(
    DocPageComponent,
);
