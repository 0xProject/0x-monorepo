import { DocsInfo, DocsInfoConfig, SupportedDocJson } from '@0xproject/react-docs';
import { Networks } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { DocPage as DocPageComponent, DocPageProps } from 'ts/pages/documentation/doc_page';
import { Dispatcher } from 'ts/redux/dispatcher';
import { State } from 'ts/redux/reducer';
import { DocPackages, SmartContractDocSections as Sections, WebsitePaths } from 'ts/types';
import { Translate } from 'ts/utils/translate';

/* tslint:disable:no-var-requires */
const IntroMarkdown = require('md/docs/smart_contracts/introduction');
/* tslint:enable:no-var-requires */

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.SmartContracts,
    type: SupportedDocJson.Doxity,
    displayName: '0x Smart Contracts',
    packageUrl: 'https://github.com/0xProject/contracts',
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
    contractsByVersionByNetworkId: {
        '1.0.0': {
            [Networks.Mainnet]: {
                [Sections.Exchange]: '0x12459c951127e0c374ff9105dda097662a027093',
                [Sections.TokenTransferProxy]: '0x8da0d80f5007ef1e431dd2127178d224e32c2ef4',
                [Sections.ZRXToken]: '0xe41d2489571d322189246dafa5ebde1f4699f498',
                [Sections.TokenRegistry]: '0x926a74c5c36adf004c87399e65f75628b0f98d2c',
            },
            [Networks.Ropsten]: {
                [Sections.Exchange]: '0x479cc461fecd078f766ecc58533d6f69580cf3ac',
                [Sections.TokenTransferProxy]: '0x4e9aad8184de8833365fea970cd9149372fdf1e6',
                [Sections.ZRXToken]: '0xa8e9fa8f91e5ae138c74648c9c304f1c75003a8d',
                [Sections.TokenRegistry]: '0x6b1a50f0bb5a7995444bd3877b22dc89c62843ed',
            },
            [Networks.Kovan]: {
                [Sections.Exchange]: '0x90fe2af704b34e0224bf2299c838e04d4dcf1364',
                [Sections.TokenTransferProxy]: '0x087Eed4Bc1ee3DE49BeFbd66C662B434B15d49d4',
                [Sections.ZRXToken]: '0x6ff6c0ff1d68b964901f986d4c9fa3ac68346570',
                [Sections.TokenRegistry]: '0xf18e504561f4347bea557f3d4558f559dddbae7f',
            },
            [Networks.Rinkeby]: {
                [Sections.Exchange]: '0x1d16ef40fac01cec8adac2ac49427b9384192c05',
                [Sections.TokenTransferProxy]: '0xa8e9fa8f91e5ae138c74648c9c304f1c75003a8d',
                [Sections.ZRXToken]: '0x00f58d6d585f84b2d7267940cede30ce2fe6eae8',
                [Sections.TokenRegistry]: '0x4e9aad8184de8833365fea970cd9149372fdf1e6',
            },
        },
    },
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
