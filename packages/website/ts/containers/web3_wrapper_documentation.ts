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
const IntroMarkdown = require('md/docs/web3_wrapper/introduction');
const InstallationMarkdown = require('md/docs/web3_wrapper/installation');
/* tslint:enable:no-var-requires */

const docSections = {
    introduction: 'introduction',
    installation: 'installation',
    web3Wrapper: 'web3Wrapper',
    types: docConstants.TYPES_SECTION_NAME,
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.Web3Wrapper,
    type: SupportedDocJson.TypeDoc,
    displayName: 'Web3Wrapper',
    packageUrl: 'https://github.com/0xProject/0x-monorepo',
    menu: {
        introduction: [docSections.introduction],
        install: [docSections.installation],
        web3Wrapper: [docSections.web3Wrapper],
        types: [docSections.types],
    },
    sectionNameToMarkdown: {
        [docSections.introduction]: IntroMarkdown,
        [docSections.installation]: InstallationMarkdown,
    },
    sectionNameToModulePath: {
        [docSections.web3Wrapper]: ['"web3-wrapper/src/index"'],
        [docSections.types]: ['"types/src/index"'],
    },
    menuSubsectionToVersionWhenIntroduced: {},
    sections: docSections,
    visibleConstructors: [docSections.web3Wrapper],
    typeConfigs: {
        // Note: This needs to be kept in sync with the types exported in index.ts. Unfortunately there is
        // currently no way to extract the re-exported types from index.ts via TypeDoc :(
        publicTypes: ['TxData', 'TransactionReceipt', 'RawLogEntry'],
        typeNameToExternalLink: {
            Web3: 'https://github.com/ethereum/wiki/wiki/JavaScript-API',
            Provider: 'https://github.com/0xProject/web3-typescript-typings/blob/f5bcb96/index.d.ts#L150',
            BigNumber: 'https://github.com/0xProject/web3-typescript-typings/blob/f5bcb96/index.d.ts#L127',
            LogEntryEvent: 'http://mikemcl.github.io/bignumber.js',
            CallData: 'https://github.com/0xProject/web3-typescript-typings/blob/f5bcb96/index.d.ts#L348',
            BlockWithoutTransactionData:
                'https://github.com/0xProject/web3-typescript-typings/blob/f5bcb96/index.d.ts#L314',
            LogEntry: 'https://github.com/0xProject/web3-typescript-typings/blob/f5bcb96/index.d.ts#L366',
            FilterObject: 'https://github.com/0xProject/web3-typescript-typings/blob/f5bcb96/index.d.ts#L109',
            ['Web3.BlockParam']: 'https://github.com/0xProject/web3-typescript-typings/blob/f5bcb96/index.d.ts#L278',
            ['Web3.ContractAbi']: 'https://github.com/0xProject/web3-typescript-typings/blob/f5bcb96/index.d.ts#L47',
        },
        typeNameToPrefix: {
            Provider: 'Web3',
            CallData: 'Web3',
            BlockWithoutTransactionData: 'Web3',
            LogEntry: 'Web3',
            FilterObject: 'Web3',
        },
        typeNameToDocSection: {
            Web3Wrapper: docSections.web3Wrapper,
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
