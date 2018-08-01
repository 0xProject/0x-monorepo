import { constants as docConstants, DocsInfo, DocsInfoConfig, SupportedDocJson } from '@0xproject/react-docs';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { DocPage as DocPageComponent, DocPageProps } from 'ts/pages/documentation/doc_page';
import { Dispatcher } from 'ts/redux/dispatcher';
import { State } from 'ts/redux/reducer';
import { DocPackages } from 'ts/types';
import { constants } from 'ts/utils/constants';
import { Translate } from 'ts/utils/translate';

/* tslint:disable:no-var-requires */
const IntroMarkdownV1 = require('md/docs/connect/1.0.0/introduction');
const InstallationMarkdownV1 = require('md/docs/connect/1.0.0/installation');
/* tslint:enable:no-var-requires */

const markdownSections = {
    introduction: 'introduction',
    installation: 'installation',
    httpClient: 'httpClient',
    webSocketOrderbookChannel: 'webSocketOrderbookChannel',
    types: docConstants.TYPES_SECTION_NAME,
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.Connect,
    type: SupportedDocJson.TypeDoc,
    displayName: '0x Connect',
    packageUrl: 'https://github.com/0xProject/0x-monorepo',
    markdownMenu: {
        introduction: [markdownSections.introduction],
        install: [markdownSections.installation],
        httpClient: [markdownSections.httpClient],
        webSocketOrderbookChannel: [markdownSections.webSocketOrderbookChannel],
        types: [markdownSections.types],
    },
    sectionNameToMarkdownByVersion: {
        '0.0.1': {
            [markdownSections.introduction]: IntroMarkdownV1,
            [markdownSections.installation]: InstallationMarkdownV1,
        },
    },
    markdownSections: markdownSections,
    typeConfigs: {
        typeNameToExternalLink: {
            Provider: constants.URL_WEB3_PROVIDER_DOCS,
            BigNumber: constants.URL_BIGNUMBERJS_GITHUB,
        },
    },
};
const docsInfo = new DocsInfo(docsInfoConfig);

interface ConnectedState {
    docsVersion: string;
    availableDocVersions: string[];
    docsInfo: DocsInfo;
    translate: Translate;
}

interface ConnectedDispatch {
    dispatcher: Dispatcher;
}

const mapStateToProps = (state: State, _ownProps: DocPageProps): ConnectedState => ({
    docsVersion: state.docsVersion,
    availableDocVersions: state.availableDocVersions,
    translate: state.translate,
    docsInfo,
});

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
});

export const Documentation: React.ComponentClass<DocPageProps> = connect(mapStateToProps, mapDispatchToProps)(
    DocPageComponent,
);
