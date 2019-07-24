import * as React from 'react';
import { connect } from 'react-redux';
import { DocPage as DocPageComponent, DocPageProps } from 'ts/pages/documentation/doc_page';
import { DocPackages } from 'ts/types';

import { DocsInfoConfig, SupportedDocJson } from '../types';
import { getMapStateToProps, mapDispatchToProps } from '../utils/documentation_container';

/* tslint:disable:no-var-requires */
const IntroMarkdown1 = require('md/docs/contract_wrappers/1/introduction');
const InstallMarkdownV1 = require('md/docs/contract_wrappers/1/installation');
const InstallMarkdownV2 = require('md/docs/contract_wrappers/2/installation');
/* tslint:enable:no-var-requires */

const markdownSections = {
    introduction: 'introduction',
    installation: 'installation',
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.ContractWrappers,
    packageName: '@0x/contract-wrappers',
    type: SupportedDocJson.TypeDoc,
    displayName: 'Contract Wrappers',
    packageUrl: 'https://github.com/0xProject/0x-monorepo/packages/contract-wrappers',
    markdownMenu: {
        'getting-started': [markdownSections.introduction, markdownSections.installation],
    },
    sectionNameToMarkdownByVersion: {
        '0.0.1': {
            [markdownSections.introduction]: IntroMarkdown1,
            [markdownSections.installation]: InstallMarkdownV1,
        },
        '3.0.0': {
            [markdownSections.introduction]: IntroMarkdown1,
            [markdownSections.installation]: InstallMarkdownV2,
        },
    },
    markdownSections,
};
const mapStateToProps = getMapStateToProps(docsInfoConfig);

export const Documentation: React.ComponentClass<DocPageProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(DocPageComponent);
