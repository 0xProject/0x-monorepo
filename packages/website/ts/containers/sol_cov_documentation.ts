import { constants as docConstants, DocsInfo, DocsInfoConfig, SupportedDocJson } from '@0xproject/react-docs';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { DocPage as DocPageComponent, DocPageProps } from 'ts/pages/documentation/doc_page';
import { Dispatcher } from 'ts/redux/dispatcher';
import { State } from 'ts/redux/reducer';
import { DocPackages, Environments, WebsitePaths } from 'ts/types';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';
import { Translate } from 'ts/utils/translate';

/* tslint:disable:no-var-requires */
const IntroMarkdown = require('md/docs/sol_cov/introduction');
const InstallationMarkdown = require('md/docs/sol_cov/installation');
const UsageMarkdown = require('md/docs/sol_cov/usage');
/* tslint:enable:no-var-requires */

const docSections = {
    introduction: 'introduction',
    installation: 'installation',
    usage: 'usage',
    coverageSubprovider: 'coverageSubprovider',
    types: docConstants.TYPES_SECTION_NAME,
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.SolCov,
    type: SupportedDocJson.TypeDoc,
    displayName: 'Sol-cov',
    packageUrl: 'https://github.com/0xProject/0x-monorepo',
    menu: {
        introduction: [docSections.introduction],
        install: [docSections.installation],
        usage: [docSections.usage],
        coverageSubprovider: [docSections.coverageSubprovider],
        types: [docSections.types],
    },
    sectionNameToMarkdown: {
        [docSections.introduction]: IntroMarkdown,
        [docSections.installation]: InstallationMarkdown,
        [docSections.usage]: UsageMarkdown,
    },
    sectionNameToModulePath: {
        [docSections.coverageSubprovider]: ['"sol-cov/src/coverage_subprovider"'],
        [docSections.types]: ['"subproviders/src/types"', '"types/src/index"'],
    },
    menuSubsectionToVersionWhenIntroduced: {},
    sections: docSections,
    visibleConstructors: [docSections.coverageSubprovider],
    typeConfigs: {
        // Note: This needs to be kept in sync with the types exported in index.ts. Unfortunately there is
        // currently no way to extract the re-exported types from index.ts via TypeDoc :(
        publicTypes: ['NextCallback', 'OnNextCompleted', 'ErrorCallback', 'JSONRPCRequestPayload'],
        typeNameToExternalLink: {},
        typeNameToPrefix: {},
        typeNameToDocSection: {},
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

const mapStateToProps = (state: State, ownProps: DocPageProps): ConnectedState => ({
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
