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
const IntroMarkdown1 = require('md/docs/sol_cov/1/introduction');
const InstallationMarkdown1 = require('md/docs/sol_cov/1/installation');
const UsageMarkdown1 = require('md/docs/sol_cov/1/usage');
const IntroMarkdown2 = require('md/docs/sol_cov/2/introduction');
const InstallationMarkdown2 = require('md/docs/sol_cov/2/installation');
const UsageMarkdown2 = require('md/docs/sol_cov/2/usage');
/* tslint:enable:no-var-requires */

const markdownSections = {
    introduction: 'introduction',
    installation: 'installation',
    usage: 'usage',
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.SolCov,
    packageName: '@0x/sol-cov',
    type: SupportedDocJson.TypeDoc,
    displayName: 'Sol-cov',
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
        '2.1.8': {
            [markdownSections.introduction]: IntroMarkdown2,
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
