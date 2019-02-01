import { DocsInfo, DocsInfoConfig, SupportedDocJson } from '@0x/react-docs';
import { Networks } from '@0x/react-shared';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { DocPage as DocPageComponent, DocPageProps } from 'ts/pages/documentation/doc_page';
import { Dispatcher } from 'ts/redux/dispatcher';
import { State } from 'ts/redux/reducer';
import { DocPackages, ScreenWidths, SmartContractDocSections as Sections } from 'ts/types';
import { Translate } from 'ts/utils/translate';

/* tslint:disable:no-var-requires */
const IntroMarkdown1 = require('md/docs/smart_contracts/1/introduction');
const IntroMarkdown2 = require('md/docs/smart_contracts/2/introduction');
/* tslint:enable:no-var-requires */

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.SmartContracts,
    packageName: 'contracts',
    type: SupportedDocJson.SolDoc,
    displayName: '0x Smart Contracts',
    packageUrl: 'https://github.com/0xProject/contracts',
    markdownMenu: {
        introduction: [Sections.Introduction],
    },
    sectionNameToMarkdownByVersion: {
        '0.0.1': {
            [Sections.Introduction]: IntroMarkdown1,
        },
        '2.0.0': {
            [Sections.Introduction]: IntroMarkdown2,
        },
    },
    markdownSections: {
        Introduction: Sections.Introduction,
    },
    contractsByVersionByNetworkId: {
        '1.0.0': {
            [Networks.Mainnet]: {
                Exchange_v1: '0x12459c951127e0c374ff9105dda097662a027093',
                TokenTransferProxy_v1: '0x8da0d80f5007ef1e431dd2127178d224e32c2ef4',
                TokenRegistry: '0x926a74c5c36adf004c87399e65f75628b0f98d2c',
            },
            [Networks.Ropsten]: {
                Exchange_v1: '0x479cc461fecd078f766ecc58533d6f69580cf3ac',
                TokenTransferProxy_v1: '0x4e9aad8184de8833365fea970cd9149372fdf1e6',
                TokenRegistry: '0x6b1a50f0bb5a7995444bd3877b22dc89c62843ed',
            },
            [Networks.Kovan]: {
                Exchange_v1: '0x90fe2af704b34e0224bf2299c838e04d4dcf1364',
                TokenTransferProxy_v1: '0x087Eed4Bc1ee3DE49BeFbd66C662B434B15d49d4',
                TokenRegistry: '0xf18e504561f4347bea557f3d4558f559dddbae7f',
            },
            [Networks.Rinkeby]: {
                Exchange_v1: '0x1d16ef40fac01cec8adac2ac49427b9384192c05',
                TokenTransferProxy_v1: '0xa8e9fa8f91e5ae138c74648c9c304f1c75003a8d',
                TokenRegistry: '0x4e9aad8184de8833365fea970cd9149372fdf1e6',
            },
        },
        '2.0.0': {
            [Networks.Mainnet]: {
                AssetProxyOwner: '0x17992e4ffb22730138e4b62aaa6367fa9d3699a6',
                ERC20Proxy: '0x2240dab907db71e64d3e0dba4800c83b5c502d4e',
                ERC721Proxy: '0x208e41fb445f1bb1b6780d58356e81405f3e6127',
                Exchange: '0x4f833a24e1f95d70f028921e27040ca56e09ab0b',
                Forwarder: '0x7afc2d5107af94c462a194d2c21b5bdd238709d6',
                OrderValidator: '0x9463e518dea6810309563c81d5266c1b1d149138',
                WETH9: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                ZRXToken: '0xe41d2489571d322189246dafa5ebde1f4699f498',
            },
            [Networks.Ropsten]: {
                AssetProxyOwner: '0xf5fa5b5fed2727a0e44ac67f6772e97977aa358b',
                ERC20Proxy: '0xb1408f4c245a23c31b98d2c626777d4c0d766caa',
                ERC721Proxy: '0xe654aac058bfbf9f83fcaee7793311dd82f6ddb4',
                Exchange: '0x4530c0483a1633c7a1c97d2c53721caff2caaaaf',
                Forwarder: '0x3983e204b12b3c02fb0638caf2cd406a62e0ead3',
                OrderValidator: '0x90431a90516ab49af23a0530e04e8c7836e7122f',
                WETH9: '0xc778417e063141139fce010982780140aa0cd5ab',
                ZRXToken: '0xff67881f8d12f372d91baae9752eb3631ff0ed00',
            },
            [Networks.Kovan]: {
                AssetProxyOwner: '0x2c824d2882baa668e0d5202b1e7f2922278703f8',
                ERC20Proxy: '0xf1ec01d6236d3cd881a0bf0130ea25fe4234003e',
                ERC721Proxy: '0x2a9127c745688a165106c11cd4d647d2220af821',
                Exchange: '0x35dd2932454449b14cee11a94d3674a936d5d7b2',
                Forwarder: '0xd85e2fa7e7e252b27b01bf0d65c946959d2f45b8',
                OrderValidator: '0xb389da3d204b412df2f75c6afb3d0a7ce0bc283d',
                WETH9: '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
                ZRXToken: '0x2002d3812f58e35f0ea1ffbf80a75a38c32175fa',
            },
        },
    },
};
const docsInfo = new DocsInfo(docsInfoConfig);

interface ConnectedState {
    docsVersion: string;
    availableDocVersions: string[];
    translate: Translate;
    screenWidth: ScreenWidths;
}

interface ConnectedDispatch {
    dispatcher: Dispatcher;
    docsInfo: DocsInfo;
}

const mapStateToProps = (state: State, _ownProps: DocPageProps): ConnectedState => ({
    docsVersion: state.docsVersion,
    availableDocVersions: state.availableDocVersions,
    translate: state.translate,
    screenWidth: state.screenWidth,
});

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
    docsInfo,
});

export const Documentation: React.ComponentClass<DocPageProps> = connect(mapStateToProps, mapDispatchToProps)(
    DocPageComponent,
);
