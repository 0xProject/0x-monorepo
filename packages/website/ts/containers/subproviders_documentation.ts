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
const IntroMarkdown = require('md/docs/subproviders/introduction');
const InstallationMarkdown = require('md/docs/subproviders/installation');
const LedgerNodeHidMarkdown = require('md/docs/subproviders/ledger_node_hid');
/* tslint:enable:no-var-requires */

const docSections = {
    introduction: 'introduction',
    installation: 'installation',
    subprovider: 'subprovider',
    ledgerSubprovider: 'ledgerSubprovider',
    ledgerNodeHid: 'ledger-node-hid-issue',
    factoryMethods: 'factory-methods',
    emptyWalletSubprovider: 'emptyWalletSubprovider',
    fakeGasEstimateSubprovider: 'fakeGasEstimateSubprovider',
    injectedWeb3Subprovider: 'injectedWeb3Subprovider',
    redundantRPCSubprovider: 'redundantRPCSubprovider',
    ganacheSubprovider: 'ganacheSubprovider',
    nonceTrackerSubprovider: 'nonceTrackerSubprovider',
    privateKeyWalletSubprovider: 'privateKeyWalletSubprovider',
    mnemonicWalletSubprovider: 'mnemonicWalletSubprovider',
    types: docConstants.TYPES_SECTION_NAME,
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.Subproviders,
    type: SupportedDocJson.TypeDoc,
    displayName: 'Subproviders',
    packageUrl: 'https://github.com/0xProject/0x-monorepo',
    menu: {
        introduction: [docSections.introduction],
        install: [docSections.installation],
        subprovider: [docSections.subprovider],
        ['ledger-subprovider']: [docSections.ledgerSubprovider],
        ['ledger-node-hid-issue']: [docSections.ledgerNodeHid],
        ['private-key-wallet-subprovider']: [docSections.privateKeyWalletSubprovider],
        ['mnemonic-wallet-subprovider']: [docSections.mnemonicWalletSubprovider],
        ['factory-methods']: [docSections.factoryMethods],
        ['emptyWallet-subprovider']: [docSections.emptyWalletSubprovider],
        ['fakeGasEstimate-subprovider']: [docSections.fakeGasEstimateSubprovider],
        ['injectedWeb3-subprovider']: [docSections.injectedWeb3Subprovider],
        ['redundantRPC-subprovider']: [docSections.redundantRPCSubprovider],
        ['ganache-subprovider']: [docSections.ganacheSubprovider],
        ['nonceTracker-subprovider']: [docSections.nonceTrackerSubprovider],
        types: [docSections.types],
    },
    sectionNameToMarkdown: {
        [docSections.introduction]: IntroMarkdown,
        [docSections.installation]: InstallationMarkdown,
        [docSections.ledgerNodeHid]: LedgerNodeHidMarkdown,
    },
    sectionNameToModulePath: {
        [docSections.subprovider]: ['"subproviders/src/subproviders/subprovider"'],
        [docSections.ledgerSubprovider]: ['"subproviders/src/subproviders/ledger"'],
        [docSections.privateKeyWalletSubprovider]: ['"subproviders/src/subproviders/private_key_wallet"'],
        [docSections.mnemonicWalletSubprovider]: ['"subproviders/src/subproviders/mnemonic_wallet"'],
        [docSections.factoryMethods]: ['"subproviders/src/index"'],
        [docSections.emptyWalletSubprovider]: ['"subproviders/src/subproviders/empty_wallet_subprovider"'],
        [docSections.fakeGasEstimateSubprovider]: ['"subproviders/src/subproviders/fake_gas_estimate_subprovider"'],
        [docSections.injectedWeb3Subprovider]: ['"subproviders/src/subproviders/injected_web3"'],
        [docSections.redundantRPCSubprovider]: ['"subproviders/src/subproviders/redundant_rpc"'],
        [docSections.ganacheSubprovider]: ['"subproviders/src/subproviders/ganache"'],
        [docSections.nonceTrackerSubprovider]: ['"subproviders/src/subproviders/nonce_tracker"'],
        [docSections.types]: ['"deployer/src/utils/types"', '"types/src/index"', '"subproviders/src/types"'],
    },
    menuSubsectionToVersionWhenIntroduced: {},
    sections: docSections,
    visibleConstructors: [
        docSections.subprovider,
        docSections.ledgerSubprovider,
        docSections.privateKeyWalletSubprovider,
        docSections.mnemonicWalletSubprovider,
        docSections.emptyWalletSubprovider,
        docSections.fakeGasEstimateSubprovider,
        docSections.injectedWeb3Subprovider,
        docSections.redundantRPCSubprovider,
        docSections.ganacheSubprovider,
        docSections.nonceTrackerSubprovider,
    ],
    typeConfigs: {
        // Note: This needs to be kept in sync with the types exported in index.ts. Unfortunately there is
        // currently no way to extract the re-exported types from index.ts via TypeDoc :(
        publicTypes: [
            'Callback',
            'NextCallback',
            'ErrorCallback',
            'ECSignature',
            'JSONRPCRequestPayloadWithMethod',
            'JSONRPCRequestPayload',
            'JSONRPCResponsePayload',
            'AccountFetchingConfigs',
            'LedgerEthereumClientFactoryAsync',
            'PartialTxParams',
            'LedgerEthereumClient',
            'LedgerSubproviderConfigs',
            'MnemonicWalletSubproviderConfigs',
            'OnNextCompleted',
            'Provider',
        ],
        typeNameToExternalLink: {
            Web3: constants.URL_WEB3_DOCS,
            BigNumber: constants.URL_BIGNUMBERJS_GITHUB,
        },
        typeNameToPrefix: {},
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
