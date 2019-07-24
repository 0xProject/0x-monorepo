import * as React from 'react';
import { connect } from 'react-redux';
import { DocPage as DocPageComponent, DocPageProps } from 'ts/pages/documentation/doc_page';
import { DocPackages } from 'ts/types';

import { DocsInfoConfig, SupportedDocJson } from '../types';
import { getMapStateToProps, mapDispatchToProps } from '../utils/documentation_container';

/* tslint:disable:no-var-requires */
const IntroMarkdown = require('md/docs/sol_trace/introduction');
const InstallationMarkdown = require('md/docs/sol_trace/installation');
const UsageMarkdown = require('md/docs/sol_trace/usage');
/* tslint:enable:no-var-requires */

const markdownSections = {
    introduction: 'introduction',
    installation: 'installation',
    usage: 'usage',
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.SolTrace,
    packageName: '@0x/sol-trace',
    type: SupportedDocJson.TypeDoc,
    displayName: 'Sol-trace',
    packageUrl: 'https://github.com/0xProject/0x-monorepo/packages/sol-trace',
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
