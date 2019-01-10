import { DocsInfoConfig, SupportedDocJson } from '@0x/react-docs';
import * as React from 'react';
import { connect } from 'react-redux';
import { DocPage as DocPageComponent, DocPageProps } from 'ts/pages/documentation/doc_page';
import { DocPackages } from 'ts/types';

import { getMapStateToProps, mapDispatchToProps } from '../utils/documentation_container';

/* tslint:disable:no-var-requires */
const IntroMarkdown1 = require('md/docs/order_watcher/1/introduction');
const InstallationMarkdown1 = require('md/docs/order_watcher/1/installation');
const IntroMarkdown2 = require('md/docs/order_watcher/2/introduction');
const InstallationMarkdown2 = require('md/docs/order_watcher/2/installation');
/* tslint:enable:no-var-requires */

const markdownSections = {
    introduction: 'introduction',
    installation: 'installation',
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.OrderWatcher,
    packageName: '@0x/order-watcher',
    type: SupportedDocJson.TypeDoc,
    displayName: 'Order Watcher',
    packageUrl: 'https://github.com/0xProject/0x-monorepo/packages/order-watcher',
    markdownMenu: {
        'getting-started': [markdownSections.introduction, markdownSections.installation],
    },
    sectionNameToMarkdownByVersion: {
        '0.0.1': {
            [markdownSections.introduction]: IntroMarkdown1,
            [markdownSections.installation]: InstallationMarkdown1,
        },
        '2.2.0': {
            [markdownSections.introduction]: IntroMarkdown2,
            [markdownSections.installation]: InstallationMarkdown2,
        },
    },
    markdownSections,
};
const mapStateToProps = getMapStateToProps(docsInfoConfig);

export const Documentation: React.ComponentClass<DocPageProps> = connect(mapStateToProps, mapDispatchToProps)(
    DocPageComponent,
);
