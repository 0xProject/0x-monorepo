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
const IntroMarkdownV1 = require('md/docs/subproviders/introduction');
const InstallationMarkdownV1 = require('md/docs/subproviders/installation');
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
    signerSubprovider: 'signerSubprovider',
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
        ['signer-subprovider']: [docSections.signerSubprovider],
        ['redundantRPC-subprovider']: [docSections.redundantRPCSubprovider],
        ['ganache-subprovider']: [docSections.ganacheSubprovider],
        ['nonceTracker-subprovider']: [docSections.nonceTrackerSubprovider],
        types: [docSections.types],
    },
    sectionNameToMarkdownByVersion: {
        '0.0.1': {
            [docSections.introduction]: IntroMarkdownV1,
            [docSections.installation]: InstallationMarkdownV1,
            [docSections.ledgerNodeHid]: LedgerNodeHidMarkdown,
        },
    },
    sections: docSections,
    typeConfigs: {
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
