import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { DocsInfo } from 'ts/pages/documentation/docs_info';
import { Documentation as DocumentationComponent, DocumentationAllProps } from 'ts/pages/documentation/documentation';
import { Dispatcher } from 'ts/redux/dispatcher';
import { State } from 'ts/redux/reducer';
import { DocsInfoConfig, Environments, WebsitePaths } from 'ts/types';
import { configs } from 'ts/utils/configs';
import { constants } from 'ts/utils/constants';
import { typeDocUtils } from 'ts/utils/typedoc_utils';

/* tslint:disable:no-var-requires */
const IntroMarkdown = require('md/docs/connect/introduction');
const InstallationMarkdown = require('md/docs/connect/installation');
/* tslint:enable:no-var-requires */

const connectDocSections = {
    introduction: 'introduction',
    installation: 'installation',
    httpClient: 'httpClient',
    webSocketOrderbookChannel: 'webSocketOrderbookChannel',
    types: constants.TYPES_SECTION_NAME,
};

const s3BucketName =
    configs.ENVIRONMENT === Environments.DEVELOPMENT ? 'staging-connect-docs-jsons' : 'connect-docs-jsons';
const docsJsonRoot = `https://s3.amazonaws.com/${s3BucketName}`;

const docsInfoConfig: DocsInfoConfig = {
    displayName: '0x Connect',
    subPackageName: 'connect',
    packageUrl: 'https://github.com/0xProject/0x.js',
    websitePath: WebsitePaths.Connect,
    docsJsonRoot,
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
        'Order',
        'SignedOrder',
        'ECSignature',
    ],
    sectionNameToModulePath: {
        [connectDocSections.httpClient]: ['"src/http_client"'],
        [connectDocSections.webSocketOrderbookChannel]: ['"src/ws_orderbook_channel"'],
        [connectDocSections.types]: ['"src/types"'],
    },
    menuSubsectionToVersionWhenIntroduced: {},
    sections: connectDocSections,
    visibleConstructors: [connectDocSections.httpClient, connectDocSections.webSocketOrderbookChannel],
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

export const Documentation: React.ComponentClass<DocumentationAllProps> = connect(mapStateToProps, mapDispatchToProps)(
    DocumentationComponent,
);
