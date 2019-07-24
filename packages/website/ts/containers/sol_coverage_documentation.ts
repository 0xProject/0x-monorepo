import * as React from 'react';
import { connect } from 'react-redux';
import { DocPage as DocPageComponent, DocPageProps } from 'ts/pages/documentation/doc_page';
import { DocPackages } from 'ts/types';

import { DocsInfoConfig, SupportedDocJson } from '../types';
import { getMapStateToProps, mapDispatchToProps } from '../utils/documentation_container';

/* tslint:disable:no-var-requires */
const IntroMarkdown = require('md/docs/sol_coverage/introduction');
const InstallationMarkdown = require('md/docs/sol_coverage/installation');
const UsageMarkdown = require('md/docs/sol_coverage/usage');
/* tslint:enable:no-var-requires */

const markdownSections = {
    introduction: 'introduction',
    installation: 'installation',
    usage: 'usage',
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.SolCoverage,
    packageName: '@0x/sol-coverage',
    type: SupportedDocJson.TypeDoc,
    displayName: 'Sol-coverage',
    packageUrl: 'https://github.com/0xProject/0x-monorepo/packages/sol-coverage',
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
