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
    sectionNameToMarkdown: {
        [docSections.introduction]: IntroMarkdown,
        [docSections.installation]: InstallationMarkdown,
    },
    sectionNameToModulePath: {
        [docSections.types]: ['"index"'],
    },
    visibleConstructors: [],
    menuSubsectionToVersionWhenIntroduced: {},
    sections: docSections,
    typeConfigs: {
        // Note: This needs to be kept in sync with the types exported in index.ts. Unfortunately there is
        // currently no way to extract the re-exported types from index.ts via TypeDoc :(
        publicTypes: [
            'Provider',
            'JSONRPCErrorCallback',
            'Provider',
            'ContractAbi',
            'AbiDefinition',
            'FunctionAbi',
            'ConstructorStateMutability',
            'StateMutability',
            'MethodAbi',
            'ConstructorAbi',
            'FallbackAbi',
            'EventParameter',
            'EventAbi',
            'DataItem',
            'OpCode',
            // 'StructLog',
            'TransactionTrace',
            'Unit',
            'JSONRPCRequestPayload',
            'JSONRPCResponsePayload',
            'BlockWithoutTransactionData',
            'BlockWithTransactionData',
            'Transaction',
            'TxData',
            'CallData',
            'FilterObject',
            'LogTopic',
            'DecodedLogEntry',
            'DecodedLogEntryEvent',
            'LogEntryEvent',
            'LogEntry',
            'TxDataPayable',
            'TransactionReceipt',
            'AbiType',
            'ContractEventArg',
            'DecodedLogArgs',
            'LogWithDecodedArgs',
            'RawLog',
            'BlockParamLiteral',
            'BlockParam',
            'RawLogEntry',
            'SolidityTypes',
            'TransactionReceiptWithDecodedLogs',
        ],
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
