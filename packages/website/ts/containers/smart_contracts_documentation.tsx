import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { DocPage as DocPageComponent, DocPageProps } from 'ts/pages/documentation/doc_page';
import { DocsInfo } from 'ts/pages/documentation/docs_info';
import { Dispatcher } from 'ts/redux/dispatcher';
import { State } from 'ts/redux/reducer';
import { DocsInfoConfig, SmartContractDocSections as Sections, WebsitePaths } from 'ts/types';
import { doxityUtils } from 'ts/utils/doxity_utils';
import { Translate } from 'ts/utils/translate';

/* tslint:disable:no-var-requires */
const IntroMarkdown = require('md/docs/smart_contracts/introduction');
/* tslint:enable:no-var-requires */

const docsInfoConfig: DocsInfoConfig = {
    displayName: '0x Smart Contracts',
    packageUrl: 'https://github.com/0xProject/contracts',
    websitePath: WebsitePaths.SmartContracts,
    menu: {
        introduction: [Sections.Introduction],
        contracts: [Sections.Exchange, Sections.TokenRegistry, Sections.ZRXToken, Sections.TokenTransferProxy],
    },
    sectionNameToMarkdown: {
        [Sections.Introduction]: IntroMarkdown,
    },
    sections: {
        Introduction: Sections.Introduction,
        Exchange: Sections.Exchange,
        TokenTransferProxy: Sections.TokenTransferProxy,
        TokenRegistry: Sections.TokenRegistry,
        ZRXToken: Sections.ZRXToken,
    },
    visibleConstructors: [Sections.Exchange, Sections.TokenRegistry, Sections.ZRXToken, Sections.TokenTransferProxy],
    convertToDocAgnosticFormatFn: doxityUtils.convertToDocAgnosticFormat.bind(doxityUtils),
};
const docsInfo = new DocsInfo(docsInfoConfig);

interface ConnectedState {
    docsVersion: string;
    availableDocVersions: string[];
    translate: Translate;
}

interface ConnectedDispatch {
    dispatcher: Dispatcher;
    docsInfo: DocsInfo;
}

const mapStateToProps = (state: State, ownProps: DocPageProps): ConnectedState => ({
    docsVersion: state.docsVersion,
    availableDocVersions: state.availableDocVersions,
    translate: state.translate,
});

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
    docsInfo,
});

export const Documentation: React.ComponentClass<DocPageProps> = connect(mapStateToProps, mapDispatchToProps)(
    DocPageComponent,
);
