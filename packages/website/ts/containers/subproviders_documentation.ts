import * as React from 'react';
import { connect } from 'react-redux';
import { DocPage as DocPageComponent, DocPageProps } from 'ts/pages/documentation/doc_page';
import { DocPackages } from 'ts/types';

import { DocsInfoConfig, SupportedDocJson } from '../types';
import { getMapStateToProps, mapDispatchToProps } from '../utils/documentation_container';

/* tslint:disable:no-var-requires */
const IntroMarkdown1 = require('md/docs/subproviders/1/introduction');
const InstallationMarkdown1 = require('md/docs/subproviders/1/installation');
const InstallationMarkdown2 = require('md/docs/subproviders/2/installation');
const LedgerNodeHidMarkdown1 = require('md/docs/subproviders/1/ledger_node_hid');
/* tslint:enable:no-var-requires */

const docSections = {
    introduction: 'introduction',
    installation: 'installation',
    ledgerNodeHid: 'ledger-node-hid-issue',
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.Subproviders,
    packageName: '@0x/subproviders',
    type: SupportedDocJson.TypeDoc,
    displayName: 'Subproviders',
    packageUrl: 'https://github.com/0xProject/0x-monorepo/packages/subproviders',
    markdownMenu: {
        'getting-started': [docSections.introduction, docSections.installation, docSections.ledgerNodeHid],
    },
    sectionNameToMarkdownByVersion: {
        '0.0.1': {
            [docSections.introduction]: IntroMarkdown1,
            [docSections.installation]: InstallationMarkdown1,
            [docSections.ledgerNodeHid]: LedgerNodeHidMarkdown1,
        },
        '2.1.0': {
            [docSections.introduction]: IntroMarkdown1,
            [docSections.installation]: InstallationMarkdown2,
            [docSections.ledgerNodeHid]: LedgerNodeHidMarkdown1,
        },
    },
    markdownSections: docSections,
};
const mapStateToProps = getMapStateToProps(docsInfoConfig);

export const Documentation: React.ComponentClass<DocPageProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(DocPageComponent);
