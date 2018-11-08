import { DocsInfo, DocsInfoConfig, SupportedDocJson } from '@0x/react-docs';
import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { DocPage as DocPageComponent, DocPageProps } from 'ts/pages/documentation/doc_page';
import { Dispatcher } from 'ts/redux/dispatcher';
import { State } from 'ts/redux/reducer';
import { DocPackages, ScreenWidths } from 'ts/types';
import { Translate } from 'ts/utils/translate';

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
    packageUrl: 'https://github.com/0xProject/0x-monorepo',
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
const docsInfo = new DocsInfo(docsInfoConfig);

interface ConnectedState {
    docsVersion: string;
    availableDocVersions: string[];
    docsInfo: DocsInfo;
    translate: Translate;
    screenWidth: ScreenWidths;
}

interface ConnectedDispatch {
    dispatcher: Dispatcher;
}

const mapStateToProps = (state: State, _ownProps: DocPageProps): ConnectedState => ({
    docsVersion: state.docsVersion,
    availableDocVersions: state.availableDocVersions,
    translate: state.translate,
    docsInfo,
    screenWidth: state.screenWidth,
});

const mapDispatchToProps = (dispatch: Dispatch<State>): ConnectedDispatch => ({
    dispatcher: new Dispatcher(dispatch),
});

export const Documentation: React.ComponentClass<DocPageProps> = connect(mapStateToProps, mapDispatchToProps)(
    DocPageComponent,
);
