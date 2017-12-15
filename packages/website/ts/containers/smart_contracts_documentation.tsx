import * as _ from 'lodash';
import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {DocsInfo} from 'ts/pages/documentation/docs_info';
import {
    Documentation as DocumentationComponent,
    DocumentationAllProps,
} from 'ts/pages/documentation/documentation';
import {Dispatcher} from 'ts/redux/dispatcher';
import {State} from 'ts/redux/reducer';
import {DocsInfoConfig, WebsitePaths} from 'ts/types';
import {constants} from 'ts/utils/constants';
import {doxityUtils} from 'ts/utils/doxity_utils';

/* tslint:disable:no-var-requires */
const IntroMarkdown = require('md/docs/smart_contracts/introduction');
/* tslint:enable:no-var-requires */

const sections = constants.smartContractDocSections;

const docsInfoConfig: DocsInfoConfig = {
    displayName: '0x Smart Contracts',
    packageUrl: 'https://github.com/0xProject/contracts',
    websitePath: WebsitePaths.SmartContracts,
    docsJsonRoot: 'https://s3.amazonaws.com/smart-contracts-docs-json',
    menu: {
        introduction: [
            sections.Introduction,
        ],
        contracts: [
            sections.Exchange,
            sections.TokenRegistry,
            sections.ZRXToken,
            sections.EtherToken,
            sections.TokenTransferProxy,
        ],
    },
    sectionNameToMarkdown: {
        [sections.Introduction]: IntroMarkdown,
    },
    sections,
    visibleConstructors: [
        sections.Exchange,
        sections.TokenRegistry,
        sections.ZRXToken,
        sections.EtherToken,
        sections.TokenTransferProxy,
    ],
    convertToDocAgnosticFormatFn: doxityUtils.convertToDocAgnosticFormat.bind(doxityUtils),
};
const docsInfo = new DocsInfo(docsInfoConfig);

interface ConnectedState {
    docsVersion: string;
    availableDocVersions: string[];
}

interface ConnectedDispatch {
    dispatcher: Dispatcher;
    docsInfo: DocsInfo;
}

const mapStateToProps = (state: State, ownProps: DocumentationAllProps): ConnectedState => ({
    docsVersion: state.docsVersion,
    availableDocVersions: state.availableDocVersions,
});

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
    docsInfo,
});

export const Documentation: React.ComponentClass<DocumentationAllProps> =
  connect(mapStateToProps, mapDispatchToProps)(DocumentationComponent);
