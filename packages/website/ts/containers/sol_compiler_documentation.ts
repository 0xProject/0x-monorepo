import * as React from 'react';
import { connect } from 'react-redux';
import { DocPage as DocPageComponent, DocPageProps } from 'ts/pages/documentation/doc_page';
import { DocPackages } from 'ts/types';

import { DocsInfoConfig, SupportedDocJson } from '../types';
import { getMapStateToProps, mapDispatchToProps } from '../utils/documentation_container';

/* tslint:disable:no-var-requires */
const IntroMarkdown1 = require('md/docs/sol-compiler/1/introduction');
const InstallationMarkdown1 = require('md/docs/sol-compiler/1/installation');
const InstallationMarkdown2 = require('md/docs/sol-compiler/2/installation');
const UsageMarkdown1 = require('md/docs/sol-compiler/1/usage');
const UsageMarkdown2 = require('md/docs/sol-compiler/2/usage');
/* tslint:enable:no-var-requires */

const markdownSections = {
    introduction: 'introduction',
    installation: 'installation',
    usage: 'usage',
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.SolCompiler,
    packageName: '@0x/sol-compiler',
    type: SupportedDocJson.TypeDoc,
    displayName: 'Solidity Compiler',
    packageUrl: 'https://github.com/0xProject/0x-monorepo/packages/sol-compiler',
    markdownMenu: {
        'getting-started': [markdownSections.introduction, markdownSections.installation, markdownSections.usage],
    },
    sectionNameToMarkdownByVersion: {
        '0.0.1': {
            [markdownSections.introduction]: IntroMarkdown1,
            [markdownSections.installation]: InstallationMarkdown1,
            [markdownSections.usage]: UsageMarkdown1,
        },
        '1.1.8': {
            [markdownSections.introduction]: IntroMarkdown1,
            [markdownSections.installation]: InstallationMarkdown2,
            [markdownSections.usage]: UsageMarkdown2,
        },
    },
    markdownSections,
};
const mapStateToProps = getMapStateToProps(docsInfoConfig);

export const Documentation: React.ComponentClass<DocPageProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(DocPageComponent);
