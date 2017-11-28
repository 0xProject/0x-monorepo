import BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch, Store as ReduxStore} from 'redux';
import {Blockchain} from 'ts/blockchain';
import {DocsInfo} from 'ts/pages/documentation/docs_info';
import {
    Documentation as DocumentationComponent,
    DocumentationAllProps,
} from 'ts/pages/documentation/documentation';
import {Dispatcher} from 'ts/redux/dispatcher';
import {State} from 'ts/redux/reducer';
import {DocsInfoConfig, WebsitePaths} from 'ts/types';
import {typeDocUtils} from 'ts/utils/typedoc_utils';

/* tslint:disable:no-var-requires */
const IntroMarkdown = require('md/docs/0xjs/introduction');
const InstallationMarkdown = require('md/docs/0xjs/installation');
const AsyncMarkdown = require('md/docs/0xjs/async');
const ErrorsMarkdown = require('md/docs/0xjs/errors');
const versioningMarkdown = require('md/docs/0xjs/versioning');
/* tslint:enable:no-var-requires */

const zeroExJsDocSections = {
    introduction: 'introduction',
    installation: 'installation',
    testrpc: 'testrpc',
    async: 'async',
    errors: 'errors',
    versioning: 'versioning',
    zeroEx: 'zeroEx',
    exchange: 'exchange',
    token: 'token',
    tokenRegistry: 'tokenRegistry',
    etherToken: 'etherToken',
    proxy: 'proxy',
    types: 'types',
};

const docsInfoConfig: DocsInfoConfig = {
    packageName: '0x.js',
    packageUrl: 'https://github.com/0xProject/0x.js',
    subPackageName: '0x.js',
    websitePath: WebsitePaths.ZeroExJs,
    docsJsonRoot: 'https://s3.amazonaws.com/0xjs-docs-jsons',
    menu: {
        introduction: [
            zeroExJsDocSections.introduction,
        ],
        install: [
            zeroExJsDocSections.installation,
        ],
        topics: [
            zeroExJsDocSections.async,
            zeroExJsDocSections.errors,
            zeroExJsDocSections.versioning,
        ],
        zeroEx: [
            zeroExJsDocSections.zeroEx,
        ],
        contracts: [
            zeroExJsDocSections.exchange,
            zeroExJsDocSections.token,
            zeroExJsDocSections.tokenRegistry,
            zeroExJsDocSections.etherToken,
            zeroExJsDocSections.proxy,
        ],
        types: [
            zeroExJsDocSections.types,
        ],
    },
    sectionNameToMarkdown: {
        [zeroExJsDocSections.introduction]: IntroMarkdown,
        [zeroExJsDocSections.installation]: InstallationMarkdown,
        [zeroExJsDocSections.async]: AsyncMarkdown,
        [zeroExJsDocSections.errors]: ErrorsMarkdown,
        [zeroExJsDocSections.versioning]: versioningMarkdown,
    },
    // Note: This needs to be kept in sync with the types exported in index.ts. Unfortunately there is
    // currently no way to extract the re-exported types from index.ts via TypeDoc :(
    publicTypes: [
        'Order',
        'SignedOrder',
        'ECSignature',
        'ZeroExError',
        'EventCallback',
        'EventCallbackAsync',
        'EventCallbackSync',
        'ExchangeContractErrs',
        'ContractEvent',
        'Token',
        'ExchangeEvents',
        'IndexedFilterValues',
        'SubscriptionOpts',
        'BlockParam',
        'OrderFillOrKillRequest',
        'OrderCancellationRequest',
        'OrderFillRequest',
        'ContractEventEmitter',
        'Web3Provider',
        'ContractEventArgs',
        'LogCancelArgs',
        'LogFillArgs',
        'LogErrorContractEventArgs',
        'LogFillContractEventArgs',
        'LogCancelContractEventArgs',
        'TokenEvents',
        'ExchangeContractEventArgs',
        'TransferContractEventArgs',
        'ApprovalContractEventArgs',
        'TokenContractEventArgs',
        'ZeroExConfig',
        'TransactionReceiptWithDecodedLogs',
        'LogWithDecodedArgs',
        'DecodedLogArgs',
        'MethodOpts',
        'ValidateOrderFillableOpts',
        'OrderTransactionOpts',
        'TransactionOpts',
        'ContractEventArg',
        'LogEvent',
        'LogEntry',
        'DecodedLogEvent',
    ],
    sectionNameToModulePath: {
        [zeroExJsDocSections.zeroEx]: ['"src/0x"'],
        [zeroExJsDocSections.exchange]: ['"src/contract_wrappers/exchange_wrapper"'],
        [zeroExJsDocSections.tokenRegistry]: ['"src/contract_wrappers/token_registry_wrapper"'],
        [zeroExJsDocSections.token]: ['"src/contract_wrappers/token_wrapper"'],
        [zeroExJsDocSections.etherToken]: ['"src/contract_wrappers/ether_token_wrapper"'],
        [zeroExJsDocSections.proxy]: [
            '"src/contract_wrappers/proxy_wrapper"',
            '"src/contract_wrappers/token_transfer_proxy_wrapper"',
        ],
        [zeroExJsDocSections.types]: ['"src/types"'],
    },
    menuSubsectionToVersionWhenIntroduced: {
        [zeroExJsDocSections.etherToken]: '0.7.1',
        [zeroExJsDocSections.proxy]: '0.8.0',
    },
    sections: zeroExJsDocSections,
    visibleConstructors: [zeroExJsDocSections.zeroEx],
    convertToDocAgnosticFormatFn: typeDocUtils.convertToDocAgnosticFormat.bind(typeDocUtils),
};
const docsInfo = new DocsInfo(docsInfoConfig);

interface ConnectedState {
    docsVersion: string;
    availableDocVersions: string[];
    docsInfo: DocsInfo;
}

interface ConnectedDispatch {
    dispatcher: Dispatcher;
}

const mapStateToProps = (state: State, ownProps: DocumentationAllProps): ConnectedState => ({
    docsVersion: state.docsVersion,
    availableDocVersions: state.availableDocVersions,
    docsInfo,
});

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
});

export const Documentation: React.ComponentClass<DocumentationAllProps> =
  connect(mapStateToProps, mapDispatchToProps)(DocumentationComponent);
