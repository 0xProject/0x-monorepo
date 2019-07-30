import { DocsInfoConfig, SupportedDocJson } from '@0x/react-docs';
import * as React from 'react';
import { connect } from 'react-redux';
import { DocPage as DocPageComponent, DocPageProps } from 'ts/pages/documentation/doc_page';
import { DocPackages } from 'ts/types';

import { getMapStateToProps, mapDispatchToProps } from '../utils/documentation_container';

/* tslint:disable:no-var-requires */
const IntroMarkdown = require('md/docs/asset_swapper/introduction');
const InstallationMarkdown = require('md/docs/asset_swapper/installation');
/* tslint:enable:no-var-requires */

const markdownSections = {
    introduction: 'introduction',
    installation: 'installation',
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.AssetSwapper,
    packageName: '@0x/asset-swapper',
    type: SupportedDocJson.TypeDoc,
    displayName: 'AssetSwapper',
    packageUrl: 'https://github.com/0xProject/0x-monorepo/packages/asset-swapper',
    markdownMenu: {
        introduction: [markdownSections.introduction],
        install: [markdownSections.installation],
    },
    sectionNameToMarkdownByVersion: {
        '0.0.1': {
            [markdownSections.introduction]: IntroMarkdown,
            [markdownSections.installation]: InstallationMarkdown,
        },
    },
    markdownSections,
};
const mapStateToProps = getMapStateToProps(docsInfoConfig);

export const Documentation: React.ComponentClass<DocPageProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(DocPageComponent);
