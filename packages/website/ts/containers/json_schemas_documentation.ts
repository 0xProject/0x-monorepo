import * as React from 'react';
import { connect } from 'react-redux';
import { DocPage as DocPageComponent, DocPageProps } from 'ts/pages/documentation/doc_page';
import { DocPackages } from 'ts/types';

import { DocsInfoConfig, SupportedDocJson } from '../types';
import { getMapStateToProps, mapDispatchToProps } from '../utils/documentation_container';

/* tslint:disable:no-var-requires */
const IntroMarkdown1 = require('md/docs/json_schemas/1/introduction');
const IntroMarkdown3 = require('md/docs/json_schemas/3/introduction');
const InstallationMarkdown1 = require('md/docs/json_schemas/1/installation');
const InstallationMarkdown3 = require('md/docs/json_schemas/3/installation');
const usageMarkdown1 = require('md/docs/json_schemas/1/usage');
const usageMarkdown3 = require('md/docs/json_schemas/3/usage');
const SchemasMarkdown1 = require('md/docs/json_schemas/1/schemas');
const SchemasMarkdown2 = require('md/docs/json_schemas/2/schemas');
const SchemasMarkdown3 = require('md/docs/json_schemas/3/schemas');
/* tslint:enable:no-var-requires */

const markdownSections = {
    introduction: 'introduction',
    installation: 'installation',
    usage: 'usage',
    schemas: 'schemas',
};

const docsInfoConfig: DocsInfoConfig = {
    id: DocPackages.JSONSchemas,
    packageName: '@0x/json-schemas',
    type: SupportedDocJson.TypeDoc,
    displayName: 'JSON Schemas',
    packageUrl: 'https://github.com/0xProject/0x-monorepo/packages/json-schemas',
    markdownMenu: {
        'getting-started': [markdownSections.introduction, markdownSections.installation, markdownSections.usage],
        schemas: [markdownSections.schemas],
    },
    sectionNameToMarkdownByVersion: {
        '0.0.1': {
            [markdownSections.introduction]: IntroMarkdown1,
            [markdownSections.installation]: InstallationMarkdown1,
            [markdownSections.schemas]: SchemasMarkdown1,
            [markdownSections.usage]: usageMarkdown1,
        },
        '1.0.0': {
            [markdownSections.introduction]: IntroMarkdown1,
            [markdownSections.installation]: InstallationMarkdown1,
            [markdownSections.schemas]: SchemasMarkdown2,
            [markdownSections.usage]: usageMarkdown1,
        },
        '2.0.0': {
            [markdownSections.introduction]: IntroMarkdown3,
            [markdownSections.installation]: InstallationMarkdown3,
            [markdownSections.schemas]: SchemasMarkdown2,
            [markdownSections.usage]: usageMarkdown3,
        },
        '2.0.1': {
            [markdownSections.introduction]: IntroMarkdown3,
            [markdownSections.installation]: InstallationMarkdown3,
            [markdownSections.schemas]: SchemasMarkdown3,
            [markdownSections.usage]: usageMarkdown3,
        },
    },
    markdownSections,
};
const mapStateToProps = getMapStateToProps(docsInfoConfig);

export const Documentation: React.ComponentClass<DocPageProps> = connect(
    mapStateToProps,
    mapDispatchToProps,
)(DocPageComponent);
