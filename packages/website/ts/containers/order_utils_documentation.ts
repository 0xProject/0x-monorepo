import { DocsInfo, DocsInfoConfig, SupportedDocJson } from '@0xproject/react-docs';
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
const IntroMarkdown = require('md/docs/order_utils/introduction');
const InstallationMarkdown = require('md/docs/order_utils/installation');
/* tslint:enable:no-var-requires */

const docSections = {
    introduction: 'introduction',
    installation: 'installation',
    usage: 'usage',
    types: 'types',
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.OrderUtils,
    type: SupportedDocJson.TypeDoc,
    displayName: 'Order utils',
    packageUrl: 'https://github.com/0xProject/0x-monorepo',
    menu: {
        introduction: [docSections.introduction],
        install: [docSections.installation],
        usage: [docSections.usage],
        types: [docSections.types],
    },
    sectionNameToMarkdown: {
        [docSections.introduction]: IntroMarkdown,
        [docSections.installation]: InstallationMarkdown,
    },
    sectionNameToModulePath: {
        [docSections.usage]: [
            '"order-utils/src/order_hash"',
            '"order-utils/src/signature_utils"',
            '"order-utils/src/order_factory"',
            '"order-utils/src/salt"',
            '"order-utils/src/assert"',
            '"order-utils/src/constants"',
        ],
        [docSections.types]: ['"order-utils/src/types"', '"types/src/index"'],
    },
    menuSubsectionToVersionWhenIntroduced: {},
    sections: docSections,
    visibleConstructors: [],
    typeConfigs: {
        // Note: This needs to be kept in sync with the types exported in index.ts. Unfortunately there is
        // currently no way to extract the re-exported types from index.ts via TypeDoc :(
        publicTypes: [
            'OrderError',
            'Order',
            'SignedOrder',
            'ECSignature',
            'Provider',
            'JSONRPCRequestPayload',
            'JSONRPCResponsePayload',
            'JSONRPCErrorCallback',
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
