import * as React from 'react';
import { connect } from 'react-redux';
import { DocPage as DocPageComponent, DocPageProps } from 'ts/pages/documentation/doc_page';
import { DocPackages } from 'ts/types';

import { DocsInfoConfig, SupportedDocJson } from '../types';
import { getMapStateToProps, mapDispatchToProps } from '../utils/documentation_container';

/* tslint:disable:no-var-requires */
const IntroMarkdown = require('md/docs/sol_profiler/introduction');
const InstallationMarkdown = require('md/docs/sol_profiler/installation');
const UsageMarkdown = require('md/docs/sol_profiler/usage');
/* tslint:enable:no-var-requires */

const markdownSections = {
    introduction: 'introduction',
    installation: 'installation',
    usage: 'usage',
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.SolProfiler,
    packageName: '@0x/sol-profiler',
    type: SupportedDocJson.TypeDoc,
    displayName: 'Sol-profiler',
    packageUrl: 'https://github.com/0xProject/0x-monorepo/packages/sol-profiler',
    markdownMenu: {
        'getting-started': [markdownSections.introduction, markdownSections.installation, markdownSections.usage],
    },
    sectionNameToMarkdownByVersion: {
        '1.0.0': {
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
