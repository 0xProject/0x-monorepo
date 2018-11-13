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
const IntroMarkdown1 = require('md/docs/sol-compiler/1/introduction');
const InstallationMarkdown1 = require('md/docs/sol-compiler/1/installation');
const InstallationMarkdown2 = require('md/docs/sol-compiler/2/installation');
const UsageMarkdown1 = require('md/docs/sol-compiler/1/usage');
const UsageMarkdown2 = require('md/docs/sol-compiler/2/usage');
/* tslint:enable:no-var-requires */

const markdownSections = {
    introduction: 'introduction',
    installation: 'installation',
    usage: 'usage',
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.SolCompiler,
    packageName: '@0x/sol-compiler',
    type: SupportedDocJson.TypeDoc,
    displayName: 'Solidity Compiler',
    packageUrl: 'https://github.com/0xProject/0x-monorepo',
    markdownMenu: {
        'getting-started': [markdownSections.introduction, markdownSections.installation, markdownSections.usage],
    },
    sectionNameToMarkdownByVersion: {
        '0.0.1': {
            [markdownSections.introduction]: IntroMarkdown1,
            [markdownSections.installation]: InstallationMarkdown1,
            [markdownSections.usage]: UsageMarkdown1,
        },
        '1.1.8': {
            [markdownSections.introduction]: IntroMarkdown1,
            [markdownSections.installation]: InstallationMarkdown2,
            [markdownSections.usage]: UsageMarkdown2,
        },
    },
    markdownSections,
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
