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
        [docSections.web3Wrapper]: ['"web3-wrapper/src/web3_wrapper"'],
        [docSections.types]: ['"types/src/index"'],
    },
    menuSubsectionToVersionWhenIntroduced: {},
    sections: docSections,
    visibleConstructors: [docSections.web3Wrapper],
    typeConfigs: {
        // Note: This needs to be kept in sync with the types exported in index.ts. Unfortunately there is
        // currently no way to extract the re-exported types from index.ts via TypeDoc :(
        publicTypes: [
            'TxData',
            'TransactionReceipt',
            'RawLogEntry',
            'ContractAbi',
            'BlockParam',
            'FilterObject',
            'LogEntry',
            'BlockWithoutTransactionData',
            'CallData',
            'LogEntryEvent',
            'Provider',
            'AbiDefinition',
            'LogTopic',
            'JSONRPCRequestPayload',
            'JSONRPCResponsePayload',
            'BlockParamLiteral',
            'FunctionAbi',
            'EventAbi',
            'JSONRPCErrorCallback',
            'MethodAbi',
            'ConstructorAbi',
            'FallbackAbi',
            'EventParameter',
            'DataItem',
            'StateMutability',
            'Function',
            'Fallback',
            'Constructor',
            'Event',
            'ConstructorStateMutability',
            'TransactionReceiptWithDecodedLogs',
            'DecodedLogArgs',
            'LogWithDecodedArgs',
            'ContractEventArg',
        ],
        typeNameToExternalLink: {
            Web3: constants.URL_WEB3_DOCS,
            BigNumber: constants.URL_BIGNUMBERJS_GITHUB,
        },
        typeNameToPrefix: {},
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
