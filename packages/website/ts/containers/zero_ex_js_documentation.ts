import * as React from 'react';
import { connect } from 'react-redux';
import { DocPage as DocPageComponent, DocPageProps } from 'ts/pages/documentation/doc_page';
import { DocPackages } from 'ts/types';

import { DocsInfoConfig, SupportedDocJson } from '../types';
import { getMapStateToProps, mapDispatchToProps } from '../utils/documentation_container';

/* tslint:disable:no-var-requires */
const IntroMarkdownV0 = require('md/docs/0xjs/0.0.1/introduction');
const InstallationMarkdownV0 = require('md/docs/0xjs/0.0.1/installation');
const AsyncMarkdownV0 = require('md/docs/0xjs/0.0.1/async');
const ErrorsMarkdownV0 = require('md/docs/0xjs/0.0.1/errors');
const versioningMarkdownV0 = require('md/docs/0xjs/0.0.1/versioning');

const IntroMarkdown1 = require('md/docs/0xjs/1.0.1/introduction');
const InstallationMarkdown1 = require('md/docs/0xjs/1.0.1/installation');
const AsyncMarkdownV1 = require('md/docs/0xjs/1.0.1/async');
const ErrorsMarkdownV1 = ErrorsMarkdownV0;
const versioningMarkdownV1 = require('md/docs/0xjs/1.0.1/versioning');

/* tslint:enable:no-var-requires */

const markdownSections = {
    introduction: 'introduction',
    installation: 'installation',
    testrpc: 'testrpc',
    async: 'async',
    errors: 'errors',
    versioning: 'versioning',
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.ZeroExJs,
    packageName: '0x.js',
    type: SupportedDocJson.TypeDoc,
    displayName: '0x.js',
    packageUrl: 'https://github.com/0xProject/0x-monorepo/packages/0x.js',
    markdownMenu: {
        'getting-started': [
            markdownSections.introduction,
            markdownSections.installation,
            markdownSections.async,
            markdownSections.errors,
            markdownSections.versioning,
        ],
    },
    sectionNameToMarkdownByVersion: {
        '0.0.1': {
            [markdownSections.introduction]: IntroMarkdownV0,
            [markdownSections.installation]: InstallationMarkdownV0,
            [markdownSections.versioning]: versioningMarkdownV0,
            [markdownSections.async]: AsyncMarkdownV0,
            [markdownSections.errors]: ErrorsMarkdownV0,
        },
        '1.0.1': {
            [markdownSections.introduction]: IntroMarkdown1,
            [markdownSections.installation]: InstallationMarkdown1,
            [markdownSections.versioning]: versioningMarkdownV1,
            [markdownSections.async]: AsyncMarkdownV1,
            [markdownSections.errors]: ErrorsMarkdownV1,
        },
        '2.0.0': {
            [markdownSections.introduction]: IntroMarkdown1,
            [markdownSections.installation]: InstallationMarkdown1,
            [markdownSections.versioning]: versioningMarkdownV1,
            [markdownSections.async]: AsyncMarkdownV1,
            [markdownSections.errors]: ErrorsMarkdownV1,
        },
    },
    markdownSections,
};
const mapStateToProps = getMapStateToProps(docsInfoConfig);

export const Documentation: React.ComponentClass<DocPageProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(DocPageComponent);
