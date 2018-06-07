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
const IntroMarkdown = require('md/docs/connect/introduction');
const InstallationMarkdown = require('md/docs/connect/installation');
/* tslint:enable:no-var-requires */

const connectDocSections = {
    introduction: 'introduction',
    installation: 'installation',
    httpClient: 'httpClient',
    webSocketOrderbookChannel: 'webSocketOrderbookChannel',
    types: docConstants.TYPES_SECTION_NAME,
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.Connect,
    type: SupportedDocJson.TypeDoc,
    displayName: '0x Connect',
    packageUrl: 'https://github.com/0xProject/0x-monorepo',
    menu: {
        introduction: [connectDocSections.introduction],
        install: [connectDocSections.installation],
        httpClient: [connectDocSections.httpClient],
        webSocketOrderbookChannel: [connectDocSections.webSocketOrderbookChannel],
        types: [connectDocSections.types],
    },
    sectionNameToMarkdown: {
        [connectDocSections.introduction]: IntroMarkdown,
        [connectDocSections.installation]: InstallationMarkdown,
    },
    sectionNameToModulePath: {
        [connectDocSections.httpClient]: ['"src/http_client"'],
        [connectDocSections.webSocketOrderbookChannel]: ['"src/ws_orderbook_channel"'],
        [connectDocSections.types]: ['"src/types"', '"types/src/index"'],
    },
    menuSubsectionToVersionWhenIntroduced: {},
    sections: connectDocSections,
    visibleConstructors: [connectDocSections.httpClient, connectDocSections.webSocketOrderbookChannel],
    typeConfigs: {
        typeNameToExternalLink: {
            Provider: constants.URL_WEB3_PROVIDER_DOCS,
            BigNumber: constants.URL_BIGNUMBERJS_GITHUB,
        },
        // Note: This needs to be kept in sync with the types exported in index.ts. Unfortunately there is
        // currently no way to extract the re-exported types from index.ts via TypeDoc :(
        publicTypes: [
            'Client',
            'FeesRequest',
            'FeesResponse',
            'OrderbookChannel',
            'OrderbookChannelHandler',
            'OrderbookChannelSubscriptionOpts',
            'OrderbookRequest',
            'OrderbookResponse',
            'OrdersRequest',
            'OrdersRequestOpts',
            'PagedRequestOpts',
            'TokenPairsItem',
            'TokenPairsRequest',
            'TokenPairsRequestOpts',
            'TokenTradeInfo',
            'WebSocketOrderbookChannelConfig',
            'Order',
            'SignedOrder',
            'ECSignature',
        ],
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
