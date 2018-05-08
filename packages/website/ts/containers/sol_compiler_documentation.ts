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
const IntroMarkdown = require('md/docs/sol-compiler/introduction');
const InstallationMarkdown = require('md/docs/sol-compiler/installation');
const UsageMarkdown = require('md/docs/sol-compiler/usage');
/* tslint:enable:no-var-requires */

const docSections = {
    introduction: 'introduction',
    installation: 'installation',
    usage: 'usage',
    compiler: 'compiler',
    types: docConstants.TYPES_SECTION_NAME,
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.SolCompiler,
    type: SupportedDocJson.TypeDoc,
    displayName: 'Sol Compiler',
    packageUrl: 'https://github.com/0xProject/0x-monorepo',
    menu: {
        introduction: [docSections.introduction],
        install: [docSections.installation],
        usage: [docSections.usage],
        compiler: [docSections.compiler],
        types: [docSections.types],
    },
    sectionNameToMarkdown: {
        [docSections.introduction]: IntroMarkdown,
        [docSections.installation]: InstallationMarkdown,
        [docSections.usage]: UsageMarkdown,
    },
    sectionNameToModulePath: {
        [docSections.compiler]: ['"sol-compiler/src/compiler"'],
        [docSections.types]: ['"sol-compiler/src/utils/types"', '"types/src/index"'],
    },
    menuSubsectionToVersionWhenIntroduced: {},
    sections: docSections,
    visibleConstructors: [docSections.compiler],
    typeConfigs: {
        // Note: This needs to be kept in sync with the types exported in index.ts. Unfortunately there is
        // currently no way to extract the re-exported types from index.ts via TypeDoc :(
        publicTypes: [
            'CompilerOptions',
            'DeployerOptions',
            'BaseDeployerOptions',
            'UrlDeployerOptions',
            'ProviderDeployerOptions',
            'TxData',
        ],
        typeNameToExternalLink: {
            Web3: constants.URL_WEB3_DOCS,
            BigNumber: constants.URL_BIGNUMBERJS_GITHUB,
            ContractInstance: 'https://github.com/0xProject/web3-typescript-typings/blob/f5bcb96/index.d.ts#L98',
        },
        typeNameToPrefix: {
            ContractInstance: 'Web3',
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
