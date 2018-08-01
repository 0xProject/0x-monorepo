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
const IntroMarkdown = require('md/docs/ethereum_types/introduction');
const InstallationMarkdown = require('md/docs/ethereum_types/installation');
/* tslint:enable:no-var-requires */

const docSections = {
    introduction: 'introduction',
    installation: 'installation',
    types: docConstants.TYPES_SECTION_NAME,
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.EthereumTypes,
    type: SupportedDocJson.TypeDoc,
    displayName: 'Ethereum Types',
    packageUrl: 'https://github.com/0xProject/0x-monorepo/packages/ethereum-types',
    menu: {
        introduction: [docSections.introduction],
        install: [docSections.installation],
        types: [docSections.types],
    },
    sectionNameToMarkdownByVersion: {
        '0.0.1': {
            [docSections.introduction]: IntroMarkdown,
            [docSections.installation]: InstallationMarkdown,
        },
    },
    sections: docSections,
    typeConfigs: {
        typeNameToExternalLink: {
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
