import * as React from 'react';
import { connect } from 'react-redux';
import { DocPage as DocPageComponent, DocPageProps } from 'ts/pages/documentation/doc_page';
import { DocPackages } from 'ts/types';

import { DocsInfoConfig, SupportedDocJson } from '../types';
import { getMapStateToProps, mapDispatchToProps } from '../utils/documentation_container';

/* tslint:disable:no-var-requires */
const IntroMarkdown = require('md/docs/asset_buyer/introduction');
const InstallationMarkdown = require('md/docs/asset_buyer/installation');
const UsageMarkdown = require('md/docs/asset_buyer/usage');
/* tslint:enable:no-var-requires */

const markdownSections = {
    introduction: 'introduction',
    installation: 'installation',
    usage: 'usage',
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.AssetBuyer,
    packageName: '@0x/asset-buyer',
    type: SupportedDocJson.TypeDoc,
    displayName: 'AssetBuyer',
    packageUrl: 'https://github.com/0xProject/0x-monorepo/packages/asset-buyer',
    markdownMenu: {
        introduction: [markdownSections.introduction],
        install: [markdownSections.installation],
        usage: [markdownSections.usage],
    },
    sectionNameToMarkdownByVersion: {
        '0.0.1': {
            [markdownSections.introduction]: IntroMarkdown,
            [markdownSections.installation]: InstallationMarkdown,
            [markdownSections.usage]: UsageMarkdown,
        },
    },
    markdownSections,
};
const mapStateToProps = getMapStateToProps(docsInfoConfig);

export const Documentation: React.ComponentClass<DocPageProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(DocPageComponent);
