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
const IntroMarkdownV1 = require('md/docs/0xjs/1.0.0/introduction');
const InstallationMarkdownV1 = require('md/docs/0xjs/1.0.0/installation');
const AsyncMarkdownV1 = require('md/docs/0xjs/1.0.0/async');
const ErrorsMarkdownV1 = require('md/docs/0xjs/1.0.0/errors');
const versioningMarkdownV1 = require('md/docs/0xjs/1.0.0/versioning');

const IntroMarkdownV2 = require('md/docs/0xjs/2.0.0/introduction');
const versioningMarkdownV2 = require('md/docs/0xjs/2.0.0/versioning');
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
    orderWatcher: 'orderWatcher',
    types: docConstants.TYPES_SECTION_NAME,
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.ZeroExJs,
    type: SupportedDocJson.TypeDoc,
    displayName: '0x.js',
    packageUrl: 'https://github.com/0xProject/0x-monorepo',
    menu: {
        introduction: [zeroExJsDocSections.introduction],
        install: [zeroExJsDocSections.installation],
        topics: [zeroExJsDocSections.async, zeroExJsDocSections.errors, zeroExJsDocSections.versioning],
        zeroEx: [zeroExJsDocSections.zeroEx],
        contracts: [
            zeroExJsDocSections.exchange,
            zeroExJsDocSections.token,
            zeroExJsDocSections.tokenRegistry,
            zeroExJsDocSections.etherToken,
            zeroExJsDocSections.proxy,
        ],
        orderWatcher: [zeroExJsDocSections.orderWatcher],
        types: [zeroExJsDocSections.types],
    },
    sectionNameToMarkdownByVersion: {
        '0.0.1': {
            [zeroExJsDocSections.introduction]: IntroMarkdownV1,
            [zeroExJsDocSections.installation]: InstallationMarkdownV1,
            [zeroExJsDocSections.async]: AsyncMarkdownV1,
            [zeroExJsDocSections.errors]: ErrorsMarkdownV1,
            [zeroExJsDocSections.versioning]: versioningMarkdownV1,
        },
        '1.0.0-rc.1': {
            [zeroExJsDocSections.introduction]: IntroMarkdownV2,
            [zeroExJsDocSections.versioning]: versioningMarkdownV2,
            // These are the same as for V1
            [zeroExJsDocSections.installation]: InstallationMarkdownV1,
            [zeroExJsDocSections.async]: AsyncMarkdownV1,
            [zeroExJsDocSections.errors]: ErrorsMarkdownV1,
        },
    },
    sectionNameToModulePath: {
        [zeroExJsDocSections.zeroEx]: ['"0x.js/src/0x"', '"src/0x"'],
        [zeroExJsDocSections.exchange]: [
            '"0x.js/src/contract_wrappers/exchange_wrapper"',
            '"src/contract_wrappers/exchange_wrapper"',
            '"contract-wrappers/src/contract_wrappers/exchange_wrapper"',
        ],
        [zeroExJsDocSections.tokenRegistry]: [
            '"0x.js/src/contract_wrappers/token_registry_wrapper"',
            '"src/contract_wrappers/token_registry_wrapper"',
            '"contract-wrappers/src/contract_wrappers/token_registry_wrapper"',
        ],
        [zeroExJsDocSections.token]: [
            '"0x.js/src/contract_wrappers/token_wrapper"',
            '"src/contract_wrappers/token_wrapper"',
            '"contract-wrappers/src/contract_wrappers/token_wrapper"',
        ],
        [zeroExJsDocSections.etherToken]: [
            '"0x.js/src/contract_wrappers/ether_token_wrapper"',
            '"src/contract_wrappers/ether_token_wrapper"',
            '"contract-wrappers/src/contract_wrappers/ether_token_wrapper"',
        ],
        [zeroExJsDocSections.proxy]: [
            '"0x.js/src/contract_wrappers/proxy_wrapper"',
            '"0x.js/src/contract_wrappers/token_transfer_proxy_wrapper"',
            '"contract-wrappers/src/contract_wrappers/token_transfer_proxy_wrapper"',
        ],
        [zeroExJsDocSections.orderWatcher]: [
            '"0x.js/src/order_watcher/order_state_watcher"',
            '"src/order_watcher/order_state_watcher"',
            '"order-watcher/src/order_watcher/order_watcher"',
        ],
        [zeroExJsDocSections.types]: [
            '"0x.js/src/types"',
            '"src/types"',
            '"types/src/index"',
            '"contract-wrappers/src/types"',
            '"0x.js/src/contract_wrappers/generated/ether_token"',
            '"0x.js/src/contract_wrappers/generated/token"',
            '"0x.js/src/contract_wrappers/generated/exchange"',
            '"0x.js/src/generated_contract_wrappers/ether_token"',
            '"0x.js/src/generated_contract_wrappers/token"',
            '"0x.js/src/generated_contract_wrappers/exchange"',
        ],
    },
    menuSubsectionToVersionWhenIntroduced: {
        [zeroExJsDocSections.etherToken]: '0.7.1',
        [zeroExJsDocSections.proxy]: '0.8.0',
        [zeroExJsDocSections.orderWatcher]: '0.27.1',
    },
    sections: zeroExJsDocSections,
    visibleConstructors: [zeroExJsDocSections.zeroEx],
    typeConfigs: {
        // Note: This needs to be kept in sync with the types exported in index.ts. Unfortunately there is
        // currently no way to extract the re-exported types from index.ts via TypeDoc :( Make sure to only
        // ADD types here, DO NOT REMOVE types since they might still be needed for older supported versions
        publicTypes: [
            'Order',
            'SignedOrder',
            'ECSignature',
            'ContractWrappersError',
            'EventCallback',
            'EventCallbackAsync',
            'EventCallbackSync',
            'ExchangeContractErrs',
            'ContractEvent',
            'Token',
            'Provider',
            'ExchangeEvents',
            'IndexedFilterValues',
            'SubscriptionOpts',
            'BlockRange',
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
            'EtherTokenContractEventArgs',
            'WithdrawalContractEventArgs',
            'DepositContractEventArgs',
            'TokenEvents',
            'ExchangeContractEventArgs',
            'TransferContractEventArgs',
            'ApprovalContractEventArgs',
            'TokenContractEventArgs',
            'ZeroExConfig',
            'TransactionReceipt',
            'TransactionReceiptWithDecodedLogs',
            'LogWithDecodedArgs',
            'EtherTokenEvents',
            'BlockParamLiteral',
            'DecodedLogArgs',
            'MethodOpts',
            'ValidateOrderFillableOpts',
            'OrderTransactionOpts',
            'TransactionOpts',
            'ContractEventArg',
            'LogEvent',
            'DecodedLogEvent',
            'EventWatcherCallback',
            'OnOrderStateChangeCallback',
            'OrderStateValid',
            'OrderStateInvalid',
            'OrderState',
            'OrderStateWatcherConfig',
            'OrderWatcherConfig',
            'FilterObject',
            'OrderRelevantState',
            'JSONRPCRequestPayload',
            'JSONRPCResponsePayload',
            'JSONRPCErrorCallback',
            'LogEntryEvent',
            'LogEntry',
            'ERC20AssetData',
            'ERC721AssetData',
            'AssetProxyId',
            'WETH9Events',
            'WETH9WithdrawalEventArgs',
            'WETH9ApprovalEventArgs',
            'WETH9EventArgs',
            'WETH9DepositEventArgs',
            'WETH9TransferEventArgs',
            'ERC20TokenTransferEventArgs',
            'ERC20TokenApprovalEventArgs',
            'ERC20TokenEvents',
            'ERC20TokenEventArgs',
            'ERC721TokenApprovalEventArgs',
            'ERC721TokenApprovalForAllEventArgs',
            'ERC721TokenTransferEventArgs',
            'ERC721TokenEvents',
            'ExchangeCancelUpToEventArgs',
            'ExchangeAssetProxyRegisteredEventArgs',
            'ExchangeFillEventArgs',
            'ExchangeCancelEventArgs',
            'ExchangeEventArgs',
            'ContractWrappersConfig',
            'MessagePrefixType',
            'MessagePrefixOpts',
            'OrderInfo',
        ],
        typeNameToPrefix: {},
        typeNameToExternalLink: {
            BigNumber: constants.URL_BIGNUMBERJS_GITHUB,
        },
        typeNameToDocSection: {
            ExchangeWrapper: 'exchange',
            TokenWrapper: 'token',
            TokenRegistryWrapper: 'tokenRegistry',
            EtherTokenWrapper: 'etherToken',
            ProxyWrapper: 'proxy',
            TokenTransferProxyWrapper: 'proxy',
            OrderStateWatcher: 'orderWatcher',
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
    docsInfo,
    translate: state.translate,
});

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
});

export const Documentation: React.ComponentClass<DocPageProps> = connect(mapStateToProps, mapDispatchToProps)(
    DocPageComponent,
);
